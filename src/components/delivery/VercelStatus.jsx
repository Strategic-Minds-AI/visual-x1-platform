import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Loader2, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";

const PERSONAL = "personal";

export default function VercelStatus({ status, checking, error, team, onTeam, onRecheck }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-4 h-4" /> Vercel connection
          {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checking && <p className="text-sm text-muted-foreground">Asking Vercel who this token is…</p>}

        {!checking && error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2 text-amber-900">
              <ShieldAlert className="w-4 h-4" /> {error}
            </p>
            <div className="text-xs text-amber-900/90 space-y-1.5">
              <p className="font-medium">What the token needs</p>
              <p>
                A Vercel token does not take individual scopes. Access is decided by the scope you choose when you create it: your
                personal account, or one team. Create it under <span className="font-medium">Account Settings → Tokens</span>, scoped
                to the team that holds the projects you want this console to reach, and give it no expiry you cannot live with.
              </p>
              <p>
                It is stored as the app secret <span className="font-mono">VERCEL_TOKEN</span> (app dashboard → Secrets). This console
                never displays it and never sends it anywhere except api.vercel.com.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onRecheck}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Check again
            </Button>
          </div>
        )}

        {!checking && status && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </Badge>
              <span className="text-sm">
                {status.account?.username || status.account?.name || "account"}
                {status.account?.email ? <span className="text-muted-foreground"> · {status.account.email}</span> : null}
              </span>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={onRecheck}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Recheck
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Scope</span>
              <Select value={team || PERSONAL} onValueChange={(v) => onTeam(v === PERSONAL ? "" : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PERSONAL}>Personal account</SelectItem>
                  {(status.teams || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name || t.slug}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {status.teams?.length
                ? `${status.teams.length} team(s) visible to this token. Switch scope to see that team's projects.`
                : "This token sees no teams, so it is scoped to the personal account."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}