import { useState } from "react";
import { base44 } from "@/api/base44Client";

const WELCOME = {
  role: "assistant",
  name: "Visual Editor",
  type: "text",
  content: "Describe what you want to build. Render gives you the artifact on the right; Chain runs the steps in order; Browser reads live pages; Multi-Agent puts several agents on one problem."
};

/**
 * One engine, shared by the standalone Visual Editor page and the workspace.
 * Keeps the editor's actions in a single place so both surfaces behave identically.
 */
export default function useEditorEngine() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [chain, setChain] = useState([]);
  const [chainResult, setChainResult] = useState(null);
  const [loading, setLoading] = useState({ convert: false, simulate: false, render: false, chain: false });

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleConvert = async () => {
    if (!input.trim()) return;
    addMessage({ role: "user", content: input, type: "text" });
    setLoading((l) => ({ ...l, convert: true }));
    try {
      const res = await base44.functions.invoke("convertPrompt", { sentence: input, category: "general" });
      addMessage({ role: "assistant", name: "Editor", content: res.data.advanced, type: "prompt" });
      setInput(res.data.advanced);
    } catch (e) {
      addMessage({ role: "assistant", name: "Editor", content: e?.response?.data?.error || "Conversion failed.", type: "error" });
    } finally {
      setLoading((l) => ({ ...l, convert: false }));
    }
  };

  const handleSimulate = async () => {
    if (!input.trim()) return;
    addMessage({ role: "user", content: `Simulating: ${input.slice(0, 80)}...`, type: "text" });
    setLoading((l) => ({ ...l, simulate: true }));
    try {
      const res = await base44.functions.invoke("promptSimulator", { prompt: input });
      setSimulatorResult(res.data);
      addMessage({
        role: "assistant",
        name: "Editor",
        content: `Simulation complete — QA score ${res.data.qa_review?.score || 0}/100, ${res.data.negative_flags?.length || 0} flags. Full result on the right.`,
        type: "text"
      });
    } catch (e) {
      addMessage({ role: "assistant", name: "Editor", content: "Simulation failed.", type: "error" });
    } finally {
      setLoading((l) => ({ ...l, simulate: false }));
    }
  };

  // An optional prompt lets a caller render text it just produced (a suggestion
  // chip, a loaded module) instead of waiting for the composer's state to settle.
  const handleRender = async (overridePrompt) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt) return;
    addMessage({ role: "user", content: `Rendering: ${prompt.slice(0, 80)}...`, type: "text" });
    setLoading((l) => ({ ...l, render: true }));
    try {
      const res = await base44.functions.invoke("renderPreview", { prompt });
      setPreviewHtml(res.data.html || "");
      addMessage({ role: "assistant", name: "Editor", content: `Rendered ${(res.data.html || "").length.toLocaleString()} characters of HTML. Open it on the right.`, type: "text" });
    } catch (e) {
      addMessage({ role: "assistant", name: "Editor", content: "Render failed.", type: "error" });
    } finally {
      setLoading((l) => ({ ...l, render: false }));
    }
  };

  const handleAddToChain = () => {
    if (!input.trim()) return;
    setChain((prev) => [...prev, { id: Date.now(), prompt: input.trim() }]);
    addMessage({ role: "assistant", name: "Editor", content: `Added to chain (step ${chain.length + 1}). Open the Chain tab on the right.`, type: "text" });
  };

  const handleExecuteChain = async () => {
    if (chain.length === 0) return;
    setLoading((l) => ({ ...l, chain: true }));
    setChainResult(null);
    try {
      let context = "";
      for (let i = 0; i < chain.length; i++) {
        const res = await base44.functions.invoke("convertPrompt", { sentence: chain[i].prompt, category: "general" });
        context = res.data.advanced;
        if (i < chain.length - 1) chain[i].output = context;
      }
      const renderRes = await base44.functions.invoke("renderPreview", { prompt: chain[chain.length - 1].prompt, context });
      setPreviewHtml(renderRes.data.html || "");
      setChainResult(context);
      addMessage({ role: "assistant", name: "Editor", content: `Chain executed (${chain.length} steps). Final artifact is on the right.`, type: "text" });
    } catch (e) {
      addMessage({ role: "assistant", name: "Editor", content: "Chain execution failed.", type: "error" });
    } finally {
      setLoading((l) => ({ ...l, chain: false }));
    }
  };

  const useEnhanced = (enhanced) => {
    setInput(enhanced);
    addMessage({ role: "assistant", name: "Editor", content: "Enhanced prompt loaded into the composer.", type: "text" });
  };

  return {
    messages, addMessage, input, setInput, loading,
    previewHtml, setPreviewHtml, simulatorResult, chain, setChain, chainResult,
    handleConvert, handleSimulate, handleRender, handleAddToChain, handleExecuteChain, useEnhanced
  };
}