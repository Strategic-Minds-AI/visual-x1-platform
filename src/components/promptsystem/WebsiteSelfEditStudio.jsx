import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Panel, OutlineButton, LinkButton } from "@/components/admin/adminUi";
import { pipelineError } from "@/lib/adminPipelines";
import { stageEditorHandoff } from "@/lib/editorHandoff";
import { ALL_EDIT_ITEMS, STUDIO_AGENTS } from "@/data/websiteEditCatalog";
import { artifactText, benchmarkLine, buildWebsiteEditPrompt, emptySelection, transformerBrief } from "@/lib/websiteEditPrompt";
import EditCapabilityGrid from "@/components/promptsystem/website/EditCapabilityGrid";
import PromptTypeSelect from "@/components/promptsystem/website/PromptTypeSelect";
import ColorSystemPanel from "@/components/promptsystem/website/ColorSystemPanel";
import BenchmarkPicker from "@/components/promptsystem/website/BenchmarkPicker";
import ConstraintPicker from "@/components/promptsystem/website/ConstraintPicker";
import AgentPicker from "@/components/promptsystem/website/AgentPicker";
import StudioActions from "@/components/promptsystem/website/StudioActions";
import PromptOutput from "@/components/promptsystem/website/PromptOutput";
import StudioPreview from "@/components/promptsystem/website/StudioPreview";
import AgentReadout from "@/components/promptsystem/website/AgentReadout";

// The Website Self-Edit prompt category: the site this system runs, edited through
// the prompt system rather than by hand. Every capability is a tick, every rule a
// choice, the palette a set of colours with a live effect swatch, the benchmark a
// page of this site or any URL, and the loop — simulate, preview, validate, test,
// judge — runs as many times as it takes. The artifact it produces goes onto the
// Visual Editor canvas, where the prompt system page or the AI chat carries on.
export default function WebsiteSelfEditStudio() {
  const navigate = useNavigate();
  const [state, setState] = useState(emptySelection);
  const [iterations, setIterations] = useState("");
  const [assembled, setAssembled] = useState("");
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [simulation, setSimulation] = useState(null);
  const [validation, setValidation] = useState(null);
  const [test, setTest] = useState(null);
  const [content, setContent] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const siteUrl = window.location.origin;
  const active = prompt || assembled;
  const patch = (next) => setState((current) => ({ ...current, ...next }));
  const toggleIn = (key, id) =>
    setState((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((x) => x !== id) : [...current[key], id],
    }));

  const run = async (id, fn) => {
    setBusy(id);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(pipelineError(e));
    } finally {
      setBusy("");
    }
  };

  const build = () => {
    setAssembled(buildWebsiteEditPrompt(state, { siteUrl, iterations }));
    setNote("Assembled from everything ticked. Transform it to put it through the prompt transformer.");
  };

  const transform = () =>
    run("transform", async () => {
      const res = await base44.functions.invoke("convertPrompt", {
        sentence: transformerBrief(state, active),
        category: "Website Self-Edit",
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setPrompt(data.advanced || "");
      setNote("The transformer rewrote the brief into a production prompt, with the domain's benchmark references attached.");
    });

  const readBenchmark = () =>
    run("benchmark", async () => {
      const url =
        state.benchmark.mode === "url"
          ? state.benchmark.url
          : state.benchmark.mode === "library"
            ? state.benchmark.reference?.url
            : `${siteUrl}${state.benchmark.route}`;
      if (!url) throw new Error("Choose a page, a URL or a library reference first.");
      const res = await base44.functions.invoke("fetchWebPage", { url });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      patch({
        benchmark: {
          ...state.benchmark,
          evidence: `Measured baseline: ${url} — HTTP ${data.status || "unknown"}, title “${data.title || "untitled"}”, ${Number(
            data.html_length || (data.html || "").length || 0
          ).toLocaleString()} characters.`,
        },
      });
      setNote(`Benchmark read: ${url}. It is now carried in the prompt as the measured baseline.`);
    });

  const simulate = () =>
    run("simulate", async () => {
      const res = await base44.functions.invoke("promptSimulator", { prompt: active });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setSimulation(data);
      setNote("Simulated by the QA agent, the structure validator, the recommender, the enhancer and the negative flagger.");
    });

  const preview = () =>
    run("preview", async () => {
      const res = await base44.functions.invoke("renderPreview", { prompt: active });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setHtml(data.html || "");
      // A new artifact invalidates the readouts of the old one, so they are cleared
      // rather than left standing beside a document they never measured.
      setValidation(null);
      setTest(null);
      setContent(null);
      setNote("Rendered. The artifact readouts were cleared: they described the previous document. Simulate and preview again as often as you like.");
    });

  const validate = () =>
    run("validate", async () => {
      const res = await base44.functions.invoke("independentValidation", {
        html,
        brief: state.brief,
        industry: "website self-edit",
        benchmark_context: benchmarkLine(state.benchmark),
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setValidation(data);
    });

  const runTest = () =>
    run("test", async () => {
      const res = await base44.functions.invoke("testArtifact", { html, name: "Website self-edit artifact", project_id: siteUrl });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setTest(data);
    });

  const judge = () =>
    run("judge", async () => {
      // The judge reads the page's visible copy, taken from the artifact itself.
      const res = await base44.functions.invoke("judgePageContent", {
        content: artifactText(html),
        industry: "website self-edit",
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setContent(data);
    });

  const applyEnhanced = () => {
    const enhanced = simulation?.enhancement?.enhanced_prompt;
    if (!enhanced) return;
    setPrompt(enhanced);
    setNote("The enhancer's rewrite is now the working prompt.");
  };

  const handoff = (mode) => {
    stageEditorHandoff({ html, prompt: active, mode });
    navigate("/admin?section=visualeditor");
  };

  return (
    <div className="cp-admin-stack">
      <Panel
        kicker="WEBSITE SELF-EDIT"
        title="Edit this site from the prompt system"
        aside={<span className="cp-state-pill">PROMPT CATEGORY</span>}
      >
        <textarea
          className="cp-field"
          rows={3}
          value={state.brief}
          onChange={(e) => patch({ brief: e.target.value })}
          placeholder="Describe the change to this website — the page, the section, the behaviour, and what it should do instead."
        />
        <p className="cp-fine">
          {state.capabilities.length} of {ALL_EDIT_ITEMS.length} editing capabilities ticked · target {siteUrl} · the change is made
          on this site, not on a new one.
        </p>
        <div className="cp-admin-actions">
          <OutlineButton onClick={build}>Build the prompt</OutlineButton>
          <LinkButton onClick={() => { setState(emptySelection()); setAssembled(""); setPrompt(""); setHtml(""); setSimulation(null); setValidation(null); setTest(null); setContent(null); setNote(""); setError(""); }}>
            CLEAR EVERYTHING
          </LinkButton>
        </div>
        <div className="mt-4">
          <p className="cp-kicker">ITERATION NOTES</p>
          <textarea
            className="cp-field"
            rows={2}
            value={iterations}
            onChange={(e) => setIterations(e.target.value)}
            placeholder="What to change from the last artifact — “keep the layout, make the hero copy shorter and add the local phone number”."
          />
          <p className="cp-fine">
            Stay on this page to iterate: build again with the notes added, simulate, preview, and re-validate. Or send the artifact
            to the Visual Editor and carry on there, in the prompt system or the AI chat.
          </p>
        </div>
      </Panel>

      <PromptTypeSelect value={state.promptType} onChange={(promptType) => patch({ promptType })} />

      <Panel
        kicker="EDITING CAPABILITIES"
        title={`${state.capabilities.length} selected`}
        aside={<LinkButton onClick={() => patch({ capabilities: ALL_EDIT_ITEMS.map((i) => i.id) })}>TAKE EVERYTHING</LinkButton>}
      >
        <EditCapabilityGrid
          selected={state.capabilities}
          onToggle={(id) => toggleIn("capabilities", id)}
          onGroup={(ids, clear) =>
            patch({
              capabilities: clear
                ? state.capabilities.filter((id) => !ids.includes(id))
                : Array.from(new Set([...state.capabilities, ...ids])),
            })
          }
        />
      </Panel>

      <ConstraintPicker
        mandatories={state.mandatories}
        restrictions={state.restrictions}
        onChange={(next) => patch(next)}
      />

      <ColorSystemPanel
        colors={state.colors}
        effect={state.effect}
        onColor={(role, value) => patch({ colors: { ...state.colors, [role]: value } })}
        onEffect={(effect) => patch({ effect })}
      />

      <BenchmarkPicker benchmark={state.benchmark} onChange={(benchmark) => patch({ benchmark })} />

      <AgentPicker
        selected={state.agents}
        onToggle={(id) => toggleIn("agents", id)}
        onAll={() => patch({ agents: state.agents.length === STUDIO_AGENTS.length ? [] : STUDIO_AGENTS.map((a) => a.id) })}
      />

      <StudioActions
        busy={busy}
        error={error}
        note={note}
        hasPrompt={Boolean(active)}
        hasHtml={Boolean(html)}
        actions={{
          build,
          transform,
          readBenchmark,
          simulate,
          preview,
          validate,
          test: runTest,
          judge,
          applyEnhanced,
          canApplyEnhanced: Boolean(simulation?.enhancement?.enhanced_prompt),
          note: note,
        }}
      />

      <PromptOutput assembled={assembled} prompt={prompt} onUseAssembled={() => { setPrompt(""); setNote("The assembled brief is the working prompt again."); }} />

      <StudioPreview
        html={html}
        onSendToEditor={() => handoff("prompt")}
        onContinueInChat={() => handoff("chat")}
      />

      <AgentReadout simulation={simulation} validation={validation} test={test} content={content} />
    </div>
  );
}