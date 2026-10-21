import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Smartphone, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ChatThread from "@/components/chat/ChatThread";
import ChatComposer from "@/components/chat/ChatComposer";
import { useAgentChat } from "@/hooks/useAgentChat";
import { onChatCommand } from "@/lib/chatBus";

// The operator's chat rail: a tab at the console's right edge that slides the
// conversation in and out. The orchestrator behind it has the full operating
// surface; everything typed here reaches it as a transformed prompt.
const AGENT_ID = "x1_orchestrator";

export default function RightChatDock() {
  const [open, setOpen] = useState(false);
  const chat = useAgentChat();
  const scrollRef = useRef(null);
  // Subscribed once: the send function changes identity as its own state moves, so
  // it is read through a ref rather than re-subscribing the bus on every render.
  const sendRef = useRef(chat.send);
  sendRef.current = chat.send;

  // The architecture checklist (or anything else) can hand the dock a command.
  useEffect(
    () =>
      onChatCommand((command) => {
        setOpen(true);
        if (command?.prompt) sendRef.current(command.prompt);
      }),
    []
  );

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, chat.messages, chat.sending]);

  // The WhatsApp connect link is the platform's own handshake: it authenticates on
  // the phone, so the operator reaches this same orchestrator from their mobile.
  const whatsappUrl = (() => {
    try {
      return base44.agents.getWhatsAppConnectURL(AGENT_ID);
    } catch {
      return "";
    }
  })();

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the agent chat"
          className="fixed right-0 top-1/2 z-[60] -translate-y-1/2 rounded-l-xl border border-r-0 border-border/60 bg-popover/90 px-2 py-3 backdrop-blur-xl transition-colors hover:border-primary/60"
        >
          <span className="flex flex-col items-center gap-2">
            <MessageSquare size={15} className="text-primary" />
            <span className="[writing-mode:vertical-rl] text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Agent
            </span>
          </span>
        </button>
      )}

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[70] flex w-[380px] max-w-[94vw] flex-col border-l border-border/60 bg-background/95 backdrop-blur-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="cp-kicker mb-0.5">X1 Orchestrator</p>
            <p className="text-[11px] text-muted-foreground">
              {chat.stepsUsed === null ? "Full operating access" : `Last run used ${chat.stepsUsed} step(s)`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title="Connect this agent to WhatsApp on your phone"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Smartphone size={14} />
              </a>
            )}
            <button
              type="button"
              onClick={chat.clear}
              title="Clear the thread"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the agent chat"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <ChatThread messages={chat.messages} sending={chat.sending} error={chat.error} />
          {chat.boundaries.length > 0 && (
            <div className="mx-4 mb-4 rounded-xl border border-border/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Boundaries of this run</p>
              <ul className="mt-1 space-y-0.5">
                {chat.boundaries.map((b) => (
                  <li key={b} className="text-[11px] text-muted-foreground">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ChatComposer
          onSend={(text) => chat.send(text)}
          sending={chat.sending}
          transform={chat.transform}
          setTransform={chat.setTransform}
          lastTransformed={chat.lastTransformed}
        />
      </aside>
    </>
  );
}