import React from "react";

// Presentational primitives for the operator console. Every class used here
// belongs to the client portal's own stylesheet (vendor/x1/CommercePortal.css),
// so the console renders in the identical X1 portal language rather than a
// parallel theme of its own.
export function Panel({ kicker, title, aside, children, className = "" }) {
  return (
    <section className={`cp-portal-panel ${className}`}>
      {(kicker || title || aside) && (
        <div className="cp-panel-top">
          <div>
            {kicker && <p className="cp-kicker">{kicker}</p>}
            {title && <h3>{title}</h3>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button className={`cp-green-button ${className}`} {...props}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, className = "", ...props }) {
  return (
    <button className={`cp-outline ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Metric({ label, value, foot, icon: Icon, accent, onClick }) {
  const className = `cp-metric${accent ? " cp-metric-accent" : ""}`;
  const body = (
    <>
      <div className="cp-metric-top">
        <span>{label}</span>
        {Icon && <Icon size={22} />}
      </div>
      <strong>{value}</strong>
      <small>{foot}</small>
    </>
  );

  if (!onClick) return <div className={className}>{body}</div>;

  return (
    <button className={`${className} cp-admin-metric-button`} onClick={onClick}>
      {body}
    </button>
  );
}

export function StatusPill({ children }) {
  return <span className="cp-state-pill">{children}</span>;
}

export function Empty({ children }) {
  return <p className="cp-empty">{children}</p>;
}

export function LinkButton({ children, className = "", ...props }) {
  return (
    <button className={`cp-text-link ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="cp-admin-error">{children}</p>;
}