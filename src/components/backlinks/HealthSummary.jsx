import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Layers, Radio } from "lucide-react";

const countBy = (rows, key, value) =>
  rows.filter((row) => (row[key] ?? null) === value).reduce((sum, row) => sum + (row.count || 0), 0);

const ATTENTION = ["degraded", "not_live", "down"];

export default function HealthSummary({ statusRows, healthRows }) {
  const total = statusRows.reduce((sum, row) => sum + (row.count || 0), 0);
  const live = countBy(statusRows, "status", "deployed");
  const needsAttention = healthRows
    .filter((row) => ATTENTION.includes(row.health_status))
    .reduce((sum, row) => sum + (row.count || 0), 0);
  const unchecked = healthRows
    .filter((row) => !row.health_status || row.health_status === "unknown")
    .reduce((sum, row) => sum + (row.count || 0), 0);

  const cards = [
    { label: "Total sites", value: total, icon: Layers, tone: "text-foreground" },
    { label: "Live & deployed", value: live, icon: Radio, tone: "text-green-600" },
    { label: "Needs attention", value: needsAttention, icon: AlertTriangle, tone: "text-red-600" },
    { label: "Not checked yet", value: unchecked, icon: CheckCircle2, tone: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="py-3 flex items-center gap-3">
            <card.icon className={`w-5 h-5 shrink-0 ${card.tone}`} />
            <div className="min-w-0">
              <p className={`text-xl font-bold leading-tight ${card.tone}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground truncate">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}