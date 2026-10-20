import React from "react";
import { RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * The report from a QA, validator or test-agent pass: the verdict, the numbers it
 * rests on, and the findings that came out of it — including what the run could not
 * test, so a green result is never read as more than it is.
 */
export default function EditorAgentResults({ open, onOpenChange, report, onRegenerate }) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ve-report">
        <h2>{report.title}</h2>
        <p className="ve-report-verdict">{report.verdict}</p>

        {report.stats?.length ? (
          <div className="ve-report-stats">
            {report.stats.map((stat) => (
              <div key={stat.label} className="ve-report-stat">
                <em>{stat.label}</em>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {report.note ? <p className="ve-report-note">{report.note}</p> : null}

        {(report.lists || [])
          .filter((list) => (list.items || []).length > 0)
          .map((list) => (
            <div key={list.label}>
              <h3>{list.label}</h3>
              <ul>
                {list.items.slice(0, 40).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

        <div className="ve-report-actions">
          <button
            type="button"
            className="ve-pop-action"
            onClick={() => {
              onOpenChange(false);
              onRegenerate();
            }}
            title="Run the last request again with what this report found"
          >
            <RefreshCw size={12} /> REGENERATE
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}