import React from "react";
import ToolTrail from "@/components/workspace/ToolTrail";

// One message in the editor's chat. The operator's own turns are marked with their
// side of the thread; assistant turns carry the agent's action trail, a converted
// prompt arrives as preformatted text, and errors are marked.
export default function ChatBubble({ role, name, content, type, tools }) {
  const user = role === "user";

  return (
    <div className={`ve-msg${user ? " is-user" : ""}`}>
      {user && (
        <span className="ve-avatar is-user" aria-hidden="true">
          YOU
        </span>
      )}
      <div>
        {!user && name && <p className="ve-name">{name}</p>}
        <div className={`ve-bubble${type === "error" ? " is-error" : ""}`}>
          {type === "prompt" ? <pre>{content}</pre> : <p>{content}</p>}
        </div>
        {tools?.length ? <ToolTrail trail={tools} /> : null}
      </div>
    </div>
  );
}