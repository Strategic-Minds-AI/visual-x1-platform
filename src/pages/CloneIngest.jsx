import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Copy } from "lucide-react";
import CloneIntake from "@/components/clone/CloneIntake";
import CloneVerifyPanel from "@/components/clone/CloneVerifyPanel";
import CloneList from "@/components/clone/CloneList";
import CloneAuditLedger from "@/components/clone/CloneAuditLedger";

export default function CloneIngest() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.CloneProject.filter({}, { sort: "-created_date", limit: 50 });
      setProjects(res.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = (project) => {
    setSelected(project);
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-1">
          <Copy className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Clone &amp; Ingest</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Capture a system, extract its build specification, reproduce it, then verify it against the source. Acceptance requires
          every required operational check passing, zero open visual defects, and your own sign-off.
        </p>

        <div className="grid lg:grid-cols-[1.15fr_1fr_0.8fr] gap-5 items-start">
          <div className="space-y-4">
            <CloneIntake onCaptured={upsert} />
          </div>
          <CloneVerifyPanel project={selected} cloneHtml={selected?.__html || ""} onUpdated={upsert} />
          <div className="space-y-3">
            <p className="text-sm font-medium">Projects</p>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <CloneList projects={projects} selectedId={selected?.id} onSelect={setSelected} />}
          </div>
        </div>

        <div className="mt-6">
          <CloneAuditLedger refreshKey={projects.length} />
        </div>
      </div>
    </div>
  );
}