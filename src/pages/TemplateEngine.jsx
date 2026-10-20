import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, LayoutTemplate, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import TemplateForm from "@/components/templates/TemplateForm";
import StructureMapper from "@/components/templates/StructureMapper";

const TABS = [
  { id: "templates", label: "Industry Layouts" },
  { id: "mapping", label: "Keyword Mapping" },
];

export default function TemplateEngine() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("templates");

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.SEOTemplate.filter({ is_active: true }, { sort: "-created_date", limit: 50 });
      setTemplates(items);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await base44.entities.SEOTemplate.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold">SEO Template Engine</h1>
        </div>
        <Badge variant="outline" className="text-xs ml-2">{templates.length} layouts</Badge>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="flex gap-1 border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "templates" && (
          <div className="space-y-4">
            <TemplateForm onCreated={() => load()} />

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading layouts...</p>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <LayoutTemplate className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No layouts yet. Upload your first industry layout above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                          <p className="text-xs text-muted-foreground">{t.industry}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-destructive" onClick={() => remove(t.id)} title="Delete layout">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{t.domain_strategy}</Badge>
                        <Badge variant="secondary" className="text-xs">{t.funnel_type}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{t.url_pattern}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">Keywords: {t.keywords}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "mapping" && <StructureMapper templates={templates} />}
      </div>
    </div>
  );
}