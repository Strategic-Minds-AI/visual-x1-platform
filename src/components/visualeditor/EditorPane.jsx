import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import useEditorEngine from "@/hooks/useEditorEngine";
import EditorTopBar from "@/components/visualeditor/EditorTopBar";
import EditorChat from "@/components/visualeditor/EditorChat";
import EditorCanvas from "@/components/visualeditor/EditorCanvas";
import PromptSystemPanel from "@/components/visualeditor/PromptSystemPanel";
import SimulatorResults from "@/components/editor/SimulatorResults";
import PromptChainBuilder from "@/components/editor/PromptChainBuilder";
import EditorTaskbar from "@/components/visualeditor/EditorTaskbar";
import EditorToolbar from "@/components/visualeditor/EditorToolbar";
import EditorAgentResults from "@/components/visualeditor/EditorAgentResults";
import EditorTemplateMenu from "@/components/visualeditor/EditorTemplateMenu";
import EditorGithubMenu from "@/components/visualeditor/EditorGithubMenu";
import EditorVercelMenu from "@/components/visualeditor/EditorVercelMenu";
import useEditorTools from "@/hooks/useEditorTools";
import useVercelEditor from "@/hooks/useVercelEditor";
import useGithubEditor from "@/hooks/useGithubEditor";
import { MOBILE_TABS } from "@/components/visualeditor/editorNav";

const STATUS = (engine, sending) => {
  if (sending) return "THINKING";
  if (engine.loading.render) return "RENDERING";
  if (engine.loading.chain) return "RUNNING CHAIN";
  if (engine.loading.convert) return "CONVERTING";
  if (engine.loading.simulate) return "SIMULATING";
  return "READY";
};

/**
 * One page of the Visual Editor: the thread, the artifact and the view it was left
 * on. The workspace above mounts one of these per tab, keyed on the tab id, seeding
 * it from that tab's stored snapshot and writing every change back — so switching
 * tabs pulls up exactly the page the tab was left on.
 *
 * The row reads rail, composer, canvas, with the editor's own bottom bar under it.
 * When the console hands it the rail (the `rail` prop), that rail is the thin column
 * flush to the left; the composer column follows it, and the artifact canvas takes
 * the rest. The canvas views, the devices and refresh live in that bottom bar, along
 * with the search.
 */
export default function EditorPane({
  rail,
  railOpen = false,
  initial,
  onSnapshot,
  onName,
  projectName,
  tabs = [],
  onSelectTab,
  onNewProject,
}) {
  const engine = useEditorEngine(initial);
  const tools = useEditorTools({ engine, projectName });
  const vercel = useVercelEditor({ say: tools.say, openSource: tools.openSource });
  const github = useGithubEditor({ say: tools.say, openSource: tools.openSource });
  const [leftMode, setLeftMode] = useState(initial?.leftMode || "chat");
  const [canvasView, setCanvasView] = useState(initial?.canvasView || "preview");
  const [device, setDevice] = useState(initial?.device || "desktop");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mobilePane, setMobilePane] = useState("composer");
  const [refreshTick, setRefreshTick] = useState(0);
  const [sending, setSending] = useState(false);

  const busy =
    sending || engine.loading.render || engine.loading.convert || engine.loading.simulate || engine.loading.chain;
  const status = STATUS(engine, sending);

  // What this tab remembers: its whole page, minus the unsent draft in the composer.
  const snapshot = useMemo(
    () => ({
      messages: engine.messages,
      previewHtml: engine.previewHtml,
      simulatorResult: engine.simulatorResult,
      chain: engine.chain,
      chainResult: engine.chainResult,
      canvasView,
      device,
      leftMode,
    }),
    [
      engine.messages,
      engine.previewHtml,
      engine.simulatorResult,
      engine.chain,
      engine.chainResult,
      canvasView,
      device,
      leftMode,
    ]
  );

  useEffect(() => {
    onSnapshot?.(snapshot);
  }, [snapshot, onSnapshot]);

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
    onName?.(text);
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
    onName?.(overridePrompt || engine.input);
    if (overridePrompt) engine.setInput(overridePrompt);
    tools.generate(overridePrompt);
  };

  // The bottom bar's search hands its request to the same pipelines the composer
  // does: a question goes to the agent, through the composer it already reads.
  const askAgent = (text) => {
    pickComposer("chat");
    engine.setInput(text);
  };

  // A template's own fields become the request in the composer, because the composer
  // is where every build starts.
  const useTemplate = (text) => {
    pickComposer("chat");
    engine.setInput(text);
  };

  // The toolbar's controls, grouped as the workflow runs left to right: point and
  // template the work, generate it, put it through QA, the validator and the test
  // agent, take its source from GitHub or Vercel, then roll back, publish or deploy.
  const toolbar = {
    pointer: {
      active: tools.pointerActive,
      target: tools.pointerTarget,
      onToggle: tools.togglePointer,
      onClear: tools.clearPointer,
    },
    build: {
      onGenerate: () => render(),
      onRegenerate: tools.regenerate,
      canGenerate: Boolean(engine.input.trim()),
      canRegenerate: tools.canRegenerate,
      running: engine.loading.render || engine.loading.chain,
    },
    verify: { onQA: tools.runQA, onValidator: tools.runValidator, onTest: tools.runTest, running: tools.busy, ready: tools.hasArtifact },
    source: {
      templates: <EditorTemplateMenu onUse={useTemplate} />,
      github: <EditorGithubMenu github={github} />,
      vercel: <EditorVercelMenu vercel={vercel} />,
    },
    release: {
      onRollback: tools.rollback,
      canRollback: tools.canRollback,
      onPublish: tools.publish,
      publishing: tools.busy === "publish",
      canPublish: tools.hasArtifact,
      onDeploy: () => vercel.deploy(),
      deploying: vercel.busy === "deploy",
      canDeploy: Boolean(vercel.selected),
      deployTarget: vercel.selected?.name || "",
    },
    screen: { onOpen: tools.openArtifact, canOpen: tools.hasArtifact, onNewProject },
  };

  return (
    <>
      <EditorTopBar
        projectName={projectName}
        panelCollapsed={panelCollapsed}
        onTogglePanel={() => setPanelCollapsed((v) => !v)}
      />

      <div className="ve-split" data-pane={mobilePane}>
        {/* The console's own rail, thinned to icon tiles, flush to the left of the
            composer column — the way into the rest of the system from inside the
            editor, where the package's own toolbar sits. */}
        {rail && <div className={"ve-railcol" + (railOpen ? " is-open" : "")}>{rail}</div>}

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

        <div className="ve-canvascol">
          {/* Every editor tool sits directly over the editor screen, in one bar. */}
          <EditorToolbar {...toolbar} />

          {canvasView === "preview" && (
            <EditorCanvas
              device={device}
              previewHtml={engine.previewHtml}
              refreshTick={refreshTick}
              pickMode={tools.pointerActive}
              onPick={tools.handlePicked}
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
          const active = id === "canvas" ? mobilePane === "canvas" : mobilePane === "composer" && leftMode === id;
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

      <EditorTaskbar
        canvasView={canvasView}
        onCanvas={pickCanvas}
        device={device}
        onDevice={setDevice}
        onRefresh={() => setRefreshTick((t) => t + 1)}
        status={status}
        busy={busy}
        tabs={tabs}
        onSelectTab={onSelectTab}
        onBuild={render}
        onAsk={askAgent}
      />

      <EditorAgentResults
        open={tools.reportOpen}
        onOpenChange={tools.setReportOpen}
        report={tools.report}
        onRegenerate={tools.regenerate}
      />
    </>
  );
}