import React from "react";
import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TestTube2,
  Undo2,
  UploadCloud,
  Wand2,
  X
} from "lucide-react";
import { DEVICES } from "@/components/visualeditor/editorNav";

function Pill({ Icon, label, title, onClick, disabled, busy, active, className = "" }) {
  return (
    <button
      type="button"
      className={`ve-pill${active ? " selected" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled || Boolean(busy)}
      title={title || label}
      aria-pressed={active || undefined}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      <span className="ve-pill-label">{label}</span>
    </button>
  );
}

/**
 * The editor's own tools, directly over the editor screen, laid out left to right as
 * the workflow runs: point at or template the work, generate it, put it through QA,
 * the validator and the test agent, take its source from GitHub or Vercel, then roll
 * it back, publish it or deploy it. The far right holds the screen's own actions —
 * open the artifact, and open another visual project.
 */
export default function EditorToolbar({ pointer, build, verify, source, release, screen, devices }) {
  return (
    <div className="ve-toolbar">
      <div className="ve-toolbar-track">
        <Pill
          Icon={MousePointerClick}
          label="POINT"
          active={pointer.active}
          onClick={pointer.onToggle}
          title="Point, click and highlight an element on the canvas to edit it"
        />
        {source.templates}
        <span className="ve-toolbar-rule" aria-hidden="true" />
        <Pill
          Icon={Wand2}
          label="GENERATE"
          onClick={build.onGenerate}
          disabled={!build.canGenerate}
          busy={build.running}
          title="Generate the artifact from the request in the composer"
        />
        <Pill Icon={RefreshCw} label="REGENERATE" onClick={build.onRegenerate} disabled={!build.canRegenerate} title="Run the last request again" />
        <span className="ve-toolbar-rule" aria-hidden="true" />
        <Pill
          Icon={BadgeCheck}
          label="QA"
          onClick={verify.onQA}
          busy={verify.running === "qa"}
          disabled={!verify.ready || Boolean(verify.running)}
          title="Content QA — SEO, GEO and AEO with findings"
        />
        <Pill
          Icon={ShieldCheck}
          label="VALIDATOR"
          onClick={verify.onValidator}
          busy={verify.running === "validator"}
          disabled={!verify.ready || Boolean(verify.running)}
          title="Independent validator — a separate pass over the rendered document"
        />
        <Pill
          Icon={TestTube2}
          label="TEST"
          onClick={verify.onTest}
          busy={verify.running === "test"}
          disabled={!verify.ready || Boolean(verify.running)}
          title="Test agent — measured probes on the document, then an agent's report"
        />
        <span className="ve-toolbar-rule" aria-hidden="true" />
        {source.github}
        {source.vercel}
        <span className="ve-toolbar-rule" aria-hidden="true" />
        <Pill Icon={Undo2} label="ROLLBACK" onClick={release.onRollback} disabled={!release.canRollback} title="Put the previous artifact back on the canvas" />
        <Pill
          Icon={UploadCloud}
          label="PUBLISH"
          onClick={release.onPublish}
          disabled={!release.canPublish}
          busy={release.publishing}
          title="Publish this artifact: a public link and a release record"
        />
        <Pill
          Icon={Rocket}
          label="DEPLOY"
          onClick={release.onDeploy}
          disabled={!release.canDeploy}
          busy={release.deploying}
          title={release.deployTarget ? `Deploy ${release.deployTarget} on Vercel` : "Pick a Vercel project in the Vercel menu first"}
        />
      </div>

      <div className="ve-toolbar-right">
        {/* The canvas's own device frames, on the bar directly above the canvas. */}
        <div className="ve-devices" role="group" aria-label="Preview device">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => devices.onDevice(id)}
              title={label}
              aria-label={label}
              aria-pressed={devices.device === id}
              className={devices.device === id ? "selected" : ""}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <span className="ve-toolbar-rule" aria-hidden="true" />
        {pointer.target && (
          <span className="ve-picked" title={pointer.target.path}>
            <MousePointerClick size={11} />
            <span>{pointer.target.path || pointer.target.tag}</span>
            <button type="button" onClick={pointer.onClear} aria-label="Clear the captured element">
              <X size={11} />
            </button>
          </span>
        )}
        <Pill Icon={ExternalLink} label="OPEN" onClick={screen.onOpen} disabled={!screen.canOpen} title="Open the artifact in a new tab" />
        <Pill
          Icon={Plus}
          label="NEW PROJECT"
          onClick={screen.onNewProject}
          className="ve-new-project"
          title="Open another visual project in its own tab"
        />
      </div>
    </div>
  );
}