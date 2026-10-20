import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import useEditorEngine from "@/hooks/useEditorEngine";
import EditorSidebar from "@/components/visualeditor/EditorSidebar";
import EditorTopBar from "@/components/visualeditor/EditorTopBar";
import EditorChat from "@/components/visualeditor/EditorChat";
import EditorCanvas from "@/components/visualeditor/EditorCanvas";
import PromptPipeline from "@/components/admin/PromptPipeline";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";
import { CANVAS_VIEWS, COMPOSER_MODES } from "@/components/visualeditor/editorNav";
import "@/styles/x1-visual-editor.css";

const STATUS = (engine, sending) => {
  if (sending) return "THINKING";
  if (engine.loading.render) return "RENDERING";
  if (engine.loading.chain) return "RUNNING CHAIN";
  if (engine.loading.convert) return "CONVERTING";
  if (engine.loading.simulate) return "SIMULATING";
  return "READY";
};

/**
 * The Visual Editor: the Xtreme AutoBuilder's builder shell (agent chat, prompt
 * composer, artifact canvas, device frames) running inside the operator console's
 * own portal shell, with the prompt system as one of its two composer panels and
 * the simulator/chain panels as canvas views.
 */
export default function VisualEditorStudio() {
  const engine = useEditorEngine();
  const [leftMode, setLeftMode] = useState("chat");
  const [canvasView, setCanvasView] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [navOpen, setNavOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const busy =
    sending || engine.loading.render || engine.loading.convert || engine.loading.simulate || engine.loading.chain;
  const status = STATUS(engine, sending);
  const view = `${COMPOSER_MODES.find((m) => m.id === leftMode)?.label} · ${
    CANVAS_VIEWS.find((v) => v.id === canvasView)?.label
  }`;

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

  // Build = render the request (or a chip's request) into a real artifact.
  const render = (overridePrompt) => {
    setCanvasView("preview");
    if (overridePrompt) engine.setInput(overridePrompt);
    engine.handleRender(overridePrompt);
  };

  return (
    <div className="cp-site">
      <div className="cp-portal-shell ve-shell">
        {navOpen && (
          <button className="cp-sidebar-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
        )}

        <EditorSidebar
          leftMode={leftMode}
          canvasView={canvasView}
          navOpen={navOpen}
          onClose={() => setNavOpen(false)}
          onPickComposer={(id) => {
            setLeftMode(id);
            setNavOpen(false);
          }}
          onPickCanvas={(id) => {
            setCanvasView(id);
            setNavOpen(false);
          }}
        />

        <div className="cp-portal-main ve-main">
          <EditorTopBar
            view={view}
            device={device}
            onDevice={setDevice}
            status={status}
            busy={busy}
            onOpenNav={() => setNavOpen(true)}
          />

          <div className="cp-portal-content ve-content">
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

          <footer className="ve-footer">
            <span>VISUAL EDITOR · BUILDER SHELL</span>
            <span>PROMPT SYSTEM DRIVES THE CANVAS</span>
          </footer>
        </div>
      </div>
    </div>
  );
}