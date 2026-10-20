import React, { useEffect, useState } from "react";
import { LayoutDashboard, Sparkles, Download, Factory, ShieldCheck, Users, FolderOpen, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import AdminOverview from "@/components/admin/AdminOverview";
import PromptPipeline from "@/components/admin/PromptPipeline";
import ClonePipeline from "@/components/admin/ClonePipeline";
import FactoryPipeline from "@/components/admin/FactoryPipeline";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import LiveRecords from "@/components/admin/LiveRecords";
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

// The operator admin. Live records only: every panel reads the real entities and
// every action calls the Visual X backend module that owns it.
export default function PortalAdmin() {
  const [section, setSection] = useState("overview");
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

  return (
    <div className="min-h-screen">
      <header className="x1-glass sticky top-0 z-20 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/6ad5e96eb2cfcf9aafe9f1df/eda871bc3_logo.png" alt="" className="h-8 w-8 object-contain x1-emblem-glow" />
            <div>
              <p className="font-heading text-sm font-extrabold text-foreground">Operator Admin</p>
              <p className="x1-track text-[10px] font-bold text-muted-foreground">Strategic Minds AI · X1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="x1-track text-[10px] font-bold text-muted-foreground">Live records</span>
            {pending !== null && <span className="x1-pill x1-pill-outline px-3 py-1 text-[10px] font-bold">{pending} awaiting decision</span>}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-3 py-5 sm:px-6 lg:flex-row">
        <nav aria-label="Admin sections" className="lg:w-60 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id} className="shrink-0 lg:w-full">
                <button
                  onClick={() => setSection(id)}
                  aria-current={section === id ? "page" : undefined}
                  className={`flex w-full items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors lg:whitespace-normal ${
                    section === id
                      ? "x1-active-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          {section === "overview" && <AdminOverview onNavigate={setSection} />}
          {section === "prompt" && <PromptPipeline />}
          {section === "clone" && <ClonePipeline />}
          {section === "factory" && <FactoryPipeline />}
          {section === "approvals" && <ApprovalQueue />}
          {section === "clients" && (
            <LiveRecords
              title="Client intake submissions"
              entity="ClientIntake"
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
              title="Brand assets"
              entity="BrandAsset"
              imageKey="image_url"
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
            <div className="space-y-4">
              <LiveRecords
                title="Validation receipts"
                entity="ValidationReceipt"
                emptyText="No validation receipts recorded yet."
                columns={[
                  { key: "decision", primary: true },
                  { key: "project_id" },
                  { key: "validator_id", format: (value) => (value ? `validator ${value}` : "—") },
                  { key: "notes" },
                ]}
              />
              <LiveRecords
                title="Deployments"
                entity="Deployment"
                emptyText="No deployments recorded yet."
                columns={[
                  { key: "project_id", primary: true },
                  { key: "environment" },
                  { key: "status" },
                  { key: "provider" },
                  { key: "url" },
                ]}
              />
            </div>
          )}

          <Card className="mt-4 p-4">
            <p className="text-[11px] text-muted-foreground">
              Every number and row in this console is read from live records for this account. A high score never
              authorizes release on its own: the gates in Release Gates still decide.
            </p>
          </Card>
        </main>
      </div>
    </div>
  );
}