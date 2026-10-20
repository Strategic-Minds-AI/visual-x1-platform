import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, Factory } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PIPELINE_STEPS = [
  "fetching_benchmarks",
  "converting_prompt",
  "compiling_spec",
  "running_qa",
  "rendering",
  "validating",
  "refining",
  "complete",
];

const STEP_LABELS = {
  fetching_benchmarks: "Fetching Benchmarks",
  converting_prompt: "Converting Prompt",
  compiling_spec: "Compiling Spec",
  running_qa: "Spec QA Audit",
  rendering: "Rendering HTML",
  validating: "Independent Validation",
  refining: "Generating Repairs",
  complete: "Complete",
};

export default function FactoryLauncher({ onLaunch, isRunning, currentStep }) {
  const [sentence, setSentence] = useState("");
  const [industry, setIndustry] = useState("");
  const [variants, setVariants] = useState(100);
  const [backlinks, setBacklinks] = useState(50);
  const [industries, setIndustries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.ServiceIndustry.filter(
          { is_active: true },
          { sort: 'display_order', limit: 100, fields: ['name', 'slug', 'category'] }
        );
        setIndustries(items);
      } catch {
        setIndustries([]);
      }
    })();
  }, []);

  const handleLaunch = () => {
    if (!sentence.trim() || sentence.trim().length < 10) return;
    onLaunch({ sentence: sentence.trim(), industry, target_variants: variants, target_backlinks: backlinks });
  };

  const currentStepIndex = PIPELINE_STEPS.indexOf(currentStep);

  return (
    <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Factory className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-sm">Autonomous Pipeline</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sentence" className="text-xs font-medium">One-Sentence Brief</Label>
        <Textarea
          id="sentence"
          placeholder="e.g., Build a premium AI consulting website that generates qualified leads"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground">{sentence.length} chars — min 10</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Industry</Label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {industries.map((ind) => (
              <SelectItem key={ind.id} value={ind.name}>{ind.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs font-medium">SEO Variants</Label>
          <Input type="number" value={variants} onChange={(e) => setVariants(parseInt(e.target.value) || 0)} min={1} max={500} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Backlinks</Label>
          <Input type="number" value={backlinks} onChange={(e) => setBacklinks(parseInt(e.target.value) || 0)} min={1} max={500} className="h-8 text-sm" />
        </div>
      </div>

      <Button
        onClick={handleLaunch}
        disabled={isRunning || sentence.trim().length < 10}
        className="w-full"
        size="sm"
      >
        {isRunning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Running Pipeline...</>
        ) : (
          <><Rocket className="w-4 h-4" /> Build & Validate</>
        )}
      </Button>

      {/* Pipeline Progress */}
      {isRunning && (
        <div className="space-y-1 pt-2 border-t">
          {PIPELINE_STEPS.slice(0, -1).map((step, i) => {
            const isActive = step === currentStep;
            const isDone = currentStepIndex > i;
            return (
              <div key={step} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isDone ? "bg-green-500" : isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                <span className={isActive ? "font-medium text-primary" : isDone ? "text-muted-foreground line-through" : "text-muted-foreground/50"}>
                  {STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}