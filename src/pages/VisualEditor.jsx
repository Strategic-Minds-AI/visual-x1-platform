import React, { useState } from "react";
import EditorTopBar from "@/components/visualeditor/EditorTopBar";
import EditorToolRail from "@/components/visualeditor/EditorToolRail";
import EditorChat from "@/components/visualeditor/EditorChat";
import EditorOutputPanel from "@/components/editor/EditorOutputPanel";
import useEditorEngine from "@/hooks/useEditorEngine";

/**
 * Visual Editor: one workspace, three bands.
 * Thin vertical tool rail on the far left, the chat UI beside it, and the canvas
 * on the right. Everything is wired to the same engine, so a tool in the rail, a
 * tab on the canvas and an action in the chat all drive one shared state.
 */
export default function VisualEditor() {
  const engine = useEditorEngine();
  const [activeTab, setActiveTab] = useState("preview");

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar />
      <div className="flex flex-1 overflow-hidden">
        <EditorToolRail activeTab={activeTab} onSelectTool={setActiveTab} />
        <EditorChat engine={engine} onSelectTool={setActiveTab} />
        <div className="flex-1 min-w-0">
          <EditorOutputPanel
            engine={engine}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSendToChat={(t) => engine.setInput(t)}
          />
        </div>
      </div>
    </div>
  );
}