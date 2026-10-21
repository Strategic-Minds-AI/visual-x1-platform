import { useCallback, useEffect, useRef, useState } from "react";
import { askOrchestrator, transformPrompt } from "@/lib/loopApi";

// The chat dock's brain. Every message the operator types is transformed into a
// production prompt first — the transformer is the comment system — and the
// transformed text is what the orchestrator actually receives. The thread is kept
// in local storage so a reload does not lose the conversation.
const STORE_KEY = "x1-orchestrator-thread";
const MAX_STORED = 40;

const loadThread = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function useAgentChat({ onError } = {}) {
  const [messages, setMessages] = useState(loadThread);
  const [sending, setSending] = useState(false);
  const [transform, setTransform] = useState(true);
  const [lastTransformed, setLastTransformed] = useState("");
  const [error, setError] = useState("");
  const [boundaries, setBoundaries] = useState([]);
  const [stepsUsed, setStepsUsed] = useState(null);
  const threadRef = useRef(messages);
  threadRef.current = messages;

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage is a convenience, not a requirement */
    }
  }, [messages]);

  const send = useCallback(
    async (text, { skipTransform = false } = {}) => {
      const raw = String(text || "").trim();
      if (!raw || sending) return;
      setError("");
      setSending(true);
      const userMessage = { role: "user", content: raw };
      setMessages((prev) => [...prev, userMessage]);

      try {
        let outgoing = raw;
        if (transform && !skipTransform) {
          const transformed = await transformPrompt(raw.slice(0, 1900), "website");
          outgoing = transformed?.advanced || raw;
          setLastTransformed(outgoing);
        } else {
          setLastTransformed("");
        }

        const history = threadRef.current.slice(-8).map((m) => ({ role: m.role, content: m.content }));
        const result = await askOrchestrator(outgoing, history, 8);
        if (result?.error) throw new Error(result.error);

        setBoundaries(result?.boundaries || []);
        setStepsUsed(result?.steps_used ?? null);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result?.answer || "The orchestrator returned no written answer.",
            trail: result?.trail || [],
          },
        ]);
      } catch (e) {
        setError(e?.message || "The orchestrator could not be reached.");
        onError?.(e);
      } finally {
        setSending(false);
      }
    },
    [sending, transform, onError]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setLastTransformed("");
    setBoundaries([]);
    setError("");
  }, []);

  return {
    messages,
    sending,
    transform,
    setTransform,
    lastTransformed,
    error,
    setError,
    boundaries,
    stepsUsed,
    send,
    clear,
  };
}