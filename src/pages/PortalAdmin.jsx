import React, { useEffect, useState } from "react";
import { LayoutDashboard, Sparkles, Download, Factory, ShieldCheck, Users, FolderOpen, Rocket, Menu, X, Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import AdminOverview from "@/components/admin/AdminOverview";
import PromptPipeline from "@/components/admin/PromptPipeline";
import ClonePipeline from "@/components/admin/ClonePipeline";
import FactoryPipeline from "@/components/admin/FactoryPipeline";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import LiveRecords from "@/components/admin/LiveRecords";
import emblemArt from "@/assets/x1/silver-emblem.png";
import "../../vendor/x1/CommercePortal.css";
import "@/styles/x1-brand-theme.css";
import "@/styles/x1-admin.css";
import { countRecords } from "@/lib/adminPipelines";

const SECTIONS = [
  { id: "overview", label: "Command Deck", icon: LayoutDashboard },
  { id: "prompt", label: "Prompt System", icon: Sparkles },
  { id: "clone", label: "Clone & Ingest", icon: Download },
  { id: "factory", label: "Website Factory", icon: Factory },
  { id: "approvals", label: "Release Gates", icon: ShieldCheck },
  { id: "clients", label: "Client Intake", icon: Users },
  { id: "assets", label: "Brand Assets", icon: FolderOpen },
  { id: "releases", label: "QA & Deployments", icon: Rocket },
];

// The operator admin. It renders inside the client portal's own shell (same
// stylesheet, same panels, buttons and lists), reads live records only, and every
// action calls the Visual X backend module that owns it.
export default function PortalAdmin() {
  const [section, setSection] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [batches, clones] = await Promise.all([
          countRecords("FactoryBatch", { visual_approval: "pending" }),
          countRecords("CloneProject", { human_approved: false }),
        ]);
        setPending(batches + clones);
      } catch {
        setPending(null);
      }
    })();
  }, [section]);

  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const go = (id) => {
    setSection(id);
    setNavOpen(false);
  };

  return (
    <div className="cp-site">
      <div className="cp-portal-shell">
        {navOpen && (
          <button className="cp-sidebar-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
        )}

        <aside className={`cp-sidebar${navOpen ? " cp-sidebar-open" : ""}`}>
          <div className="cp-sidebar-head">
            <Link to="/v2/b" className="cp-portal-logo" onClick={() => setNavOpen(false)}>
              <span className="cp-brand-mark">
                <img src={emblemArt} alt="Metallic S emblem" />
              </span>
              <span>
                STRATEGIC MINDS <b>AI</b>
                <small>OPERATOR CONSOLE</small>
              </span>
            </Link>
            <button className="cp-sidebar-close" aria-label="Close navigation" onClick={() => setNavOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav aria-label="Console sections">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={section === id ? "page" : undefined}
                className={section === id ? "selected" : ""}
              >
                <Icon size={17} />
                {label}
                {id === "approvals" && pending !== null && pending > 0 && <span className="cp-side-count">{pending}</span>}
              </button>
            ))}
          </nav>

          <div className="cp-sidebar-bottom">
            <p className="cp-panel-note">
              Live records only. A high score never authorizes release; the gates decide.
            </p>
          </div>
        </aside>

        <div className="cp-portal-main">
          <header className="cp-portal-top">
            <p className="cp-breadcrumb">
              OPERATOR CONSOLE <b>{current.label}</b>
            </p>
            <div className="cp-portal-top-actions">
              <span className="cp-demo-pill">
                <span /> LIVE RECORDS
              </span>
              <Link to="/visual-editor" className="cp-green-button">
                <Code2 size={15} /> VISUAL EDITOR
              </Link>
              <button className="cp-mobile-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
                <Menu size={20} />
              </button>
            </div>
          </header>

          <div className="cp-portal-content">
            {section === "overview" && <AdminOverview onNavigate={go} />}
            {section === "prompt" && <PromptPipeline />}
            {section === "clone" && <ClonePipeline />}
            {section === "factory" && <FactoryPipeline />}
            {section === "approvals" && <ApprovalQueue />}
            {section === "clients" && (
              <LiveRecords
                title="CLIENT INTAKE SUBMISSIONS"
                entity="ClientIntake"
                pillKey="status"
                emptyText="No client intake submissions yet. Send a client to onboarding and it lands here."
                columns={[
                  { key: "company_name", primary: true },
                  { key: "full_name" },
                  { key: "industry" },
                  { key: "status" },
                ]}
              />
            )}
            {section === "assets" && (
              <LiveRecords
                title="BRAND ASSETS"
                entity="BrandAsset"
                imageKey="image_url"
                pillKey="status"
                emptyText="No brand assets generated yet."
                columns={[
                  { key: "company_name", primary: true },
                  { key: "asset_type" },
                  { key: "variant_name" },
                  { key: "status" },
                ]}
              />
            )}
            {section === "releases" && (
              <div className="cp-admin-stack">
                <LiveRecords
                  title="VALIDATION RECEIPTS"
                  entity="ValidationReceipt"
                  pillKey="decision"
                  emptyText="No validation receipts recorded yet."
                  columns={[
                    { key: "decision", primary: true },
                    { key: "project_id" },
                    { key: "validator_id", format: (value) => (value ? `validator ${value}` : "—") },
                    { key: "notes" },
                  ]}
                />
                <LiveRecords
                  title="DEPLOYMENTS"
                  entity="Deployment"
                  pillKey="status"
                  emptyText="No deployments recorded yet."
                  columns={[
                    { key: "project_id", primary: true },
                    { key: "environment" },
                    { key: "provider" },
                    { key: "url" },
                  ]}
                />
              </div>
            )}
          </div>

          <footer className="cp-portal-footer">
            <span>STRATEGIC MINDS AI · OPERATOR CONSOLE</span>
            <span>EVERY ROW READ FROM LIVE RECORDS</span>
          </footer>
        </div>
      </div>
    </div>
  );
}