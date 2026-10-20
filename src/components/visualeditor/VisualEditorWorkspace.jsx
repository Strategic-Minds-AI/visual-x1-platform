import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useEditorEngine from "@/hooks/useEditorEngine";
import EditorBand from "@/components/visualeditor/EditorBand";
import EditorChat from "@/components/visualeditor/EditorChat";
import EditorCanvas from "@/components/visualeditor/EditorCanvas";
import PromptPipeline from "@/components/admin/PromptPipeline";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";

const STATUS = (engine, sending) => {
  if (sending) return "THINKING";
  if (engine.loading.render) return "RENDERING";
  if (engine.loading.chain) return "RUNNING CHAIN";
  if (engine.loading.convert) return "CONVERTING";
  if (engine.loading.simulate) return "SIMULATING";
  return "READY";
};

/**
 * The Visual Editor, as a section of the operator console. It keeps the builder
 * shell's layout — header band, composer column, artifact canvas, device frames —
 * while running on this app's own backend: the autonomy agent for conversation,
 * the render pipeline for builds, the prompt system's convert/simulate/chain for
 * everything else. The prompt system is one of the two composer panels, so a
 * prompt module and the canvas it produces live in the same workspace.
 */
export default function VisualEditorWorkspace() {
  const engine = useEditorEngine();
  const [leftMode, setLeftMode] = useState("chat");
  const [canvasView, setCanvasView] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [sending, setSending] = useState(false);
  const [projectName, setProjectName] = useState("Untitled build");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Project.list({ sort: "-created_date", limit: 1 });
        const record = (res.items || [])[0];
        if (record) setProjectName(record.title || record.name || "Untitled build");
      } catch {
        // the editor works without a project record
      }
    })();
  }, []);

  const busy =
    sending || engine.loading.render || engine.loading.convert || engine.loading.simulate || engine.loading.chain;
  const status = STATUS(engine, sending);

  // "Ask agent" routes the request to the app's own autonomy chat, which reads and
  // writes app records and calls the pipeline functions.
  const send = async () => {
    const text = engine.input.trim();
    if (!text || sending) return;
    engine.addMessage({ role: "user", content: text, type: "text" });
    engine.setInput("");
    setSending(true);
    try {
      const history = engine.messages.slice(-8).map((m) => ({ role: m.role, content: String(m.content || "") }));
      const res = await base44.functions.invoke("autonomyChat", { message: text, max_steps: 8, history });
      const data = res.data || {};
      if (data.error) {
        engine.addMessage({ role: "assistant", name: "Autonomy", content: data.error, type: "error" });
      } else {
        engine.addMessage({
          role: "assistant",
          name: `Autonomy · ${data.steps_used || 0} step${data.steps_used === 1 ? "" : "s"}`,
          content: data.answer || "No answer returned.",
          type: "text",
          tools: data.trail || [],
        });
      }
    } catch (e) {
      engine.addMessage({
        role: "assistant",
        name: "Autonomy",
        content: e?.response?.data?.error || "The request failed.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  // Build = render the request (or a suggestion chip's request) into a real artifact.
  const render = (overridePrompt) => {
    setCanvasView("preview");
    if (overridePrompt) engine.setInput(overridePrompt);
    engine.handleRender(overridePrompt);
  };

  return (
    <div className="ve-section">
      <EditorBand
        projectName={projectName}
        leftMode={leftMode}
        canvasView={canvasView}
        device={device}
        status={status}
        busy={busy}
        onComposer={setLeftMode}
        onCanvas={setCanvasView}
        onDevice={setDevice}
      />

      <div className="ve-grid">
        <div className="ve-col">
          <section className="cp-portal-panel ve-panel">
            {leftMode === "chat" ? (
              <EditorChat
                engine={engine}
                busy={busy}
                status={status}
                onSend={send}
                onRender={render}
                onConvert={engine.handleConvert}
                onSimulate={() => {
                  setCanvasView("simulator");
                  engine.handleSimulate();
                }}
                onAddToChain={engine.handleAddToChain}
                onExecuteChain={() => {
                  setCanvasView("chain");
                  engine.handleExecuteChain();
                }}
              />
            ) : (
              <div className="ve-scroll-soft">
                <PromptPipeline />
              </div>
            )}
          </section>
        </div>

        <div className="ve-col">
          <section className="cp-portal-panel ve-panel">
            {canvasView === "preview" && <EditorCanvas device={device} previewHtml={engine.previewHtml} />}
            {canvasView === "simulator" && (
              <div className="ve-scroll-soft">
                <SimulatorResults result={engine.simulatorResult} onUseEnhanced={engine.useEnhanced} />
              </div>
            )}
            {canvasView === "chain" && (
              <div className="ve-scroll-soft">
                <PromptChainBuilder
                  chain={engine.chain}
                  setChain={engine.setChain}
                  onExecute={engine.handleExecuteChain}
                  executing={engine.loading.chain}
                  executionResult={engine.chainResult}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}