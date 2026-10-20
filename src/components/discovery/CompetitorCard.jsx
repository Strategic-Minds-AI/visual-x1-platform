import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ExternalLink, ThumbsDown, ThumbsUp, ShieldQuestion } from "lucide-react";

const DIMS = [
  ["visual_score", "Visual"],
  ["trust_score", "Trust"],
  ["offer_score", "Offer"],
  ["conversion_score", "Conversion"],
  ["content_score", "Content"],
];

const list = (v) => {
  try {
    const p = JSON.parse(v || "[]");
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

// One competitor, with the rubric behind the score and the evidence behind the claims.
export default function CompetitorCard({ competitor }) {
  if (!competitor) return null;
  const composite = Number(competitor.composite_score) || 0;
  const tone = composite >= 70 ? "text-destructive" : composite >= 45 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">#{competitor.rank || "—"}</Badge>
            <h3 className="font-heading text-sm font-semibold truncate">{competitor.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
            {competitor.url && (
              <a href={competitor.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <ExternalLink className="w-3 h-3" /> {competitor.url.replace(/^https?:\/\//, "").slice(0, 40)}
              </a>
            )}
            {(competitor.city || competitor.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {[competitor.city, competitor.state].filter(Boolean).join(", ")}
                {competitor.distance_miles ? ` · ${competitor.distance_miles} mi` : ""}
              </span>
            )}
            {competitor.review_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" /> {competitor.review_rating}
                {competitor.review_count > 0 ? ` (${competitor.review_count})` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${tone}`}>{composite}</p>
          <p className="text-[11px] text-muted-foreground">composite /100</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {competitor.positioning && <p className="text-xs text-muted-foreground">{competitor.positioning}</p>}

        <div className="grid grid-cols-5 gap-2">
          {DIMS.map(([key, label]) => {
            const v = Number(competitor[key]) || 0;
            return (
              <div key={key}>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={v >= 70 ? "h-full bg-destructive" : v >= 45 ? "h-full bg-amber-500" : "h-full bg-emerald-500"}
                    style={{ width: `${v}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{label} {v}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {list(competitor.strengths_json).length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Strengths
              </p>
              <ul className="mt-1 space-y-0.5">
                {list(competitor.strengths_json).map((s) => <li key={s} className="text-xs text-muted-foreground">· {s}</li>)}
              </ul>
            </div>
          )}
          {list(competitor.negative_themes_json).length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" /> Complaints found
              </p>
              <ul className="mt-1 space-y-0.5">
                {list(competitor.negative_themes_json).map((s) => <li key={s} className="text-xs text-muted-foreground">· {s}</li>)}
              </ul>
            </div>
          )}
        </div>

        {list(competitor.weaknesses_json).length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Where they are beatable</p>
            <ul className="mt-1 space-y-0.5">
              {list(competitor.weaknesses_json).map((s) => <li key={s} className="text-xs">· {s}</li>)}
            </ul>
          </div>
        )}

        {list(competitor.price_signals_json).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {list(competitor.price_signals_json).map((s) => (
              <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
            ))}
          </div>
        )}

        {competitor.verdict && <p className="text-xs bg-muted/50 rounded p-2">{competitor.verdict}</p>}

        <div className="flex items-start gap-4 text-[11px] text-muted-foreground flex-wrap">
          {list(competitor.skip_trace_json).length > 0 && (
            <span className="flex items-start gap-1">
              <ShieldQuestion className="w-3 h-3 mt-0.5" /> Public details: {list(competitor.skip_trace_json).slice(0, 4).join(" · ")}
            </span>
          )}
          {list(competitor.source_urls_json).length > 0 && (
            <span>Sources: {list(competitor.source_urls_json).length} linked</span>
          )}
        </div>
      </div>
    </div>
  );
}