import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchPage, extractSignature, visibleText } from '../../shared/webCapture.ts';

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    regions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          purpose: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['name']
      }
    },
    components: { type: 'array', items: { type: 'string' } },
    tokens: {
      type: 'object',
      properties: {
        colors: { type: 'array', items: { type: 'string' } },
        fonts: { type: 'array', items: { type: 'string' } },
        spacing: { type: 'string' },
        radius: { type: 'string' }
      }
    },
    content_slots: { type: 'array', items: { type: 'string' } },
    interactions: { type: 'array', items: { type: 'string' } },
    build_prompt: { type: 'string' }
  },
  required: ['regions', 'build_prompt']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || '').trim();
    const sourceType = ['url', 'markup', 'file'].includes(body.source_type) ? body.source_type : 'url';
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    let html = '';
    let sourceUrl = '';
    let httpStatus = null;
    const limitations = [];

    if (sourceType === 'url') {
      const raw = String(body.url || '').trim();
      if (!raw) return Response.json({ error: 'A URL is required for this source type.' }, { status: 400 });
      sourceUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      let page;
      try {
        page = await fetchPage(sourceUrl);
      } catch (e) {
        return Response.json({ error: `Could not reach ${sourceUrl}: ${e.message}` }, { status: 200 });
      }
      html = page.html;
      httpStatus = page.status;
      sourceUrl = page.final_url || sourceUrl;
      if (page.status >= 400) limitations.push(`The source answered HTTP ${page.status}; the capture may be an error page rather than the real site.`);
      if (html.length >= 600000) limitations.push('The source was larger than the capture limit and was truncated at 600 KB.');
    } else if (sourceType === 'markup') {
      html = String(body.content || '');
      if (!html.trim()) return Response.json({ error: 'Paste the markup or text to capture.' }, { status: 400 });
    } else {
      const fileUrl = String(body.file_url || '').trim();
      if (!fileUrl) return Response.json({ error: 'A file is required for this source type.' }, { status: 400 });
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return Response.json({ error: `Could not read the uploaded file (HTTP ${res.status}).` }, { status: 200 });
      html = (await res.text()).slice(0, 600000);
    }

    const signature = { ...extractSignature(html, sourceUrl), status: httpStatus };
    const text = visibleText(html).slice(0, 15000);
    // A refusal page is not a source. Capturing one would produce a confident spec for nothing.
    if (!signature.html_length) return Response.json({ error: 'The source contained no readable content.' }, { status: 200 });
    if ((httpStatus && httpStatus >= 400) || signature.html_length < 400) {
      return Response.json({
        error: `The source could not be captured: ${sourceUrl || 'the source'} answered HTTP ${httpStatus || 'unknown'} with only ${signature.html_length} characters of content. The site is refusing automated reads. Save the page yourself and use Paste markup, or upload the HTML file.`
      }, { status: 200 });
    }
    if (!signature.headings.h1.length && !signature.headings.h2.length) {
      limitations.push('No h1/h2 headings were found in the source, so structural parity will be judged on other signals.');
    }

    const prompt = `You are a senior front-end architect. You are given a captured website and must produce a specification that reproduces it faithfully, plus a build prompt that a page generator can follow.

CAPTURED SIGNATURE (measured, not inferred):
${JSON.stringify(signature).slice(0, 12000)}

VISIBLE TEXT OF THE SOURCE:
${text}

Rules:
- Regions must be listed in the order they appear on the page. Do not invent regions the source does not have.
- Reproduce the source's own copy. Where the capture genuinely lacks content for a slot, write "[PLACEHOLDER: what belongs here]" instead of inventing testimonials, prices, statistics, names or guarantees. Never fabricate proof.
- Keep measured tokens: use the captured colors and fonts when they exist. If none were captured, propose tokens and say they are proposed.
- content_slots lists the pieces of text the rebuild must fill.
- build_prompt must be region by region and long enough to build from: for every region give the copy angle (headline intent, supporting line, action label), the layout and hierarchy, the interaction it supports, the states it shows, the token values it uses, and how it behaves at mobile, tablet and desktop widths. Then state the technical constraints: one self-contained HTML document, semantic sections, accessible contrast, no external frameworks.
- Be truthful about what the capture does not show: note any limitation inside the region it affects.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: SPEC_SCHEMA });
    const spec = typeof llm === 'string' ? JSON.parse(llm) : llm;

    // The build prompt is assembled from the extracted regions in order, so depth and
    // section order never depend on how verbose the model happened to be.
    const regionBrief = (spec.regions || [])
      .map((r, i) => `${i + 1}. ${r.name}${r.purpose ? ` — ${r.purpose}` : ''}${r.content ? `\n   Copy and content: ${r.content}` : ''}`)
      .join('\n');
    const buildPrompt = [
      'Build this page as one self-contained HTML document. Reproduce the source structure, copy and order faithfully.',
      regionBrief ? `Regions, in this exact order:\n${regionBrief}` : '',
      spec.components?.length ? `Components to build: ${spec.components.join(', ')}` : '',
      spec.tokens
        ? `Design tokens — colors: ${(spec.tokens.colors || []).join(', ') || 'proposed'}; fonts: ${(spec.tokens.fonts || []).join(', ') || 'proposed'}; spacing: ${spec.tokens.spacing || 'consistent scale'}; radius: ${spec.tokens.radius || '6px'}.`
        : '',
      spec.content_slots?.length ? `Content slots to fill: ${spec.content_slots.join(' | ')}` : '',
      spec.interactions?.length ? `Interactions to support: ${spec.interactions.join(' | ')}` : '',
      spec.build_prompt || '',
      'For every region above, state and implement the copy angle (headline intent, supporting line, action label), the layout and hierarchy, the interaction it supports, the states it shows, and how it behaves at mobile, tablet and desktop widths.',
      'Technical constraints: semantic sections, responsive at mobile/tablet/desktop, accessible contrast, a viewport meta tag, a lang attribute, and a meta description matching the source. Any [PLACEHOLDER: …] stays a visible placeholder unless the operator supplies real content — never invent proof, testimonials, prices or claims.'
    ].filter(Boolean).join('\n\n');

    const captureJson = JSON.stringify(signature);
    const project = await base44.entities.CloneProject.create({
      name,
      source_type: sourceType,
      source_url: sourceUrl,
      source_label: signature.title || name,
      industry: String(body.industry || ''),
      capture_json: captureJson,
      capture_text: text,
      spec_json: JSON.stringify(spec),
      build_prompt: spec.build_prompt || '',
      status: 'spec_ready',
      operational_gate: 'pending',
      visual_gate: 'not_run',
      evidence_notes: JSON.stringify([
        `Captured ${signature.html_length.toLocaleString()} characters over ${sourceType === 'url' ? sourceUrl : sourceType}.`,
        ...limitations,
        'This environment cannot render a page in a browser or take screenshots, so visual parity must be evidenced by images the operator supplies.'
      ]),
      generated_at: new Date().toISOString()
    });

    return Response.json({ project, signature });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}