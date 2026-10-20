import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const AGENT_SHEET = 'Agent Metrics';
const SEO_SHEET = 'SEO Rankings';

const AGENT_HEADERS = ['Date', 'Agent', 'Role', 'Assigned Jobs', 'Completed Jobs', 'Avg Progress (%)'];
const SEO_HEADERS = ['Date', 'Keyword', 'Location', 'URL', 'Status', 'Google Score'];

async function appendRows(accessToken, spreadsheetId, sheetName, column, values, headers) {
  const range = `${sheetName}!${column}`;
  const body = { values: headers ? [headers, ...values] : values };
  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!res.ok) throw new Error(`Sheets append failed (${res.status}): ${await res.text()}`);
  return values.length;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Google Sheets connector not authorized.', not_connected: true }, { status: 400 });
    }

    // --- Find or create the target spreadsheet ---------------------------------
    const existingConfig = await base44.asServiceRole.entities.SheetSync.filter({ is_active: true }, { limit: 1 });
    let config = existingConfig.items && existingConfig.items.length ? existingConfig.items[0] : null;
    let spreadsheetId = config ? config.spreadsheet_id : null;
    let spreadsheetUrl = config ? config.spreadsheet_url : null;
    let isNew = false;

    if (!spreadsheetId) {
      const createRes = await fetch(SHEETS_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: 'Visual X — Daily Metrics' },
          sheets: [{ properties: { title: AGENT_SHEET } }, { properties: { title: SEO_SHEET } }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!createRes.ok) return Response.json({ error: `Could not create spreadsheet: ${await createRes.text()}` }, { status: 502 });
      const created = await createRes.json();
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = created.spreadsheetUrl;
      isNew = true;
      config = await base44.asServiceRole.entities.SheetSync.create({
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        is_active: true,
      });
    }

    // --- Gather agent performance metrics --------------------------------------
    const [agentsPage, agentTotals, agentCompleted] = await Promise.all([
      base44.asServiceRole.entities.Agent.list({ limit: 200, fields: ['name', 'role'] }),
      base44.asServiceRole.entities.Job.aggregate({ groupBy: 'assigned_agent_id', avg: ['progress'] }),
      base44.asServiceRole.entities.Job.aggregate({ query: { status: 'completed' }, groupBy: 'assigned_agent_id' }),
    ]);

    const agents = agentsPage.items || [];
    const agentById = new Map(agents.map((a) => [a.id, a]));

    const completedByAgent = new Map();
    (agentCompleted.rows || []).forEach((row) => completedByAgent.set(row.assigned_agent_id, row.count));

    const today = new Date().toISOString().slice(0, 10);

    const agentRows = (agentTotals.rows || []).map((row) => {
      const agent = agentById.get(row.assigned_agent_id) || {};
      const progress = typeof row.avg_progress === 'number' ? Math.round(row.avg_progress * 10) / 10 : '';
      return [
        today,
        agent.name || 'Unassigned',
        agent.role || '',
        row.count || 0,
        completedByAgent.get(row.assigned_agent_id) || 0,
        progress,
      ];
    });

    // --- Gather site SEO rankings ----------------------------------------------
    const seoRows = [];
    let cursor = null;
    for (let page = 0; page < 10; page += 1) {
      const res = await base44.asServiceRole.entities.SEOVariant.filter(
        {},
        {
          sort: '-google_score',
          limit: 200,
          cursor,
          fields: ['target_keyword', 'target_location', 'url', 'status', 'google_score'],
        }
      );
      seoRows.push(...(res.items || []));
      if (!res.has_more) break;
      cursor = res.next_cursor;
    }

    const seoValues = seoRows.map((v) => [
      today,
      v.target_keyword || '',
      v.target_location || 'National',
      v.url || '',
      v.status || '',
      typeof v.google_score === 'number' ? v.google_score : 0,
    ]);

    // --- Write both tabs --------------------------------------------------------
    const agentWritten = await appendRows(accessToken, spreadsheetId, AGENT_SHEET, 'A:F', agentRows, isNew ? AGENT_HEADERS : null);
    const seoWritten = await appendRows(accessToken, spreadsheetId, SEO_SHEET, 'A:F', seoValues, isNew ? SEO_HEADERS : null);

    await base44.asServiceRole.entities.SheetSync.update(config.id, {
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      last_sync_at: new Date().toISOString(),
      last_agent_rows: agentWritten,
      last_seo_rows: seoWritten,
    });

    return Response.json({
      success: true,
      spreadsheet_url: spreadsheetUrl,
      spreadsheet_created: isNew,
      agent_rows: agentWritten,
      seo_rows: seoWritten,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}