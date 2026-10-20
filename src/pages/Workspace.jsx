import React, { useState } from "react";
import useEditorEngine from "@/hooks/useEditorEngine";
import WorkspaceChat from "@/components/workspace/WorkspaceChat";
import EditorOutputPanel from "@/components/editor/EditorOutputPanel";

export default function Workspace() {
  const engine = useEditorEngine();
  const [tab, setTab] = useState("preview");

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="h-1/2 md:h-full md:w-[46%] lg:w-[40%] xl:w-[36%] shrink-0 border-b md:border-b-0 md:border-r border-border min-w-0">
        <WorkspaceChat engine={engine} onShowTab={setTab} />
      </div>
      <div className="h-1/2 md:h-full flex-1 min-w-0">
        <EditorOutputPanel engine={engine} activeTab={tab} setActiveTab={setTab} onSendToChat={(t) => engine.setInput(t)} />
      </div>
    </div>
  );
}