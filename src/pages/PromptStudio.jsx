import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Wand2, Copy, Check, Search, Sparkles, Shield, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { TOP_PROMPTS, PROMPT_CATEGORIES } from "@/data/topPrompts";

export default function PromptStudio() {
  const [sentence, setSentence] = useState("");
  const [category, setCategory] = useState("general");
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);

  const filteredPrompts = useMemo(() => {
    return TOP_PROMPTS.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleConvert = async () => {
    if (!sentence.trim()) return;
    setConverting(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("convertPrompt", { sentence, category });
      setResult(res.data);
    } catch (e) {
      const data = e?.response?.data;
      setError(data?.error || data?.message || "Conversion failed. Try again.");
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <h1 className="font-heading text-lg font-semibold">Prompt Studio</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Converter */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-heading text-xl font-semibold">Sentence → Advanced Prompt Converter</h2>
              <p className="text-sm text-muted-foreground">Turn a minimal request into a production-grade prompt with built-in safety validation.</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Your request (one sentence)</Label>
                <Textarea
                  value={sentence}
                  onChange={e => setSentence(e.target.value)}
                  placeholder="e.g., Build a SaaS landing page for a project management tool"
                  rows={2}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5 flex-1">
                  <Label>Optimize for (optional)</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Purpose</SelectItem>
                      {PROMPT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleConvert} disabled={converting || !sentence.trim()}>
                  <Wand2 className="w-4 h-4 mr-1.5" /> {converting ? "Converting..." : "Convert"}
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Blocked by safety validator</p>
                    <p className="text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Shield className="w-4 h-4" /> Validated & converted
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.advanced)}>
                      {copied ? <><Check className="w-3.5 h-3.5 mr-1" /> Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-body">{result.advanced}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Library */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="font-heading text-xl font-semibold">Top 50 Pro Prompts</h2>
              <p className="text-sm text-muted-foreground">Battle-tested prompts for building, reverse-engineering, validating, and launching production systems.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={activeCategory === "All" ? "default" : "outline"} onClick={() => setActiveCategory("All")}>All</Button>
              {PROMPT_CATEGORIES.map(c => (
                <Button key={c} size="sm" variant={activeCategory === c ? "default" : "outline"} onClick={() => setActiveCategory(c)}>{c}</Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredPrompts.map(p => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{p.category}</Badge>
                        <span className="text-xs text-muted-foreground">#{p.id}</span>
                      </div>
                      <CardTitle className="text-sm mt-1.5">{p.title}</CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {expandedId === p.id ? p.prompt : `${p.prompt.slice(0, 180)}...`}
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                      {expandedId === p.id ? "Collapse" : "Expand"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copyToClipboard(p.prompt, p.id)}>
                      {copiedPromptId === p.id ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}