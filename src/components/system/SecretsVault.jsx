import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Eye, EyeOff, Plus, Trash2, RotateCw, History, Shield, Lock } from "lucide-react";

const CATEGORY_LABELS = {
  api_key: "API Key", webhook_secret: "Webhook Secret", oauth_token: "OAuth Token",
  database_url: "Database URL", encryption_key: "Encryption Key", other: "Other"
};
const ENV_LABELS = { production: "Production", staging: "Staging", development: "Development" };

export default function SecretsVault() {
  const [secrets, setSecrets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [newSecret, setNewSecret] = useState({
    tool_name: "", secret_key: "", secret_value: "", description: "",
    category: "api_key", environment: "production", rotation_reminder_days: 90
  });

  const loadData = useCallback(async () => {
    try {
      const [secRes, logRes] = await Promise.all([
        base44.entities.SecretVault.filter({}, { sort: "-created_date", limit: 50 }),
        base44.entities.AuditLog.filter({ entity_type: "secret" }, { sort: "-created_date", limit: 20 })
      ]);
      setSecrets(secRes.items || []);
      setAuditLogs(logRes.items || []);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleReveal = async (id) => {
    if (revealed[id]) {
      setRevealed({ ...revealed, [id]: false });
    } else {
      try {
        const sec = secrets.find(s => s.id === id);
        await base44.entities.SecretVault.update(id, {
          access_count: (sec.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        });
        await base44.entities.AuditLog.create({
          entity_type: "secret", entity_id: id, action: "view",
          details: `Viewed secret for ${sec?.tool_name || "unknown"}`,
          severity: "info"
        });
        setRevealed({ ...revealed, [id]: true });
      } catch (e) { /* ignore */ }
    }
  };

  const handleAdd = async () => {
    if (!newSecret.tool_name || !newSecret.secret_key || !newSecret.secret_value) return;
    try {
      await base44.entities.SecretVault.create({
        ...newSecret,
        last_rotated: new Date().toISOString()
      });
      await base44.entities.AuditLog.create({
        entity_type: "secret", action: "create",
        details: `Created secret for ${newSecret.tool_name} (${newSecret.secret_key})`,
        severity: "warning"
      });
      setNewSecret({ tool_name: "", secret_key: "", secret_value: "", description: "", category: "api_key", environment: "production", rotation_reminder_days: 90 });
      setShowAdd(false);
      loadData();
    } catch (e) { /* ignore */ }
  };

  const handleRotate = async (id) => {
    const sec = secrets.find(s => s.id === id);
    const newVal = prompt(`Enter new value for ${sec?.tool_name} — ${sec?.secret_key}:`);
    if (!newVal) return;
    try {
      await base44.entities.SecretVault.update(id, {
        secret_value: newVal, last_rotated: new Date().toISOString()
      });
      await base44.entities.AuditLog.create({
        entity_type: "secret", entity_id: id, action: "rotate",
        details: `Rotated secret for ${sec?.tool_name} — ${sec?.secret_key}`,
        severity: "warning"
      });
      loadData();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this secret permanently?")) return;
    try {
      const sec = secrets.find(s => s.id === id);
      await base44.entities.SecretVault.delete(id);
      await base44.entities.AuditLog.create({
        entity_type: "secret", entity_id: id, action: "delete",
        details: `Deleted secret for ${sec?.tool_name} — ${sec?.secret_key}`,
        severity: "critical"
      });
      loadData();
    } catch (e) { /* ignore */ }
  };

  const maskValue = (val) => {
    if (!val) return "—";
    if (val.length <= 8) return "•".repeat(val.length);
    return val.slice(0, 4) + "•".repeat(Math.min(val.length - 8, 20)) + val.slice(-4);
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading secrets...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-base">Secrets Vault</CardTitle>
              <p className="text-xs text-muted-foreground">Encrypted key management — all access logged</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLog(!showLog)}>
              <History className="w-3.5 h-3.5 mr-1.5" /> Audit Log
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Secret</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Secret to Vault</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div><Label>Tool Name</Label><Input value={newSecret.tool_name} onChange={e => setNewSecret({ ...newSecret, tool_name: e.target.value })} placeholder="e.g., OpenAI, Stripe" /></div>
                  <div><Label>Secret Key</Label><Input value={newSecret.secret_key} onChange={e => setNewSecret({ ...newSecret, secret_key: e.target.value })} placeholder="e.g., API_KEY" /></div>
                  <div><Label>Secret Value</Label><Input type="password" value={newSecret.secret_value} onChange={e => setNewSecret({ ...newSecret, secret_value: e.target.value })} placeholder="The actual secret" /></div>
                  <div><Label>Description</Label><Input value={newSecret.description} onChange={e => setNewSecret({ ...newSecret, description: e.target.value })} placeholder="What this secret is used for" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Category</Label>
                      <Select value={newSecret.category} onValueChange={v => setNewSecret({ ...newSecret, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Environment</Label>
                      <Select value={newSecret.environment} onValueChange={v => setNewSecret({ ...newSecret, environment: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(ENV_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter><Button onClick={handleAdd}>Add to Vault</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showLog ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Access Log</div>
            {auditLogs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No access logged yet.</p> :
              auditLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs p-2 rounded-md bg-muted/30">
                  <Badge variant={log.severity === "critical" ? "destructive" : log.severity === "warning" ? "secondary" : "outline"} className="text-[10px]">{log.action}</Badge>
                  <div className="flex-1"><span className="text-foreground">{log.details}</span><span className="text-muted-foreground ml-2">{new Date(log.created_date).toLocaleString()}</span></div>
                </div>
              ))
            }
          </div>
        ) : secrets.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No secrets stored. Add your first external tool key to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {secrets.map(sec => (
              <div key={sec.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{sec.tool_name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{CATEGORY_LABELS[sec.category] || sec.category}</Badge>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{ENV_LABELS[sec.environment] || sec.environment}</Badge>
                    {!sec.is_active && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">{sec.secret_key}:</span>
                    <code className="text-xs font-mono text-foreground/70">{revealed[sec.id] ? sec.secret_value : maskValue(sec.secret_value)}</code>
                  </div>
                  {sec.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sec.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(sec.id)}>
                    {revealed[sec.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRotate(sec.id)}>
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(sec.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}