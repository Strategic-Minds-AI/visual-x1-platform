import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Layers, Search } from "lucide-react";
import { TOP_PROMPTS, PROMPT_CATEGORIES } from "@/data/topPrompts";

export default function SystemTypeMenu({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = TOP_PROMPTS.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.includes(search.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Layers className="w-3.5 h-3.5 mr-1.5" /> System Types
          <span className="ml-1 text-xs text-muted-foreground">({TOP_PROMPTS.length})</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search system types..."
              className="w-full pl-7 pr-2 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {PROMPT_CATEGORIES.map(cat => {
            const prompts = filtered.filter(p => p.category === cat);
            if (prompts.length === 0) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">{cat}</div>
                {prompts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p.prompt); setOpen(false); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition border-b border-border/50 last:border-0"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches found.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}