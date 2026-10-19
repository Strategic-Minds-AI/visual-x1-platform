import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronUp, ChevronDown, Play, Link2 } from "lucide-react";

export default function PromptChainBuilder({ chain, setChain, onExecute, executing, executionResult }) {
  const [newStep, setNewStep] = useState("");

  const addStep = () => {
    if (!newStep.trim()) return;
    setChain([...chain, { id: Date.now(), prompt: newStep.trim() }]);
    setNewStep("");
  };

  const removeStep = (id) => setChain(chain.filter(s => s.id !== id));
  const moveStep = (idx, dir) => {
    const newChain = [...chain];
    const target = idx + dir;
    if (target < 0 || target >= newChain.length) return;
    [newChain[idx], newChain[target]] = [newChain[target], newChain[idx]];
    setChain(newChain);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Prompt Chain</h3>
        <Badge variant="outline" className="text-xs">{chain.length} steps</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Chain prompts sequentially — each step's output feeds into the next as context.</p>

      <div className="space-y-2 flex-1">
        {chain.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border rounded-lg">
            Add prompts below to build a chain
          </div>
        ) : (
          chain.map((step, idx) => (
            <Card key={step.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">{idx + 1}</Badge>
                  <p className="text-xs flex-1 line-clamp-2">{step.prompt}</p>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveStep(idx, -1)} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveStep(idx, 1)} disabled={idx === chain.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-rose-500" onClick={() => removeStep(step.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a prompt step..." onKeyDown={e => e.key === "Enter" && addStep()} className="text-sm" />
        <Button size="sm" onClick={addStep}><Plus className="w-4 h-4" /></Button>
      </div>

      {chain.length > 0 && (
        <Button onClick={onExecute} disabled={executing} className="w-full">
          <Play className="w-4 h-4 mr-1.5" /> {executing ? "Executing Chain..." : `Execute Chain (${chain.length} steps)`}
        </Button>
      )}

      {executionResult && (
        <Card className="border-emerald-200">
          <CardContent className="pt-3">
            <p className="text-xs font-medium text-emerald-700 mb-1">Chain Output (Final Step)</p>
            <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-body">{executionResult}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}