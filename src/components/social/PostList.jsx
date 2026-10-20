import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, RotateCcw, X } from "lucide-react";

const STATUS_STYLES = {
  staged: "bg-sky-500/15 text-sky-400 border-sky-500/40",
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  posted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  rejected: "bg-rose-500/15 text-rose-400 border-rose-500/40"
};

const parse = (v) => {
  try {
    return JSON.parse(v || "{}") || {};
  } catch {
    return {};
  }
};

export default function PostList({ posts, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  if (!posts.length) {
    return <p className="text-sm text-muted-foreground">No posts staged yet. Draft a schedule to fill the calendar.</p>;
  }

  const move = async (post, status) => {
    setBusyId(post.id);
    try {
      const updated = await base44.entities.SocialPost.update(post.id, {
        status,
        ...(status === "posted" ? { posted_at: new Date().toISOString() } : {})
      });
      onChanged?.({ ...post, ...updated, status });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const refs = parse(post.source_refs_json);
        return (
          <Card key={post.id}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">Day {post.day_index}</Badge>
                <Badge variant="outline" className="text-xs">{post.scheduled_date}</Badge>
                <Badge variant="outline" className="text-xs">{post.platform}</Badge>
                <Badge variant="outline" className="text-xs">{post.post_type}</Badge>
                <Badge className={cn("text-xs border", STATUS_STYLES[post.status] || STATUS_STYLES.staged)} variant="outline">
                  {post.status}
                </Badge>
              </div>

              {post.hook && <p className="text-sm font-medium">{post.hook}</p>}
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{post.caption}</p>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {post.cta && <span>CTA: {post.cta}</span>}
                {post.hashtags && <span className="truncate">{post.hashtags}</span>}
              </div>

              {refs.angle && <p className="text-xs text-muted-foreground">Strategy: {refs.angle}</p>}

              {post.image_prompt && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Visual prompt</summary>
                  <p className="mt-1.5 whitespace-pre-wrap">{post.image_prompt}</p>
                </details>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyId === post.id || post.status === "posted"} onClick={() => move(post, "posted")}>
                  <Check className="w-3 h-3 mr-1" /> Mark posted
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busyId === post.id || post.status === "draft"} onClick={() => move(post, "draft")}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Back to draft
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busyId === post.id || post.status === "rejected"} onClick={() => move(post, "rejected")}>
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}