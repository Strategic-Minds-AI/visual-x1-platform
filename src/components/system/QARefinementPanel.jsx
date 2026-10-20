import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, ArrowRight, Check, X, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const SEVERITY_COLORS = { critical: "destructive", high: "secondary", medium: "outline", low: "outline" };

export default function QARefinementPanel() {
  const [refinements, setRefinements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await base44.entities.QARefinement.filter(
        { status: "pending" },
        { sort: "-created_date", limit: 20 }
      );
      setRefinements(res.items || []);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApply = async (ref) => {
    setApplying(ref.id);
    try {
      const newVersion = await base44.entities.PromptVersion.create({
        project_id: ref.project_id,
        version: Date.now(),
        prompt_text: ref.refined_prompt,
        prompt_type: "refined",
        parent_version_id: ref.prompt_version_id || "",
        status: "active",
        notes: `Refined from QA audit: ${ref.learning_note || ""}`
      });
      await base44.entities.QARefinement.update(ref.id, {
        status: "applied",
        applied_prompt_version_id: newVersion.id
      });
      await base44.entities.AuditLog.create({
        entity_type: "qa_refinement", entity_id: ref.id, action: "update",
        details: `Applied QA refinement — new prompt version ${newVersion.id}`,
        severity: "info"
      });
      loadData();
    } catch (e) { /* ignore */ }
    finally { setApplying(null); }
  };

  const handleReject = async (ref) => {
    try {
      await base44.entities.QARefinement.update(ref.id, { status: "rejected" });
      loadData();
    } catch (e) { /* ignore */ }
  };

  const parseJson = (str, fallback) => {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading QA refinements...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">QA Feedback Loop</CardTitle>
              <p className="text-xs text-muted-foreground">Refinement suggestions sent back to Prompt Lab</p>
            </div>
          </div>
          <Link to="/prompt-lab">
            <Button variant="ghost" size="sm"><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Prompt Lab</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {refinements.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending refinements. The QA agent will send suggestions here after each audit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {refinements.map(ref => {
              const findings = parseJson(ref.findings, []);
              const suggestions = parseJson(ref.suggestions, []);
              const isExpanded = expanded === ref.id;
              return (
                <div key={ref.id} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                    <Badge variant={SEVERITY_COLORS[ref.severity] || "outline"} className="text-[10px]">{ref.severity}</Badge>
                    <Badge variant="outline" className="text-[10px]">{ref.audit_source.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(ref.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {suggestions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Suggestions</p>
                        <ul className="space-y-1">
                          {suggestions.slice(0, isExpanded ? undefined : 2).map((s, i) => (
                            <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                              <ArrowRight className="w-3 h-3 mt-1 shrink-0 text-violet-500" /> {s}
                            </li>
                          ))}
                        </ul>
                        {suggestions.length > 2 && (
                          <button onClick={() => setExpanded(isExpanded ? null : ref.id)} className="text-xs text-primary mt-1">
                            {isExpanded ? "Show less" : `Show ${suggestions.length - 2} more`}
                          </button>
                        )}
                      </div>
                    )}
                    {ref.learning_note && (
                      <div className="p-2 rounded-md bg-amber-500/5 border border-amber-500/15">
                        <p className="text-[10px] font-mono text-amber-600 uppercase mb-0.5">System Learning</p>
                        <p className="text-xs text-foreground/70">{ref.learning_note}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" onClick={() => handleApply(ref)} disabled={applying === ref.id}>
                        {applying === ref.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                        Apply to Prompt Lab
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(ref)}>
                        <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}