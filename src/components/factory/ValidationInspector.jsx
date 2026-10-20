import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Shield, FileSearch, Wrench } from "lucide-react";

const scoreColor = (score) => {
  if (score >= 95) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

const scoreBar = (score) => {
  if (score >= 95) return "[&>div]:bg-green-500";
  if (score >= 70) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
};

export default function ValidationInspector({ result }) {
  if (!result) return null;

  const { validation, spec_qa, refinement, spec_score, quality_score, decision, benchmarks_used } = result;
  const passed = quality_score >= 95;

  const dimensions = [
    { label: "Visual Parity", score: validation?.visual_parity || 0, max: 25 },
    { label: "Functionality", score: validation?.functionality || 0, max: 20 },
    { label: "Accessibility", score: validation?.accessibility || 0, max: 15 },
    { label: "Responsive UX", score: validation?.responsive_ux || 0, max: 10 },
    { label: "Performance", score: validation?.performance || 0, max: 10 },
    { label: "Security", score: validation?.security || 0, max: 10 },
    { label: "Content/SEO", score: validation?.content_trust_seo || 0, max: 5 },
    { label: "Reliability", score: validation?.reliability || 0, max: 5 },
  ];

  return (
    <div className="space-y-3 overflow-y-auto h-full p-3">
      {/* Score Banner */}
      <Card className={`border-2 ${passed ? "border-green-500/40" : "border-yellow-500/40"}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            {passed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${scoreColor(quality_score)}`}>{quality_score}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <Badge variant={passed ? "default" : "secondary"} className="ml-auto text-xs">
                  {decision}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {benchmarks_used} benchmarks — Spec: {spec_score}/100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Dimensions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileSearch className="w-4 h-4" /> Independent Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span>{dim.label}</span>
                <span className={scoreColor(dim.score)}>{dim.score}/{dim.max}</span>
              </div>
              <Progress value={(dim.score / dim.max) * 100} className={`h-1.5 ${scoreBar(dim.score)}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Findings */}
      {validation?.findings?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" /> Validator Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {validation.findings.map((finding, i) => (
              <div key={i} className="flex gap-1.5 text-xs">
                <XCircle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
                <span>{finding}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Google Compliance Findings */}
      {validation?.compliance_findings?.length > 0 && (
        <Card className="border-2 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-red-600">
              <Shield className="w-4 h-4" /> Google Compliance Violations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {validation.compliance_findings.map((finding, i) => (
              <div key={i} className="flex gap-1.5 text-xs">
                <XCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                <span className="text-red-700">{finding}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Repair Suggestions */}
      {refinement && (
        <Card className="border-2 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-blue-600" /> Repair Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {refinement.suggestions?.map((s, i) => (
              <div key={i} className="flex gap-1.5 text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Evidence Summary */}
      {validation?.evidence_summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evidence Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground italic">{validation.evidence_summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}