import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildStructures } from '../../shared/programmatic.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    let template = null;
    if (body.template_id) {
      template = await base44.entities.SEOTemplate.get(body.template_id).catch(() => null);
    }

    const { structures } = await buildStructures(base44, {
      template,
      keywords: body.keywords,
      locations: body.locations,
      pattern: (template && template.url_pattern) || body.url_pattern,
      strategy: body.domain_strategy || (template && template.domain_strategy),
      scoped: true,
    });

    if (!structures.length) {
      return Response.json({ error: 'At least one keyword is required' }, { status: 400 });
    }

    return Response.json({ structures, count: structures.length });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}