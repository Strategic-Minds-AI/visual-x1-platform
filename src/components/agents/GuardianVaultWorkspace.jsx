import React, { useCallback, useEffect, useState } from "react";
import { Eye, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Panel, PrimaryButton, OutlineButton, Metric, StatusPill, Empty, ErrorText } from "@/components/admin/adminUi";
import { Switch } from "@/components/ui/switch";
import { vaultCall } from "@/lib/loopApi";
import { base44 } from "@/api/base44Client";

// The guardian vault. It holds what a credential is, where the real value lives, what
// it permits and when it was last rotated — never the value itself, which stays on the
// platform's Secrets page. The guardian is the only agent granted access, and every
// read is written to the entry's trail and the audit log.
export default function GuardianVaultWorkspace() {
  const [state, setState] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tool_name: "",
    secret_key: "",
    refers_to: "",
    description: "",
    category: "api_key",
    environment: "production",
    access_level: "operator",
    guardian_only: false,
    scopes: "",
    rotation_owner: "Operator",
    rotation_reminder_days: 90,
  });

  const load = useCallback(async () => {
    try {
      setState(await vaultCall({ action: "list" }));
    } catch (e) {
      setError(e?.message || "The vault could not be read.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!form.tool_name || !form.secret_key) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.SecretVault.create({
        tool_name: form.tool_name,
        secret_key: form.secret_key,
        refers_to: form.refers_to,
        description: form.description,
        category: form.category,
        environment: form.environment,
        access_level: form.access_level,
        guardian_only: form.guardian_only,
        scopes: String(form.scopes || "").split(",").map((s) => s.trim()).filter(Boolean),
        rotation_owner: form.rotation_owner,
        rotation_reminder_days: Number(form.rotation_reminder_days) || 90,
        is_active: true,
        access_count: 0,
      });
      setForm({ ...form, tool_name: "", secret_key: "", refers_to: "", description: "", scopes: "", guardian_only: false });
      await load();
    } catch (e) {
      setError(e?.message || "The entry could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const reveal = async (entry) => {
    setBusy(true);
    setError("");
    try {
      setRevealed(await vaultCall({ action: "reveal", id: entry.id, reason: "read from the vault page" }));
      await load();
    } catch (e) {
      setError(e?.message || "The entry could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const rotate = async (entry) => {
    setBusy(true);
    try {
      await vaultCall({ action: "rotate", id: entry.id });
      await load();
    } catch (e) {
      setError(e?.message || "The rotation could not be recorded.");
    } finally {
      setBusy(false);
    }
  };

  const entries = state?.entries || [];

  return (
    <div className="cp-admin-stack">
      <div className="cp-metrics">
        <Metric label="Vault entries" value={String(entries.length)} foot="References, not values" accent />
        <Metric label="Guardian scope" value={String(state?.guardian_entries ?? 0)} foot="Audited on every read" />
        <Metric label="Needing rotation" value={String(state?.needing_rotation ?? 0)} foot="Past the reminder window" />
        <Metric label="Reads recorded" value={String(entries.reduce((sum, e) => sum + (e.access_count || 0), 0))} foot="Access trail" />
      </div>

      <ErrorText>{error}</ErrorText>

      <Panel
        kicker="GUARDIAN VAULT"
        title="What the system may hold"
        aside={
          <div className="cp-admin-actions">
            <OutlineButton disabled={busy} onClick={load}>
              <RefreshCw size={13} /> REFRESH
            </OutlineButton>
            <span className="cp-fine"><ShieldCheck size={12} className="inline" /> guardian is the only agent with access</span>
          </div>
        }
      >
        <p className="cp-fine">
          {state?.note || "This vault holds references and rotation state."} A value stored here would be visible to the
          console, so the real secret belongs on the platform's Secrets page and the vault records how to reach it.
        </p>

        <div className="cp-admin-grid" style={{ marginTop: 12 }}>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Service</span>
            <input className="cp-field" value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} />
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Key name</span>
            <input className="cp-field" value={form.secret_key} onChange={(e) => setForm({ ...form, secret_key: e.target.value })} />
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Value lives in</span>
            <input
              className="cp-field"
              placeholder="platform secret name, provider console, or your own vault"
              value={form.refers_to}
              onChange={(e) => setForm({ ...form, refers_to: e.target.value })}
            />
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Category</span>
            <select className="cp-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["api_key", "webhook_secret", "oauth_token", "database_url", "encryption_key", "other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Scopes</span>
            <input className="cp-field" placeholder="what this credential permits" value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} />
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Rotation owner</span>
            <input className="cp-field" value={form.rotation_owner} onChange={(e) => setForm({ ...form, rotation_owner: e.target.value })} />
          </label>
          <label className="cp-admin-inline-field" style={{ alignItems: "center" }}>
            <span className="cp-fine" style={{ minWidth: 110 }}>Guardian only</span>
            <Switch checked={form.guardian_only} onCheckedChange={(v) => setForm({ ...form, guardian_only: v })} />
          </label>
          <PrimaryButton disabled={busy || !form.tool_name || !form.secret_key} onClick={add}>
            <Plus size={13} /> ADD ENTRY
          </PrimaryButton>
        </div>
      </Panel>

      {revealed && (
        <Panel kicker="READ" title={`${revealed.tool_name} / ${revealed.secret_key}`} aside={<OutlineButton onClick={() => setRevealed(null)}>CLOSE</OutlineButton>}>
          <p className="cp-fine">Value lives in · {revealed.refers_to || "not recorded"}</p>
          <p className="cp-fine">Scopes · {(revealed.scopes || []).join(", ") || "not recorded"}</p>
          <p className="cp-fine">Reads recorded · {revealed.access_count}</p>
          <p className="cp-fine">
            Trail · {(revealed.audit_trail || []).slice(-5).map((t) => `${new Date(t.at).toLocaleString()} by ${t.by}${t.actor ? ` (${t.actor})` : ""}`).join(" · ") || "first read"}
          </p>
        </Panel>
      )}

      <Panel kicker="ENTRIES" title="Every credential the system knows about">
        {entries.length === 0 ? (
          <Empty>Nothing in the vault yet. Add an entry to record what a credential is, what it permits and where the value lives.</Empty>
        ) : (
          <div className="cp-admin-stack">
            {entries.map((entry) => (
              <div key={entry.id} className="cp-admin-inline-field">
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{entry.tool_name} · {entry.secret_key}</h3>
                  <p className="cp-fine">
                    {entry.masked || "no value stored"} · {entry.category} · {entry.environment} · lives in{" "}
                    {entry.refers_to || "not recorded"}
                  </p>
                  <p className="cp-fine">
                    Scopes · {(entry.scopes || []).join(", ") || "not recorded"} · rotation owner {entry.rotation_owner || "unset"} ·{" "}
                    {entry.last_rotated ? `last rotated ${new Date(entry.last_rotated).toLocaleDateString()}` : "never rotated"}
                  </p>
                  <p className="cp-fine">Reads · {entry.access_count}{entry.last_accessed_by ? ` · last by ${entry.last_accessed_by}` : ""}</p>
                </div>
                <div className="cp-admin-row-buttons">
                  <StatusPill>{entry.access_level}</StatusPill>
                  {entry.guardian_only && <StatusPill>guardian</StatusPill>}
                  {entry.needs_rotation && <StatusPill>rotate</StatusPill>}
                  <OutlineButton disabled={busy} onClick={() => reveal(entry)}>
                    <Eye size={12} /> READ
                  </OutlineButton>
                  <OutlineButton disabled={busy} onClick={() => rotate(entry)}>ROTATED</OutlineButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}