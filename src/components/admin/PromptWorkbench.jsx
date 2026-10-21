import React, { useState } from "react";
import { Sparkles, PenLine } from "lucide-react";
import PromptPipeline from "@/components/admin/PromptPipeline";
import WebsiteSelfEditStudio from "@/components/promptsystem/WebsiteSelfEditStudio";

// The prompt system's two categories. "System Chain" is the module chain every
// build runs through; "Website Self-Edit" is the category that edits this site
// itself, with the simulation, preview and agent loop beside it.
const CATEGORIES = [
  { id: "chain", label: "System Chain", Icon: Sparkles },
  { id: "self_edit", label: "Website Self-Edit", Icon: PenLine },
];

export default function PromptWorkbench() {
  const [category, setCategory] = useState("self_edit");

  return (
    <div className="cp-admin-stack">
      <div className="cp-admin-actions">
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={category === id ? "cp-green-button" : "cp-outline"}
            onClick={() => setCategory(id)}
            aria-pressed={category === id}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {category === "chain" ? <PromptPipeline /> : <WebsiteSelfEditStudio />}
    </div>
  );
}