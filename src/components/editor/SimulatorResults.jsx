import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Copy, AlertTriangle, Lightbulb, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

const SEVERITY_STYLES = {
  critical: "border-rose-300 bg-rose-50 text-rose-700",
  high: "border-orange-300 bg-orange-50 text-orange-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-sky-300 bg-sky-50 text-sky-700"
};

export default function SimulatorResults({ result, onUseEnhanced }) {
  const [copied, setCopied] = React.useState(false);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-20">
        Run the simulator to see QA review, validation, recommendations, enhancement, and negative flag analysis.
      </div>
    );
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 overflow-y-auto p-4 h-full">
      {/* QA Review */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> QA Review</CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${result.qa_review?.score >= 70 ? "bg-emerald-500" : result.qa_review?.score >= 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${result.qa_review?.score || 0}%` }} />
              </div>
              <span className="text-sm font-semibold">{result.qa_review?.score || 0}/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.qa_review?.issues?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Issues</p>
              <ul className="space-y-1">{result.qa_review.issues.map((issue, i) => <li key={i} className="text-xs flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> {issue}</li>)}</ul>
            </div>
          )}
          {result.qa_review?.suggestions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Suggestions</p>
              <ul className="space-y-1">{result.qa_review.suggestions.map((s, i) => <li key={i} className="text-xs flex items-start gap-1.5"><Lightbulb className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" /> {s}</li>)}</ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Structure Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={result.validation?.valid ? "default" : "destructive"} className="text-xs">{result.validation?.valid ? "Valid" : "Needs Work"}</Badge>
            <span className="text-xs text-muted-foreground">Score: {result.validation?.structure_score || 0}/100</span>
          </div>
          {result.validation?.missing_elements?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Missing Elements</p>
              <div className="flex flex-wrap gap-1">{result.validation.missing_elements.map((el, i) => <Badge key={i} variant="outline" className="text-xs text-rose-600 border-rose-200">{el}</Badge>)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negative Flags */}
      {result.negative_flags?.length > 0 && (
        <Card className="border-rose-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-rose-700"><AlertTriangle className="w-4 h-4" /> Negative Flags ({result.negative_flags.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.negative_flags.map((flag, i) => (
              <div key={i} className={`rounded-lg border p-3 ${SEVERITY_STYLES[flag.severity] || SEVERITY_STYLES.low}`}>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className={`text-xs capitalize ${SEVERITY_STYLES[flag.severity]}`}>{flag.severity}</Badge>
                  <code className="text-xs bg-black/5 px-1.5 py-0.5 rounded">{flag.pattern}</code>
                </div>
                <p className="text-xs mb-1.5">{flag.suggestion}</p>
                <div className="text-xs bg-muted/40 rounded p-2 border border-border">
                  <span className="font-medium">Replacement: </span>{flag.replacement}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.recommendations?.improvements?.length > 0 && (
            <ul className="space-y-1">{result.recommendations.improvements.map((imp, i) => <li key={i} className="text-xs flex items-start gap-1.5"><Sparkles className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" /> {imp}</li>)}</ul>
          )}
          {result.recommendations?.related_categories?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">{result.recommendations.related_categories.map((c, i) => <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>)}</div>
          )}
        </CardContent>
      </Card>

      {/* Enhancement */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700"><Wand2 className="w-4 h-4" /> Enhanced Prompt</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copy(result.enhancement?.enhanced_prompt || "")}>
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} Copy
              </Button>
              {onUseEnhanced && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUseEnhanced(result.enhancement?.enhanced_prompt || "")}>Use</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.enhancement?.improvements_made?.length > 0 && (
            <ul className="space-y-0.5">{result.enhancement.improvements_made.map((imp, i) => <li key={i} className="text-xs text-emerald-600 flex items-start gap-1.5"><Check className="w-3 h-3 shrink-0 mt-0.5" /> {imp}</li>)}</ul>
          )}
          <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-60 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap font-body">{result.enhancement?.enhanced_prompt}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}