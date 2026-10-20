import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GitCompare, Save, Trash2 } from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function VersionCompare({ versions, onSave, onDelete, onLoad, currentResult }) {
  const [label, setLabel] = useState("");

  const chartData = versions.map((v) => ({
    name: v.name,
    days: v.days_to_page1_p50 || 0,
    sessions: v.expected_sessions_12m || 0,
  }));

  const save = () => {
    const name = label.trim() || `Version ${String.fromCharCode(65 + versions.length)}`;
    onSave(name);
    setLabel("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4" /> Site Versions
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Snapshot the current strategy set as a version, then compare versions side by side.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            className="h-8 text-sm"
            placeholder={`Version ${String.fromCharCode(65 + versions.length)}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button size="sm" className="h-8 gap-1 shrink-0" onClick={save} disabled={!currentResult}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>

        {versions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No saved versions yet. Change the toggles, save, then compare.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {fmt(v.days_to_page1_p50)} days · {fmt(v.expected_sessions_12m)} sessions 12m · {fmt(v.expected_leads_12m)} leads
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">score {Math.round(v.overall_score || 0)}</Badge>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => onLoad(v)}>Load</Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onDelete(v)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="days" fill="#f59e0b" name="Days to page 1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}