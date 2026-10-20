import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useEditorEngine from "@/hooks/useEditorEngine";
import EditorTopBar from "@/components/visualeditor/EditorTopBar";
import EditorChat from "@/components/visualeditor/EditorChat";
import EditorCanvas from "@/components/visualeditor/EditorCanvas";
import PromptSystemPanel from "@/components/visualeditor/PromptSystemPanel";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";
import { MOBILE_TABS } from "@/components/visualeditor/editorNav";
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
 * The Visual Editor, as a section of the operator console. It keeps the builder
 * shell's layout — one header bar, then the composer column beside a full-bleed
 * artifact canvas, and a single pane with bottom tabs on phones. When the console
 * hands it the rail (the `rail` prop), that rail sits between the composer and the
 * canvas, so the row reads composer, rail, canvas — while running on
 * this app's own backend: the autonomy agent for conversation, the render pipeline
 * for builds, the prompt system's convert/simulate/chain for everything else. The
 * prompt system is the composer column's second mode, so a module and the canvas
 * it produces share one workspace.
 */
export default function VisualEditorWorkspace({ rail, railOpen = false }) {
  const engine = useEditorEngine();
  const [leftMode, setLeftMode] = useState("chat");
  const [canvasView, setCanvasView] = useState("preview");
  const [device, setDevice] = useState("desktop");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mobilePane, setMobilePane] = useState("composer");
  const [refreshTick, setRefreshTick] = useState(0);
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

  const pickCanvas = (id) => {
    setCanvasView(id);
    setMobilePane("canvas");
  };
  const pickComposer = (id) => {
    setLeftMode(id);
    setMobilePane("composer");
    setPanelCollapsed(false);
  };

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
    pickCanvas("preview");
    if (overridePrompt) engine.setInput(overridePrompt);
    engine.handleRender(overridePrompt);
  };

  return (
    <div className="ve-section">
      <section className="cp-portal-panel ve-shell">
        <EditorTopBar
          projectName={projectName}
          canvasView={canvasView}
          device={device}
          panelCollapsed={panelCollapsed}
          onCanvas={pickCanvas}
          onDevice={setDevice}
          onRefresh={() => setRefreshTick((t) => t + 1)}
          onTogglePanel={() => setPanelCollapsed((v) => !v)}
        />

        <div className="ve-split" data-pane={mobilePane}>
          {!panelCollapsed && (
            <div className="ve-chatcol">
              {leftMode === "chat" ? (
                <EditorChat
                  engine={engine}
                  busy={busy}
                  status={status}
                  leftMode={leftMode}
                  onComposer={pickComposer}
                  onSend={send}
                  onRender={render}
                  onConvert={engine.handleConvert}
                  onSimulate={() => {
                    pickCanvas("simulator");
                    engine.handleSimulate();
                  }}
                  onAddToChain={() => {
                    pickCanvas("chain");
                    engine.handleAddToChain();
                  }}
                />
              ) : (
                <PromptSystemPanel leftMode={leftMode} onComposer={pickComposer} />
              )}
            </div>
          )}

          {/* The console's own rail, thinned to icon tiles, sitting between the
              composer column and the canvas — the way into the rest of the system
              from inside the editor. */}
          {rail && <div className={"ve-railcol" + (railOpen ? " is-open" : "")}>{rail}</div>}

          <div className="ve-canvascol">
            {canvasView === "preview" && (
              <EditorCanvas
                device={device}
                previewHtml={engine.previewHtml}
                projectName={projectName}
                isRunning={engine.loading.render || engine.loading.chain}
                refreshTick={refreshTick}
              />
            )}
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
          </div>
        </div>

        <nav className="ve-mobile-nav" aria-label="Editor panes">
          {MOBILE_TABS.map(({ id, label, Icon }) => {
            const active =
              id === "canvas" ? mobilePane === "canvas" : mobilePane === "composer" && leftMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => (id === "canvas" ? pickCanvas(canvasView) : pickComposer(id))}
                className={active ? "selected" : ""}
                aria-pressed={active}
              >
                <Icon size={17} />
                {label.toUpperCase()}
              </button>
            );
          })}
        </nav>
      </section>
    </div>
  );
}