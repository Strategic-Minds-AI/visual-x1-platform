import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const HISTORY_CAP = 5;

/** The artifact's own visible words, read from the document rather than guessed. */
function documentText(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

const listOf = (value, map) => (Array.isArray(value) ? value.filter(Boolean).map(map) : []);

/**
 * The editor's tool belt: the artifact's own operations — generate and regenerate,
 * the QA, validator and test-agent passes, rollback, publish — and the pointer tool
 * that turns a point at the canvas into a targeted edit. Every action reports what
 * actually happened into the thread, and the agent passes open their report.
 */
export default function useEditorTools({ engine, projectName }) {
  const [busy, setBusy] = useState("");
  const [report, setReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [pointerActive, setPointerActive] = useState(false);
  const [pointerTarget, setPointerTarget] = useState(null);
  const seenRef = useRef(engine.previewHtml);

  const say = useCallback(
    (name, content, type = "text") => engine.addMessage({ role: "assistant", name, content, type }),
    [engine]
  );

  // However an artifact reached the canvas — a chat build, a chain run, a captured
  // source, the search bar — the one before it is kept, so rollback has something real.
  useEffect(() => {
    if (engine.previewHtml === seenRef.current) return;
    const previous = seenRef.current;
    seenRef.current = engine.previewHtml;
    if (previous) setHistory((held) => [...held, previous].slice(-HISTORY_CAP));
  }, [engine.previewHtml]);

  const generate = useCallback(
    (text) => {
      const prompt = (text ?? engine.input).trim();
      if (!prompt) return;
      setLastPrompt(prompt);
      engine.handleRender(prompt);
    },
    [engine]
  );

  const regenerate = useCallback(() => {
    if (!lastPrompt) return;
    engine.handleRender(lastPrompt);
  }, [engine, lastPrompt]);

  const rollback = useCallback(() => {
    if (!history.length) return;
    const html = history[history.length - 1];
    setHistory((held) => held.slice(0, -1));
    seenRef.current = html;
    engine.setPreviewHtml(html);
    const stillHeld = history.length - 1;
    say("Editor", `Rolled the canvas back to the previous artifact (${html.length.toLocaleString()} characters). ${stillHeld} older build${stillHeld === 1 ? "" : "s"} still held.`);
  }, [engine, history, say]);

  const openArtifact = useCallback(() => {
    if (!engine.previewHtml) return;
    const url = URL.createObjectURL(new Blob([engine.previewHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [engine.previewHtml]);

  // A Vercel project or a GitHub repository opened here goes through the app's own
  // capture pipeline: the source is measured and specified, then rendered as an
  // artifact the operator can point at and edit.
  const openSource = useCallback(
    async ({ url, name, sourceType = "url", label }) => {
      setBusy("capture");
      say("Editor", `Capturing ${label || name} into this project…`);
      try {
        const captured = await base44.functions.invoke("ingestClone", { name, source_type: sourceType, url });
        const data = captured.data || {};
        if (data.error) {
          say("Editor", data.error, "error");
          return;
        }
        const project = data.project || {};
        const signature = data.signature || {};
        say("Editor", `Captured ${name}: ${signature.html_length ? `${signature.html_length.toLocaleString()} characters read` : "the source was read"}${signature.title ? `, titled “${signature.title}”` : ""}. Rendering it onto the canvas…`);
        const rendered = await base44.functions.invoke("renderPreview", { prompt: project.build_prompt || name });
        const html = rendered.data?.html || "";
        if (!html) {
          say("Editor", "The capture produced nothing to render.", "error");
          return;
        }
        engine.setPreviewHtml(html);
        say("Editor", `${name} is on the canvas (${html.length.toLocaleString()} characters). Point at an element with the point tool, or describe the change in the chat, then generate.`);
      } catch (e) {
        say("Editor", e?.response?.data?.error || e.message || "The capture failed.", "error");
      } finally {
        setBusy("");
      }
    },
    [engine, say]
  );

  const togglePointer = useCallback(() => setPointerActive((on) => !on), []);
  const clearPointer = useCallback(() => setPointerTarget(null), []);

  const handlePicked = useCallback(
    (element) => {
      setPointerTarget(element);
      setPointerActive(false);
      const where = element.path || element.tag;
      const snippet = element.text ? ` Its current text reads “${element.text}”.` : "";
      engine.setInput(`Targeted edit on ${where}.${snippet} Change: `);
      say("Editor", `Element captured: ${where}${element.href ? ` → ${element.href}` : ""}. The edit is waiting in the composer — describe the change and generate.`);
    },
    [engine, say]
  );

  const runQA = useCallback(async () => {
    if (!engine.previewHtml) {
      say("QA", "Render an artifact first: the content pass judges the page's own copy.", "error");
      return;
    }
    setBusy("qa");
    try {
      const res = await base44.functions.invoke("judgePageContent", {
        content: documentText(engine.previewHtml).slice(0, 12000),
        target_keyword: projectName || ""
      });
      const data = res.data || {};
      if (data.error) {
        say("QA", data.error, "error");
        return;
      }
      setReport({
        title: "CONTENT QA",
        verdict: `${data.overall ?? 0}/100 average across SEO, GEO and AEO`,
        stats: [
          { label: "SEO", value: data.seo_score ?? 0 },
          { label: "GEO", value: data.geo_score ?? 0 },
          { label: "AEO", value: data.aeo_score ?? 0 }
        ],
        lists: [
          { label: "FINDINGS", items: listOf(data.findings, (f) => `${String(f.severity || "note").toUpperCase()} · ${f.area || "content"} — ${f.issue || ""}${f.fix ? ` → fix: ${f.fix}` : ""}`) },
          { label: "QUICK WINS", items: listOf(data.quick_wins, String) },
          { label: "KEYWORDS WORTH TARGETING", items: listOf(data.keyword_suggestions, String) }
        ],
        note: data.summary || ""
      });
      setReportOpen(true);
      say("QA", `Content QA finished — ${data.overall ?? 0}/100 average, ${(data.findings || []).length} finding(s). The report is open.`);
    } catch (e) {
      say("QA", e?.response?.data?.error || e.message || "The QA pass failed.", "error");
    } finally {
      setBusy("");
    }
  }, [engine, projectName, say]);

  const runValidator = useCallback(async () => {
    if (!engine.previewHtml || engine.previewHtml.length < 100) {
      say("VALIDATOR", "Render an artifact first: the validator judges the rendered document.", "error");
      return;
    }
    setBusy("validator");
    try {
      const res = await base44.functions.invoke("independentValidation", {
        html: engine.previewHtml,
        brief: lastPrompt || projectName || ""
      });
      const data = res.data || {};
      if (data.error) {
        say("VALIDATOR", data.error, "error");
        return;
      }
      const v = data.validation || {};
      setReport({
        title: "INDEPENDENT VALIDATOR",
        verdict: `${v.total_score ?? 0}/100 · ${String(v.decision || "no decision").toUpperCase()}`,
        stats: [
          { label: "VISUAL", value: v.visual_parity ?? 0 },
          { label: "FUNCTION", value: v.functionality ?? 0 },
          { label: "ACCESS", value: v.accessibility ?? 0 },
          { label: "RESPONSIVE", value: v.responsive_ux ?? 0 },
          { label: "PERF", value: v.performance ?? 0 },
          { label: "SECURITY", value: v.security ?? 0 },
          { label: "SEO", value: v.content_trust_seo ?? 0 },
          { label: "RELIABILITY", value: v.reliability ?? 0 }
        ],
        lists: [{ label: "FINDINGS", items: listOf(v.findings, String) }],
        note: v.evidence_summary || "A separate pass over the rendered document, not over the prompt that produced it."
      });
      setReportOpen(true);
      say("VALIDATOR", `Independent validation: ${v.total_score ?? 0}/100, decision ${v.decision || "unknown"}. The report is open.`);
    } catch (e) {
      say("VALIDATOR", e?.response?.data?.error || e.message || "The validation pass failed.", "error");
    } finally {
      setBusy("");
    }
  }, [engine, lastPrompt, projectName, say]);

  const runTest = useCallback(async () => {
    if (!engine.previewHtml) {
      say("TEST AGENT", "Render an artifact first, or open a live page from the Vercel menu.", "error");
      return;
    }
    setBusy("test");
    try {
      const res = await base44.functions.invoke("testArtifact", {
        html: engine.previewHtml,
        name: projectName || "Visual X artifact",
        project_id: projectName || ""
      });
      const data = res.data || {};
      if (data.error) {
        say("TEST AGENT", data.error, "error");
        return;
      }
      const agent = data.agent || {};
      const failed = (data.probes || []).filter((p) => p.result === "FAIL");
      setReport({
        title: "TEST AGENT",
        verdict: `${agent.verdict || "REPORTED"} · ${data.passed ?? 0} of ${(data.passed ?? 0) + (data.failed ?? 0)} probes passed`,
        stats: [
          { label: "PASSED", value: data.passed ?? 0 },
          { label: "FAILED", value: data.failed ?? 0 },
          { label: "NOT RUN", value: data.not_run ?? 0 },
          { label: "SCORE", value: data.score ?? 0 }
        ],
        lists: [
          { label: "PROBES THAT FAILED", items: failed.map((p) => `${p.label} — found ${p.found}`) },
          { label: "AGENT FINDINGS", items: listOf(agent.findings, (f) => `${String(f.severity || "note").toUpperCase()} · ${f.probe || "probe"} — ${f.finding || ""}${f.evidence ? ` (evidence: ${f.evidence})` : ""}`) },
          { label: "WHAT THIS RUN COULD NOT TEST", items: listOf(agent.could_not_test, String) }
        ],
        note: agent.summary || ""
      });
      setReportOpen(true);
      say("TEST AGENT", `Test run recorded: ${data.passed ?? 0} passed, ${data.failed ?? 0} failed, ${data.not_run ?? 0} not run${data.record_id ? `, saved as test result ${data.record_id}` : ""}. The report is open.`);
    } catch (e) {
      say("TEST AGENT", e?.response?.data?.error || e.message || "The test run failed.", "error");
    } finally {
      setBusy("");
    }
  }, [engine, projectName, say]);

  const publish = useCallback(async () => {
    if (!engine.previewHtml) {
      say("PUBLISH", "Render an artifact first: publishing uploads the document on the canvas.", "error");
      return;
    }
    setBusy("publish");
    try {
      const slug =
        String(projectName || "visual-x-artifact")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) || "visual-x-artifact";
      const file = new File([engine.previewHtml], `${slug}.html`, { type: "text/html" });
      const upload = await base44.integrations.Core.UploadPublicFile({ file });
      const url = upload?.file_url || "";
      const record = await base44.entities.Deployment.create({
        project_id: projectName || "visual editor",
        url,
        environment: "production",
        status: "live",
        provider: "visual-x publisher",
        deployed_at: new Date().toISOString(),
        receipt: JSON.stringify({ characters: engine.previewHtml.length, published_from: "visual editor" })
      });
      say("PUBLISH", `Published. The artifact is a public page at ${url}, and release record ${record.id} was written.`);
    } catch (e) {
      say("PUBLISH", e?.response?.data?.error || e.message || "The publish failed.", "error");
    } finally {
      setBusy("");
    }
  }, [engine, projectName, say]);

  return {
    busy,
    say,
    lastPrompt,
    canRegenerate: Boolean(lastPrompt),
    hasArtifact: Boolean(engine.previewHtml),
    generate,
    regenerate,
    canRollback: history.length > 0,
    rollback,
    pointerActive,
    pointerTarget,
    togglePointer,
    clearPointer,
    handlePicked,
    openArtifact,
    openSource,
    runQA,
    runValidator,
    runTest,
    publish,
    report,
    reportOpen,
    setReportOpen
  };
}