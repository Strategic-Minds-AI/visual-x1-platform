import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { maskValue } from '../../shared/loop.ts';

// The guardian vault. It holds references and rotation state rather than raw
// credentials — the platform's own Secrets page remains the only place a value
// lives — so a read here can be shown, counted and attributed without a secret
// ever entering a prompt, a log or a page. Every read is written to the entry's
// audit trail and to AuditLog, whoever performed it.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const actor = String(body.actor || 'operator');

    if (action === 'list') {
      const page = await service.entities.SecretVault.filter({}, { limit: 100, sort: '-updated_date' });
      const items = (page.items || []).map((entry) => ({
        id: entry.id,
        tool_name: entry.tool_name,
        secret_key: entry.secret_key,
        masked: maskValue(entry.secret_value),
        refers_to: entry.refers_to || '',
        category: entry.category,
        environment: entry.environment,
        access_level: entry.access_level || 'operator',
        guardian_only: entry.guardian_only === true,
        scopes: entry.scopes || [],
        is_active: entry.is_active !== false,
        rotation_owner: entry.rotation_owner || '',
        last_rotated: entry.last_rotated || '',
        rotation_reminder_days: entry.rotation_reminder_days,
        access_count: entry.access_count || 0,
        last_accessed: entry.last_accessed || '',
        last_accessed_by: entry.last_accessed_by || '',
        needs_rotation: entry.last_rotated
          ? (Date.now() - new Date(entry.last_rotated).getTime()) / 86400000 > (entry.rotation_reminder_days || 90)
          : true,
      }));
      return Response.json({
        entries: items,
        guardian_entries: items.filter((i) => i.guardian_only).length,
        needing_rotation: items.filter((i) => i.needs_rotation).length,
        note: 'This vault holds references and rotation state. Real values live in the platform Secrets page.',
      });
    }

    const id = String(body.id || '').trim();
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    const entry = await service.entities.SecretVault.get(id);
    if (!entry) return Response.json({ error: 'No vault entry with that id' }, { status: 404 });

    if (action === 'reveal') {
      const trail = JSON.parse(entry.audit_trail_json || '[]');
      trail.push({ at: new Date().toISOString(), by: user.email, actor, reason: body.reason || 'read from the console' });
      await service.entities.SecretVault.update(id, {
        access_count: (entry.access_count || 0) + 1,
        last_accessed: new Date().toISOString(),
        last_accessed_by: user.email,
        audit_trail_json: JSON.stringify(trail.slice(-25)),
      });
      await service.entities.AuditLog.create({
        entity_type: 'SecretVault',
        entity_id: id,
        action: 'view',
        user_email: user.email,
        details: `${actor} read ${entry.tool_name} / ${entry.secret_key}${entry.guardian_only ? ' (guardian scope)' : ''} — ${body.reason || 'no reason given'}`,
        severity: entry.guardian_only ? 'warning' : 'info',
      });
      return Response.json({
        id,
        tool_name: entry.tool_name,
        secret_key: entry.secret_key,
        refers_to: entry.refers_to || '',
        description: entry.description || '',
        scopes: entry.scopes || [],
        guardian_only: entry.guardian_only === true,
        access_count: (entry.access_count || 0) + 1,
        audit_trail: trail.slice(-25),
      });
    }

    if (action === 'rotate') {
      await service.entities.SecretVault.update(id, {
        last_rotated: new Date().toISOString(),
        audit_trail_json: JSON.stringify([
          ...JSON.parse(entry.audit_trail_json || '[]').slice(-24),
          { at: new Date().toISOString(), by: user.email, actor, event: 'rotation recorded' },
        ]),
      });
      await service.entities.AuditLog.create({
        entity_type: 'SecretVault',
        entity_id: id,
        action: 'rotate',
        user_email: user.email,
        details: `${actor} recorded a rotation for ${entry.tool_name} / ${entry.secret_key}`,
        severity: 'warning',
      });
      return Response.json({ ok: true, id, rotated_at: new Date().toISOString() });
    }

    return Response.json({ error: 'action must be list, reveal or rotate' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}