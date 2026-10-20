import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScheduleGenerator from "@/components/social/ScheduleGenerator";
import PostList from "@/components/social/PostList";
import { CalendarClock } from "lucide-react";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "staged", label: "Staged" },
  { id: "draft", label: "Needs work" },
  { id: "posted", label: "Posted" },
  { id: "rejected", label: "Rejected" }
];

export default function SocialStudio() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await base44.entities.ClientIntake.filter({}, { sort: "-created_date", limit: 50 });
      setClients(res.items || []);
    };
    load();
  }, []);

  const loadPosts = useCallback(async (id) => {
    if (!id) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await base44.entities.SocialPost.filter({ client_id: id }, { sort: "scheduled_date", limit: 100 });
      setPosts(res.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(clientId);
  }, [clientId, loadPosts]);

  const visible = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const onChanged = (post) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Social Studio</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Draft a full schedule from the SEO strategy and the business record, then work it day by day. Every post is staged when it is
          written, so nothing publishes itself.
        </p>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-5 items-start">
          <ScheduleGenerator onGenerated={loadPosts} />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Choose a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
              {FILTERS.map((f) => (
                <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} onClick={() => setFilter(f.id)}>
                  {f.label}
                </Button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : clientId ? (
              <PostList posts={visible} onChanged={onChanged} />
            ) : (
              <p className="text-sm text-muted-foreground">Pick a client to see their staged schedule.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}