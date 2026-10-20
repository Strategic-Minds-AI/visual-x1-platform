import React from "react";
import { Target } from "lucide-react";

// The benchmark the build has to beat: the best score found in the field, plus a declared margin.
export default function BenchmarkTable({ benchmark, compositeTarget, reviewTarget }) {
  if (!benchmark?.targets?.length) return null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Composite target</p>
          <p className="text-lg font-semibold mt-0.5">{compositeTarget}/100</p>
          <p className="text-[11px] text-muted-foreground">field average plus the margin</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Margin over best</p>
          <p className="text-lg font-semibold mt-0.5">+{benchmark.margin_points || 0} pts</p>
          <p className="text-[11px] text-muted-foreground">on every dimension</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Review volume to pass</p>
          <p className="text-lg font-semibold mt-0.5">{Number(reviewTarget || 0).toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">matches the strongest incumbent</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Dimension</th>
              <th className="py-2 pr-3 text-[11px] font-medium text-muted-foreground">Best in field</th>
              <th className="py-2 text-[11px] font-medium text-muted-foreground">Target to lead</th>
            </tr>
          </thead>
          <tbody>
            {benchmark.targets.map((t) => (
              <tr key={t.dimension} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3 text-xs capitalize">{t.dimension}</td>
                <td className="py-2.5 pr-3 text-xs text-muted-foreground">{t.field_best}</td>
                <td className="py-2.5 text-xs font-medium flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-primary" /> {t.target}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {benchmark.basis && <p className="text-[11px] text-muted-foreground">{benchmark.basis}</p>}
    </div>
  );
}