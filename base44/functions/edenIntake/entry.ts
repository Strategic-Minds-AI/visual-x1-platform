import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Eden's discovery brief, from the public site.
//
// This endpoint is reached by visitors who are not signed in, so it is written the
// way a public endpoint has to be: every field is bounded and validated here, the
// answers are saved to the CRM record the operator console already reads, and the
// team is emailed. Nothing from the request is trusted as-is, and nothing is added
// to a record beyond the fields the form actually collects.

const OWNER = 'jeremy@strategicmindsai.com';

function clip(value, max) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // A hidden field no person fills in. Bots do, and those are dropped silently.
    if (clip(body.website_confirm, 40)) {
      return Response.json({ ok: true, note: 'Thank you.' });
    }

    const business = clip(body.business, 180);
    const goal = clip(body.goal, 180);
    const market = clip(body.market, 180);
    const notes = clip(body.notes, 2000);
    const name = clip(body.full_name, 120);
    const email = clip(body.email, 180).toLowerCase();
    const source = clip(body.source, 300);

    if (!business || !goal) {
      return Response.json(
        { ok: false, error: 'The business and priority answers are required.' },
        { status: 200 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      return Response.json(
        { ok: false, error: 'An email address is needed so the team can reply.' },
        { status: 200 }
      );
    }

    const submittedAt = new Date();
    const record = await base44.asServiceRole.entities.ClientIntake.create({
      full_name: name || business,
      email,
      company_name: business,
      industry: business,
      service_area: market,
      seed_sentence: notes || goal,
      desired_outcomes: goal,
      pain_points: notes,
      status: 'submitted',
      submitted_at: submittedAt.toISOString()
    });

    // The record is the durable copy: it exists whether or not the mail leaves. The
    // mail result is reported as it comes back, never assumed.
    let email_state = 'not_sent';
    let email_note = null;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER,
        from_name: 'Eden Skye · Strategic Minds AI',
        template_name: 'EdenDiscovery',
        variables: {
          business,
          goal,
          market: market || 'Not given',
          notes: notes || 'No additional notes',
          full_name: name || 'Not given',
          email,
          submitted_at: submittedAt.toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET'
        }
      });
      email_state = 'sent';
    } catch (error) {
      email_state = 'refused';
      email_note = error.message;
    }

    return Response.json({
      ok: true,
      record_id: record.id,
      email: email_state,
      email_note,
      source: source || null,
      method:
        'Saved to ClientIntake, which is what the operator console reads under Client Intake, and sent to ' +
        OWNER +
        ' through the app mail service.'
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
}