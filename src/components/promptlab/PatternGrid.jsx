import React, { useState, useMemo } from "react";
import { Search, Check, Layers } from "lucide-react";
import { SYSTEM_PATTERNS, PROMPT_CATEGORIES } from "@/data/systemPatterns";

export default function PatternGrid({ selectedSlug, onSelect }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    return SYSTEM_PATTERNS.filter(p => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tags?.some(t => t.includes(search.toLowerCase()));
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search 50 system patterns..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...PROMPT_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-full transition ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(p => {
            const isSelected = selectedSlug === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => onSelect(p)}
                className={`text-left p-3 rounded-lg border transition relative ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-accent-foreground/30"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-start gap-2 mb-1.5">
                  <Layers className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="text-sm font-medium pr-6">{p.name}</div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{p.category}</div>
                {p.use_cases && (
                  <div className="flex flex-wrap gap-1">
                    {p.use_cases.slice(0, 3).map(uc => (
                      <span key={uc} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {uc}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">No patterns found.</div>
        )}
      </div>
    </div>
  );
}