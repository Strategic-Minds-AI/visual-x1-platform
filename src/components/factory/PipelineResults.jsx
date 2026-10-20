import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, FileText, Search, Shield } from "lucide-react";

const scoreColor = (score) => {
  if (score >= 95) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

const scoreBg = (score) => {
  if (score >= 95) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

export default function PipelineResults({ result }) {
  if (!result) return null;

  const { quality_score, decision, prompt, spec, qa, refinement, benchmarks_used } = result;
  const passed = quality_score >= 95;

  const dimensions = [
    { label: "Visual Parity", score: qa?.visual_parity || 0, max: 25 },
    { label: "Functionality", score: qa?.functionality || 0, max: 20 },
    { label: "Accessibility", score: qa?.accessibility || 0, max: 15 },
    { label: "Responsive UX", score: qa?.responsive_ux || 0, max: 10 },
    { label: "Performance", score: qa?.performance || 0, max: 10 },
    { label: "Security", score: qa?.security || 0, max: 10 },
    { label: "Content/Trust/SEO", score: qa?.content_trust_seo || 0, max: 5 },
    { label: "Reliability", score: qa?.reliability || 0, max: 5 },
  ];

  return (
    <div className="space-y-4">
      {/* Score Banner */}
      <Card className={`border-2 ${passed ? "border-green-500/40 bg-green-50/50" : "border-yellow-500/40 bg-yellow-50/50"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              )}
              <div>
                <h3 className="text-2xl font-bold">
                  Quality Gate: {passed ? "PASSED" : "NEEDS REFINEMENT"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benchmarks_used} benchmarks referenced — Decision: {decision}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${scoreColor(quality_score)}`}>{quality_score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QA Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" /> QA Audit Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{dim.label}</span>
                <span className={scoreColor(dim.score)}>{dim.score}/{dim.max}</span>
              </div>
              <Progress value={(dim.score / dim.max) * 100} className={`h-2 [&>div]:${scoreBg(dim.score)}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generated Prompt */}
      {prompt?.prompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" /> Generated Production Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {prompt.site_type && <Badge variant="secondary">{prompt.site_type}</Badge>}
              {prompt.funnel_type && <Badge variant="outline">{prompt.funnel_type}</Badge>}
              {prompt.seo_keywords?.slice(0, 5).map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
              ))}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {prompt.prompt.substring(0, 2000)}{prompt.prompt.length > 2000 ? "..." : ""}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QA Findings */}
      {qa?.findings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" /> Audit Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {qa.findings.map((finding, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Refinement Suggestions */}
      {refinement && (
        <Card className="border-2 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" /> QA Refinement Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {refinement.suggestions?.map((s, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
            {refinement.learning_note && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm italic text-muted-foreground">
                Learning: {refinement.learning_note}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}