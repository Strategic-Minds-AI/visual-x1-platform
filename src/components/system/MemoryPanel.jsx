import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MemoryPanel() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newMemory, setNewMemory] = useState({ content: "", memory_type: "observation", importance: 5, tags: "" });

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const query = search ? { content: { $regex: search, $options: 'i' } } : {};
      const res = await base44.entities.Memory.filter(query, { sort: '-importance', limit: 30 });
      setMemories(res.items || res || []);
    } catch (e) {
      // empty
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const handleAdd = async () => {
    if (!newMemory.content.trim()) return;
    try {
      await base44.entities.Memory.create({
        content: newMemory.content,
        memory_type: newMemory.memory_type,
        importance: Number(newMemory.importance),
        tags: newMemory.tags
      });
      setNewMemory({ content: "", memory_type: "observation", importance: 5, tags: "" });
      setShowAdd(false);
      loadMemories();
    } catch (e) {
      // error
    }
  };

  const typeColors = {
    observation: "bg-sky-100 text-sky-700",
    reflection: "bg-violet-100 text-violet-700",
    fact: "bg-emerald-100 text-emerald-700",
    preference: "bg-amber-100 text-amber-700",
    event: "bg-rose-100 text-rose-700"
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold">Memory System</h3>
            <p className="text-xs text-muted-foreground">Persistent agent memory across all interactions</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search memories..."
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
          <textarea
            value={newMemory.content}
            onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
            placeholder="Memory content..."
            rows={2}
            className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <select
              value={newMemory.memory_type}
              onChange={e => setNewMemory({ ...newMemory, memory_type: e.target.value })}
              className="text-xs rounded-md border border-input bg-transparent px-2 py-1"
            >
              <option value="observation">Observation</option>
              <option value="reflection">Reflection</option>
              <option value="fact">Fact</option>
              <option value="preference">Preference</option>
              <option value="event">Event</option>
            </select>
            <input
              type="number"
              min="1"
              max="10"
              value={newMemory.importance}
              onChange={e => setNewMemory({ ...newMemory, importance: e.target.value })}
              className="text-xs rounded-md border border-input bg-transparent px-2 py-1 w-16"
            />
            <input
              value={newMemory.tags}
              onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })}
              placeholder="tags"
              className="text-xs rounded-md border border-input bg-transparent px-2 py-1 flex-1"
            />
            <Button size="sm" onClick={handleAdd}>Save</Button>
          </div>
        </div>
      )}

      <div className="max-h-48 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No memories yet. Memories are created by agents during audits and conversations.</p>
        ) : (
          memories.map(m => (
            <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${typeColors[m.memory_type] || 'bg-muted'}`}>
                {m.memory_type}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{m.content}</p>
                {m.tags && <p className="text-[10px] text-muted-foreground mt-0.5">#{m.tags.split(',').join(' #')}</p>}
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">{m.importance}/10</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}