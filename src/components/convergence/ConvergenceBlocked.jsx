import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ArrowRight } from "lucide-react";

// Blockers and the precise next actions. Each action is either code work or an owner decision,
// and the UI says which: an agent must not decide authorization policy on its own.
export default function ConvergenceBlocked({ blocked, nextActions }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card>
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <p className="text-sm font-semibold">Blocked, with the reason</p>
          </div>
          {(blocked || []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing is reporting as blocked by the sources read.</p>
          ) : (
            <ul className="space-y-1.5">
              {blocked.map((line) => (
                <li key={line} className="text-xs text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Precise next actions</p>
          </div>
          <ul className="space-y-2">
            {(nextActions || []).map((item) => (
              <li key={item.id} className="text-xs">
                <span className="font-mono text-muted-foreground">{item.id}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>{" "}
                <Badge variant="outline" className="text-[10px] font-normal align-middle">
                  {item.owner_decision ? "owner decision" : "code work"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}