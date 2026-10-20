import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, Factory } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FactoryLauncher({ onLaunch, isRunning }) {
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

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Factory className="w-5 h-5 text-primary" />
          Autonomous Production Launcher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sentence" className="text-sm font-medium">One-Sentence Website Brief</Label>
          <Textarea
            id="sentence"
            placeholder="e.g., Build a high-converting website for my 24/7 emergency plumbing company in Dallas"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={3}
            className="resize-none border-2 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">{sentence.length} characters — minimum 10 required</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind.id} value={ind.name}>{ind.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">SEO Variants</Label>
            <Input type="number" value={variants} onChange={(e) => setVariants(parseInt(e.target.value) || 0)} min={1} max={500} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Backlink Sites</Label>
            <Input type="number" value={backlinks} onChange={(e) => setBacklinks(parseInt(e.target.value) || 0)} min={1} max={500} />
          </div>
        </div>

        <Button
          onClick={handleLaunch}
          disabled={isRunning || sentence.trim().length < 10}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isRunning ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Orchestrating Autonomous Pipeline...</>
          ) : (
            <><Rocket className="w-5 h-5" /> Launch Autonomous Production</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}