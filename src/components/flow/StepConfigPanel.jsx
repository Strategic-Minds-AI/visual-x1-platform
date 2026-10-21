import React from "react";
import { Panel, PrimaryButton, Empty } from "@/components/admin/adminUi";
import { stepTypeById } from "@/data/flowCatalog";

// The step's own settings. Only the fields its type actually reads are shown, so a
// step cannot be configured into something the runner will ignore.
export default function StepConfigPanel({ step, onChange, onDone }) {
  const spec = step ? stepTypeById(step.type) : null;
  if (!step || !spec) {
    return (
      <Panel kicker="STEP SETTINGS">
        <Empty>Select a step on the canvas to configure it.</Empty>
      </Panel>
    );
  }

  const setConfig = (key, value) => onChange({ ...step, config: { ...step.config, [key]: value } });

  return (
    <Panel
      kicker="STEP SETTINGS"
      title={spec.label}
      aside={<PrimaryButton onClick={onDone}>DONE</PrimaryButton>}
    >
      <p className="cp-fine">{spec.hint}</p>

      <label className="cp-fine" style={{ display: "block", marginTop: 10 }}>Label</label>
      <input className="cp-field" style={{ width: "100%" }} value={step.label || ""} onChange={(e) => onChange({ ...step, label: e.target.value })} />

      {spec.fields.map((field) => {
        const value = step.config?.[field.key] ?? (field.type === "multiselect" ? [] : "");
        return (
          <div key={field.key} style={{ marginTop: 10 }}>
            <label className="cp-fine" style={{ display: "block" }}>{field.label}</label>

            {field.type === "textarea" && (
              <textarea
                className="cp-field"
                rows={3}
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => setConfig(field.key, e.target.value)}
              />
            )}

            {field.type === "select" && (
              <select className="cp-field" style={{ width: "100%" }} value={value} onChange={(e) => setConfig(field.key, e.target.value)}>
                <option value="">— choose —</option>
                {(field.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}

            {field.type === "multiselect" && (
              <div className="cp-admin-inline-field" style={{ flexWrap: "wrap" }}>
                {(field.options || []).map((o) => {
                  const on = Array.isArray(value) && value.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setConfig(field.key, on ? value.filter((v) => v !== o) : [...(value || []), o])}
                      className={`ve-pill ${on ? "selected" : ""}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            )}

            {(field.type === "text" || field.type === "number") && (
              <input
                className="cp-field"
                style={{ width: "100%" }}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => setConfig(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
              />
            )}
          </div>
        );
      })}

      <label className="cp-fine" style={{ display: "block", marginTop: 12 }}>If this step fails</label>
      <select className="cp-field" style={{ width: "100%" }} value={step.on_fail || "stop"} onChange={(e) => onChange({ ...step, on_fail: e.target.value })}>
        <option value="stop">Stop the flow</option>
        <option value="continue">Continue to the next step</option>
      </select>
    </Panel>
  );
}