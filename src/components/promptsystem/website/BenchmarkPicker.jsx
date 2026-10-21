import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/admin/adminUi";
import { APP_PAGES, BENCHMARK_MODES } from "@/data/websiteEditCatalog";

// The benchmark this change is judged against: a page of this site, another site's
// URL, or a reference from the benchmark library.
export default function BenchmarkPicker({ benchmark, onChange }) {
  const [references, setReferences] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.BenchmarkReference.filter({ is_active: true }, { sort: "-ux_score", limit: 50 });
        setReferences(items || []);
      } catch {
        setReferences([]);
      }
    })();
  }, []);

  const set = (patch) => onChange({ ...benchmark, ...patch });

  return (
    <Panel
      kicker="BENCHMARK"
      title="What this must match"
      aside={
        <div className="cp-quote-fields cp-admin-inline-field">
          <Select value={benchmark.mode} onValueChange={(mode) => set({ mode })}>
            <SelectTrigger aria-label="Benchmark source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BENCHMARK_MODES.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {benchmark.mode === "page" && (
        <div className="cp-quote-fields cp-admin-inline-field">
          <Select value={benchmark.route} onValueChange={(route) => set({ route })}>
            <SelectTrigger aria-label="Page of this site">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APP_PAGES.map((route) => (
                <SelectItem key={route} value={route}>
                  {route}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {benchmark.mode === "url" && (
        <input
          className="cp-field"
          value={benchmark.url}
          onChange={(e) => set({ url: e.target.value })}
          placeholder="https://the-site-to-match.com/page"
          aria-label="Benchmark URL"
        />
      )}

      {benchmark.mode === "library" && (
        <div className="cp-quote-fields cp-admin-inline-field">
          {references === null ? (
            <p className="cp-empty">Loading the benchmark library…</p>
          ) : references.length === 0 ? (
            <p className="cp-empty">No active references in the library yet.</p>
          ) : (
            <Select
              value={benchmark.reference?.id || ""}
              onValueChange={(id) => set({ reference: references.find((r) => r.id === id) || null })}
            >
              <SelectTrigger aria-label="Library benchmark">
                <SelectValue placeholder="Choose a reference" />
              </SelectTrigger>
              <SelectContent>
                {references.map((reference) => (
                  <SelectItem key={reference.id} value={reference.id}>
                    {reference.name} · UX {reference.ux_score || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {benchmark.mode === "page" && (
        <p className="cp-fine">The chosen page is read first and its structure, spacing and copy become the baseline to beat.</p>
      )}
      {benchmark.mode === "library" && benchmark.reference?.key_patterns && (
        <p className="cp-fine">Patterns to implement: {benchmark.reference.key_patterns}</p>
      )}
    </Panel>
  );
}