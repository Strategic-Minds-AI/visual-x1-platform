import React, { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

const EMAIL = "jeremy@strategicmindsai.com";

// X1's own four-question frontend discovery demo (variant c). Answers stay in the
// browser until the visitor chooses to open a prefilled email draft.
const STEPS = [
  { field: "business", label: "Business or industry", title: "Tell Eden about your business.", placeholder: "For example: Residential construction" },
  { field: "goal", label: "Your highest priority", title: "What should AI help you with first?", options: ["Capture and qualify leads", "Automate repetitive tasks", "Build an AI website", "Create AI agents", "Organize business data", "Explore my opportunities"] },
  { field: "market", label: "Service area or market", title: "Where are you hoping to grow?", placeholder: "For example: South Florida" },
  { field: "notes", label: "A final thought (optional)", title: "What else would you like Eden to know?", placeholder: "A challenge, an idea or a dream", optional: true },
];

export default function X1Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ business: "", goal: "", market: "", notes: "" });
  const [done, setDone] = useState(false);
  const q = STEPS[step];
  const value = data[q.field] || "";
  const ok = q.optional || value.trim().length > 0;

  const body = [
    "Strategic Minds AI - voluntary discovery request", "",
    "Business or industry: " + data.business,
    "AI priority: " + data.goal,
    "Target market: " + data.market,
    "Notes: " + (data.notes || "No additional notes"),
  ].join("\n");
  const mailto = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Strategic Minds AI | New discovery request") + "&body=" + encodeURIComponent(body);

  return (
    <section className="v2-section v2-onboarding" id="onboarding">
      <div className="v2-wrap">
        <div className="v2-onboarding-panel">
          <div className="v2-heading">
            <p className="v2-eyebrow">START WITH EDEN</p>
            <h2>Your AI discovery journey.</h2>
            <p>Four simple questions. No overwhelming forms.</p>
          </div>
          <div className="v2-steps" aria-label="Onboarding progress">
            {STEPS.map((s, i) => <span key={s.field} className={i <= step ? "is-current" : ""} />)}
          </div>
          {!done ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!ok) return;
              if (step === STEPS.length - 1) setDone(true); else setStep((x) => x + 1);
            }}>
              <p className="v2-step-count">QUESTION {step + 1} OF 4</p>
              <h3>{q.title}</h3>
              <label htmlFor={"v2-field-" + q.field}>{q.label}</label>
              {q.options ? (
                <select id={"v2-field-" + q.field} value={value} onChange={(e) => setData({ ...data, [q.field]: e.target.value })}>
                  <option value="">Choose one</option>
                  {q.options.map((v) => <option key={v}>{v}</option>)}
                </select>
              ) : (
                <input id={"v2-field-" + q.field} value={value} type="text" autoComplete="off" maxLength={180} placeholder={q.placeholder}
                  onChange={(e) => setData({ ...data, [q.field]: e.target.value })} />
              )}
              <div className="v2-form-actions">
                {step > 0 && <button type="button" className="v2-quiet" onClick={() => setStep((s) => s - 1)}>BACK</button>}
                <button type="submit" className="v2-alt-cta" disabled={!ok}>
                  {step === 3 ? "REVIEW MY ANSWERS" : "CONTINUE"} <ArrowRight size={17} />
                </button>
              </div>
            </form>
          ) : (
            <div className="v2-finished" role="status">
              <h3>Your discovery brief is ready.</h3>
              <p><strong>Business:</strong> {data.business}</p>
              <p><strong>Goal:</strong> {data.goal}</p>
              <p><strong>Market:</strong> {data.market}</p>
              <p>No details have been sent to any server. You can choose to open a prefilled email draft.</p>
              <div className="v2-form-actions">
                <button type="button" className="v2-quiet" onClick={() => { setStep(0); setDone(false); }}>EDIT</button>
                <a href={mailto} className="v2-alt-cta">OPEN EMAIL DRAFT <ArrowRight size={18} /></a>
              </div>
            </div>
          )}
          <p className="v2-privacy"><ShieldCheck size={15} /> Answers remain in this browser until you choose to share them.</p>
        </div>
      </div>
    </section>
  );
}