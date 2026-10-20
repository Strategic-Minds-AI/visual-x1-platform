import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminRail from "@/components/admin/AdminRail";
import PromptPipeline from "@/components/admin/PromptPipeline";
import VisualEditorWorkspace from "@/components/visualeditor/VisualEditorWorkspace";
import ClonePipeline from "@/components/admin/ClonePipeline";
import FactoryPipeline from "@/components/admin/FactoryPipeline";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import LiveRecords from "@/components/admin/LiveRecords";
import "../../vendor/x1/CommercePortal.css";
import "@/styles/x1-brand-theme.css";
import "@/styles/x1-admin.css";
import { CONSOLE_SECTIONS } from "@/data/adminModules";
import { countRecords } from "@/lib/adminPipelines";

// The sections live in src/data/adminModules.js, alongside the module registry the
// rail and the module hub both read, so the console's navigation has one source.
const SECTIONS = CONSOLE_SECTIONS;

// The operator admin. It renders inside the client portal's own shell (same
// stylesheet, same panels, buttons and lists), reads live records only, and every
// action calls the Visual X backend module that owns it.
export default function PortalAdmin() {
  // The section lives in the URL, so the console can be opened straight onto one
  // panel — /visual-editor lands on the Visual Editor this way.
  const [params, setParams] = useSearchParams();
  const requested = params.get("section");
  const section = SECTIONS.some((s) => s.id === requested) ? requested : "overview";
  const [navOpen, setNavOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
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
    setParams({ section: id });
    setNavOpen(false);
  };

  return (
    <div className={"cp-site" + (railOpen ? " admin-rail-open" : "")}>
      <div className="cp-portal-shell">
        {navOpen && (
          <button className="cp-sidebar-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
        )}

        <AdminRail
          section={section}
          onSection={go}
          pending={pending}
          railOpen={railOpen}
          onToggleRail={() => setRailOpen((v) => !v)}
          navOpen={navOpen}
          onCloseNav={() => setNavOpen(false)}
        />

        <div className="cp-portal-main">
          <header className="cp-portal-top">
            <p className="cp-breadcrumb">
              OPERATOR CONSOLE <b>{current.label}</b>
            </p>
            <div className="cp-portal-top-actions">
              <span className="cp-demo-pill">
                <span /> LIVE RECORDS
              </span>
              <button className="cp-mobile-toggle" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
                <Menu size={20} />
              </button>
            </div>
          </header>

          {/* The Visual Editor fills the console: no inset, no outer panel, so its
              own three-band layout is the page (the package's layout exactly). */}
          <div className={"cp-portal-content" + (section === "visualeditor" ? " cp-ve-host" : "")}>
            {section === "overview" && <AdminOverview onNavigate={go} />}
            {section === "prompt" && <PromptPipeline />}
            {section === "visualeditor" && <VisualEditorWorkspace />}
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