import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// What a project dashboard can only ask the server for: which of the app's connections
// are really there, whether each secret the app uses is set at all, and sending one
// project message to a registered app user. Nothing here reports a value it did not
// read, and a secret's value is never read, stored or returned — only whether the name
// is set.

const CONNECTIONS = [
  { type: 'supabase', powers: 'the database and storage layer' },
  { type: 'github', powers: 'the repository menu and source captures' },
  { type: 'google_analytics', powers: 'traffic trends' },
  { type: 'googlesheets', powers: 'metric sync' },
  { type: 'googletasks', powers: 'job and todo sync' },
  { type: 'googledrive', powers: 'drive reads' },
  { type: 'google_search_console', powers: 'index, sitemap and search performance reads' },
  { type: 'gmail', powers: 'reading and sending mail' },
  { type: 'googlecalendar', powers: 'calendar work' },
  { type: 'hubspot', powers: 'crm records' },
  { type: 'googledocs', powers: 'document reads' },
];

const SECRETS = [
  { name: 'VERCEL_TOKEN', present: Boolean(process.env.VERCEL_TOKEN), used_by: 'vercelConsole — reading and deploying Vercel projects' },
  { name: 'OLLAMA_MODEL', present: Boolean(process.env.OLLAMA_MODEL), used_by: 'local model runs' },
  { name: 'OLLAMA_BASE_URL', present: Boolean(process.env.OLLAMA_BASE_URL), used_by: 'local model runs' },
  { name: 'RAILWAY_TOKEN', present: Boolean(process.env.RAILWAY_TOKEN), used_by: 'reading Railway projects, services and worker health' },
  { name: 'SUPABASE_ACCESS_TOKEN', present: Boolean(process.env.SUPABASE_ACCESS_TOKEN), used_by: 'optional direct Supabase reads when no connector is authorized' },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

    // One message about this project, to someone who actually has an account here:
    // the recipient is resolved against the app's own users before anything is sent.
    if (action === 'send_email') {
      const to = String(body.to_email || '').trim().toLowerCase();
      const subject = String(body.subject || '').trim();
      const message = String(body.body || '').trim();
      if (!to) return Response.json({ error: 'An email address is required.' }, { status: 400 });
      if (!subject) return Response.json({ error: 'A subject is required.' }, { status: 400 });
      if (!message) return Response.json({ error: 'A message is required.' }, { status: 400 });

      const page = await base44.asServiceRole.entities.User.list('-created_date', 200);
      const users = Array.isArray(page) ? page : page.items || [];
      const recipient = users.find((u: any) => String(u.email || '').toLowerCase() === to);
      if (!recipient) {
        return Response.json(
          { error: `${to} is not an app user here, so this app cannot email it. Invite them under App Users first.` },
          { status: 200 }
        );
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        subject: subject.slice(0, 160),
        body: `${message}\n\n— sent from the Visual X editor for project ${String(body.project || '').slice(0, 120)}`,
      });
      return Response.json({
        ok: true,
        sent_to: recipient.email,
        method: 'Sent through the app\'s own mail service to a registered app user.',
      });
    }

    const connectors = [];
    for (const connection of CONNECTIONS) {
      let connected = false;
      try {
        const found = await base44.asServiceRole.connectors.getConnection(connection.type);
        connected = Boolean(found && found.accessToken);
      } catch {
        connected = false;
      }
      connectors.push({ ...connection, connected });
    }

    return Response.json({
      ok: true,
      connectors,
      secrets: SECRETS,
      method:
        'Connections are read from this app\'s own connection store, as it stands for this caller: a shared connection, or one this operator authorized themselves. Secrets report whether the name is set, never its value.',
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'The project console read failed.' }, { status: 500 });
  }
}