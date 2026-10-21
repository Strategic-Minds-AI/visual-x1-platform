import React from "react";
import { Link } from "react-router-dom";
import { Layers, ArrowRight, CheckCircle2, Circle, MinusCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUILDER_SURFACES, STATUS_LABELS } from "@/data/builderSurfaces";
import { cn } from "@/lib/utils";

const TONE = {
  covered: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  partial: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  dashboard_only: "border-border bg-muted/40 text-muted-foreground",
  gap: "border-rose-500/40 bg-rose-500/15 text-rose-300"
};

const ICONS = {
  covered: CheckCircle2,
  partial: Circle,
  dashboard_only: MinusCircle,
  gap: AlertTriangle
};

export default function BuilderMap() {
  const counts = BUILDER_SURFACES.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Builder Map</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
          Every surface the builder gives you, mapped to what this app already does with it. This page is a map, not a control panel:
          where a surface is platform-owned it says so rather than offering a button that cannot work.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <Badge key={key} variant="outline" className={cn("text-xs border gap-1", TONE[key])}>
              {label}: {counts[key] || 0}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3">
          {BUILDER_SURFACES.map((s) => {
            const Icon = ICONS[s.status];
            return (
              <Card key={s.surface}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {s.surface}
                    <Badge variant="outline" className={cn("text-xs border ml-auto", TONE[s.status])}>
                      {STATUS_LABELS[s.status]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{s.gives_you}</p>
                  <p className="text-sm">{s.note}</p>
                  {s.where_in_app ? (
                    <Link to={s.where_in_app} className="inline-flex items-center gap-1 text-xs underline underline-offset-4">
                      Open {s.where_in_app} <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-5">
          Researched from the platform's own documentation for the builder dashboard. Where this map says dashboard only, that is a
          deliberate boundary: the surface stays where it belongs.
        </p>
      </div>
    </div>
  );
}