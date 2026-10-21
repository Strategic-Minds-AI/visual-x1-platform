import React from "react";
import ReactMarkdown from "react-markdown";
import ToolTrail from "@/components/chat/ToolTrail";

// The conversation. A user message shows what the operator typed; an assistant
// message shows what the orchestrator answered plus the calls it made.
export default function ChatThread({ messages, sending, error }) {
  if (!messages.length && !sending) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nothing said yet. Describe the outcome you want — it is transformed into a production prompt before the
          orchestrator receives it, so a short sentence is enough.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {messages.map((message, index) => (
        <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              message.role === "user"
                ? "max-w-[85%] rounded-2xl bg-primary/15 px-3.5 py-2.5 text-sm text-foreground"
                : "max-w-[92%] text-sm text-foreground/90"
            }
          >
            {message.role === "user" ? (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : (
              <div className="prose-sm leading-relaxed [&_code]:font-mono [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4">
                <ReactMarkdown>{message.content || ""}</ReactMarkdown>
              </div>
            )}
            <ToolTrail trail={message.trail} />
          </div>
        </div>
      ))}

      {sending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Working — transforming, then running
        </div>
      )}

      {error && <p className="cp-admin-error">{error}</p>}
    </div>
  );
}