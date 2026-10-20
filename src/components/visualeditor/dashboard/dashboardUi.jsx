import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy as CopyIcon, ExternalLink, Loader2 } from "lucide-react";

/** One section of the project dashboard: its title, its scope, then its body. */
export function Section({ title, note, actions, children }) {
  return (
    <section className="ve-sec">
      <header className="ve-sec-head">
        <div>
          <h2 className="ve-sec-title">{title}</h2>
          {note && <p className="ve-sec-note">{note}</p>}
        </div>
        {actions && <div className="ve-sec-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** One measured fact: a label, the number, and what the number counts. */
export function Metric({ label, value, note }) {
  return (
    <div className="ve-metric">
      <em>{label}</em>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

export const MetricGrid = ({ items }) => (
  <div className="ve-metrics">
    {items.map((item) => (
      <Metric key={item.label} {...item} />
    ))}
  </div>
);

/** One record, as it reads: what it is, what it says, and any control it offers. */
export function Row({ name, detail, meta, children }) {
  return (
    <li className="ve-row">
      <div className="ve-row-main">
        <span className="ve-row-name">{name}</span>
        {detail && <span className="ve-row-detail">{detail}</span>}
      </div>
      {meta && <span className="ve-row-meta">{meta}</span>}
      {children}
    </li>
  );
}

export const RowList = ({ children }) => <ul className="ve-rows">{children}</ul>;

export const Note = ({ children }) => <p className="ve-note">{children}</p>;

export const Failure = ({ error }) => (
  <p className="ve-fail">
    <AlertTriangle size={13} /> {error}
  </p>
);

export const Loading = ({ what = "this" }) => (
  <p className="ve-loading">
    <Loader2 size={13} className="animate-spin" /> reading {what}…
  </p>
);

export const Code = ({ children }) => <pre className="ve-code">{children}</pre>;

export const Badge = ({ tone = "", children }) => <span className={`ve-badge${tone ? ` is-${tone}` : ""}`}>{children}</span>;

export const LinkOut = ({ href, children }) => (
  <a className="ve-linkout" href={href} target="_blank" rel="noopener noreferrer">
    {children} <ExternalLink size={11} />
  </a>
);

/** A value on the clipboard, with the confirmation that it actually went there. */
export function Copy({ text, label = "COPY" }) {
  const [done, setDone] = useState(false);
  const take = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      setDone(false);
    }
  };
  return (
    <button type="button" className="ve-copy" onClick={take}>
      {done ? <Check size={12} /> : <CopyIcon size={12} />} {done ? "COPIED" : label}
    </button>
  );
}

export const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/**
 * Reads one thing for a panel. Every panel gets the same three states from it — still
 * reading, the error that came back, and the answer — so none of them invent a value
 * in the meantime.
 */
export function useLoad(load, deps = []) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const run = useCallback(async () => {
    setState((held) => ({ ...held, loading: true, error: "" }));
    try {
      const data = await load();
      setState({ loading: false, error: "", data });
    } catch (e) {
      setState({ loading: false, error: e?.response?.data?.error || e?.message || "That read failed.", data: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run };
}

/** A control that does something and reports exactly what came back. */
export function useAction() {
  const [state, setState] = useState({ running: false, error: "", result: "" });
  const run = async (work) => {
    setState({ running: true, error: "", result: "" });
    try {
      const result = await work();
      setState({ running: false, error: "", result: result || "" });
      return result;
    } catch (e) {
      setState({ running: false, error: e?.response?.data?.error || e?.message || "That failed.", result: "" });
      return null;
    }
  };
  return { ...state, run };
}

/** The shared shape of a button on a panel. */
export const Action = ({ label, onClick, disabled, busy }) => (
  <button type="button" className="ve-pop-action" onClick={onClick} disabled={disabled || busy}>
    {busy ? <Loader2 size={12} className="animate-spin" /> : null} {label}
  </button>
);