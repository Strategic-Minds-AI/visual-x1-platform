import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  fetchPage,
  extractSignature,
  visibleText,
  hostFingerprint,
  configSignature,
  folderSignature,
  repoSignature,
  documentSignature,
  fetchRepo
} from '../../shared/webCapture.ts';

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

const SOURCE_TYPES = ['url', 'ip', 'markup', 'file', 'repo', 'config', 'folder', 'document', 'image'];
const BINARY_EXT = /\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|webp|gif|bmp|tiff?|heic)(\?|$)/i;

const SITE_PROMPT = `You are a senior front-end architect. You are given a captured website and must produce a specification that reproduces it faithfully, plus a build prompt that a page generator can follow.`;

const SYSTEM_PROMPT = `You are a senior systems architect. You are given a captured system — a repository, a configuration, or a folder inventory — and must produce a specification that lets the same system be rebuilt and integrated here. Treat regions as modules or files in dependency order, components as services and dependencies, tokens as runtimes and versions, content_slots as the configuration values and secrets that have to be supplied, and interactions as how the parts talk to each other.`;

const DOC_PROMPT = `You are a senior systems architect. You are given a document that describes a system or a process, and must produce a specification that reproduces what it describes: regions are its sections and steps in order, components are the parts it names, content_slots are the values a reproducer must supply that the document does not state.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || '').trim();
    const sourceType = SOURCE_TYPES.includes(body.source_type) ? body.source_type : 'url';
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    let html = '';
    let text = '';
    let sourceUrl = '';
    let httpStatus = null;
    let kind = 'site';
    let referenceImage = '';
    const limitations = [];
    const measured = {};

    if (sourceType === 'url' || sourceType === 'ip') {
      const raw = String(body.url || '').trim();
      if (!raw) return Response.json({ error: sourceType === 'ip' ? 'A host, IP address or URL is required.' : 'A URL is required for this source type.' }, { status: 400 });
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
      measured.host = hostFingerprint(page.headers);
      if (page.status >= 400) limitations.push(`The source answered HTTP ${page.status}; the capture may be an error page rather than the real site.`);
      if (html.length >= 600000) limitations.push('The source was larger than the capture limit and was truncated at 600 KB.');
    } else if (sourceType === 'markup') {
      html = String(body.content || '');
      if (!html.trim()) return Response.json({ error: 'Paste the markup or text to capture.' }, { status: 400 });
    } else if (sourceType === 'file') {
      const fileUrl = String(body.file_url || '').trim();
      if (!fileUrl) return Response.json({ error: 'A file is required for this source type.' }, { status: 400 });
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return Response.json({ error: `Could not read the uploaded file (HTTP ${res.status}).` }, { status: 200 });
      const contentType = res.headers.get('content-type') || '';
      const raw = (await res.text()).slice(0, 600000);
      if (/html/i.test(contentType) || /<(html|body|section|div|nav)\b/i.test(raw)) {
        html = raw;
        measured.host = hostFingerprint({ 'content-type': contentType });
      } else {
        text = raw;
        kind = 'system';
        measured.config = configSignature(raw);
      }
    } else if (sourceType === 'config' || sourceType === 'folder') {
      const raw = String(body.content || '');
      if (raw.trim().length < 10) return Response.json({ error: sourceType === 'config' ? 'Paste the configuration to capture.' : 'Paste the folder listing to capture.' }, { status: 400 });
      text = raw.slice(0, 200000);
      kind = 'system';
      if (sourceType === 'config') measured.config = configSignature(text);
      else measured.folder = folderSignature(text);
    } else if (sourceType === 'repo') {
      const repoUrl = String(body.url || '').trim();
      if (!repoUrl) return Response.json({ error: 'A repository URL (github.com/owner/repo) is required.' }, { status: 400 });
      let repo;
      try {
        repo = await fetchRepo(repoUrl);
      } catch (e) {
        return Response.json({ error: `Could not read the repository: ${e.message}` }, { status: 200 });
      }
      sourceUrl = `https://github.com/${repo.owner}/${repo.repo}`;
      kind = 'system';
      measured.repo = repoSignature(repo.meta, repo.entries, repo.files);
      text = [repo.files['README.md'] || '', repo.files['.env.example'] || '', repo.files['package.json'] || '', repo.files['requirements.txt'] || ''].join('\n\n').slice(0, 15000);
      limitations.push('This read uses the public GitHub API only, so a private repository is not readable here and its live deployment was not inspected.');
    } else if (sourceType === 'document') {
      const url = String(body.file_url || body.url || '').trim();
      if (!url) return Response.json({ error: 'A document is required for this source type.' }, { status: 400 });
      if (BINARY_EXT.test(url)) {
        const described = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: 'Describe this document as a build specification so that what it describes can be reproduced. Cover: its purpose, every section in order with its actual content, any tables or figures and their numbers, any process steps, and anything a reproducer would have to supply that the document does not state. Do not invent any value the document does not show.',
          file_urls: [url]
        });
        text = String(described || '').slice(0, 15000);
        kind = 'document';
        measured.document = { bytes: 0, line_count: 0, headings: [], numbered_steps: [], table_rows: 0, read_by: 'vision', text: text.slice(0, 8000) };
        limitations.push('The document was read by description rather than parsed, so exact wording and numbers come from that reading.');
      } else {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return Response.json({ error: `Could not read the document (HTTP ${res.status}).` }, { status: 200 });
        const raw = (await res.text()).slice(0, 600000);
        text = raw.slice(0, 15000);
        kind = 'document';
        measured.document = documentSignature(raw);
      }
    } else {
      const url = String(body.file_url || body.url || '').trim();
      if (!url) return Response.json({ error: 'An image is required for this source type.' }, { status: 400 });
      referenceImage = String(body.file_uri || '').trim() || (/^https?:/i.test(url) ? url : '');
      const described = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'Describe this design as a build specification so it can be rebuilt as an HTML page. Cover, in page order: every region and what it holds, the exact copy you can read, the layout and visual hierarchy, the colour palette as hex values, the typography, the imagery and its treatment, and what changes between mobile and desktop widths. Finish with what you cannot tell from the image alone.',
        file_urls: [url]
      });
      text = String(described || '').slice(0, 15000);
      kind = 'site';
      measured.read_by = 'vision';
      limitations.push('The source was an image, so its structure comes from a reading of that image rather than from markup.');
    }

    if (!text.trim() && !html.trim()) return Response.json({ error: 'The source contained no readable content.' }, { status: 200 });

    const signature = html
      ? { ...extractSignature(html, sourceUrl), status: httpStatus, source_kind: kind, ...measured }
      : {
          url: sourceUrl,
          status: httpStatus,
          source_kind: kind,
          title: name,
          description: '',
          canonical: '',
          lang: '',
          viewport_meta: false,
          headings: { h1: [], h2: [], h3: [] },
          heading_count: 0,
          nav_links: [],
          links_count: 0,
          links_sample: [],
          forms: { count: 0, fields: [] },
          images: { count: 0, alts: [] },
          sections_estimate: 0,
          stylesheets: 0,
          scripts: 0,
          inline_style_tags: 0,
          cta_labels: [],
          colors: [],
          fonts: [],
          html_length: text.length,
          text_length: text.length,
          ...measured
        };

    // A refusal page is not a source. Capturing one would produce a confident spec for nothing.
    if ((sourceType === 'url' || sourceType === 'ip') && ((httpStatus && httpStatus >= 400) || signature.html_length < 400)) {
      return Response.json({
        error: `The source could not be captured: ${sourceUrl || 'the source'} answered HTTP ${httpStatus || 'unknown'} with only ${signature.html_length} characters of content. The site is refusing automated reads. Save the page yourself and use Paste markup, or upload the HTML file.`
      }, { status: 200 });
    }
    if ((sourceType !== 'url' && sourceType !== 'ip') && (html || text).trim().length < 40) {
      return Response.json({ error: 'The source contained too little content to specify. Check that the file, listing or configuration is the one you meant.' }, { status: 200 });
    }
    if (kind === 'site' && !signature.headings.h1.length && !signature.headings.h2.length) {
      limitations.push('No h1/h2 headings were found in the source, so structural parity will be judged on other signals.');
    }

    const rules = kind === 'site'
      ? `Rules:
- Regions must be listed in the order they appear on the page. Do not invent regions the source does not have.
- Reproduce the source's own copy. Where the capture genuinely lacks content for a slot, write "[PLACEHOLDER: what belongs here]" instead of inventing testimonials, prices, statistics, names or guarantees. Never fabricate proof.
- Keep measured tokens: use the captured colors and fonts when they exist. If none were captured, propose tokens and say they are proposed.
- content_slots lists the pieces of text the rebuild must fill.`
      : kind === 'document'
      ? `Rules:
- Regions are the document's own sections and steps, in its order. Do not add sections it does not describe.
- Use only what the document states. Where it is silent on something a reproducer needs, write "[SUPPLY: what is missing]" rather than inventing a value, credential or number.
- content_slots lists every value that has to be supplied from outside the document.`
      : `Rules:
- Regions are the modules, files and configuration areas of this system, in dependency order. Do not invent parts the capture does not show.
- Use only what the capture shows. Where something a rebuilder needs is not visible, write "[SUPPLY: what is missing]" rather than inventing a value, credential, endpoint or version.
- tokens holds languages, runtimes and versions that were actually observed. content_slots lists the configuration values and secrets that have to be supplied, by name.
- interactions describes how the captured parts talk to each other.`;

    const prompt = `${kind === 'site' ? SITE_PROMPT : kind === 'document' ? DOC_PROMPT : SYSTEM_PROMPT}

CAPTURED SIGNATURE (measured, not inferred):
${JSON.stringify(signature).slice(0, 12000)}

CAPTURED CONTENT:
${(text || visibleText(html)).slice(0, 15000)}

${rules}
- build_prompt must be thorough enough to work from. For a page: region by region, including the copy angle, layout and hierarchy, the interaction it supports, the states it shows, the token values it uses, and its behaviour at mobile, tablet and desktop widths. For a system: module by module, including its responsibility, its interface, what depends on what, the configuration it needs, and the order to bring it up.
- Be truthful about what the capture does not show: note any limitation inside the region or module it affects.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: SPEC_SCHEMA });
    const spec = typeof llm === 'string' ? JSON.parse(llm) : llm;

    // The build prompt is assembled from the extracted regions in order, so depth and
    // section order never depend on how verbose the model happened to be.
    const regionBrief = (spec.regions || [])
      .map((r, i) => `${i + 1}. ${r.name}${r.purpose ? ` — ${r.purpose}` : ''}${r.content ? `\n   Content: ${r.content}` : ''}`)
      .join('\n');
    const intro = kind === 'site'
      ? 'Build this as one self-contained HTML document. Reproduce the source structure, copy and order faithfully.'
      : kind === 'document'
      ? 'Reproduce the system this document specifies, in the order it sets out.'
      : 'Reproduce this system so it can be integrated here: every module, its interface, and what has to be supplied.';
    const buildPrompt = [
      intro,
      regionBrief ? `${kind === 'site' ? 'Regions' : 'Modules and files'}, in this exact order:\n${regionBrief}` : '',
      spec.components?.length ? `Components to build: ${spec.components.join(', ')}` : '',
      spec.tokens
        ? kind === 'site'
          ? `Design tokens — colors: ${(spec.tokens.colors || []).join(', ') || 'proposed'}; fonts: ${(spec.tokens.fonts || []).join(', ') || 'proposed'}; spacing: ${spec.tokens.spacing || 'consistent scale'}; radius: ${spec.tokens.radius || '6px'}.`
          : `Observed runtimes and versions: ${(spec.tokens.colors || []).join(', ') || 'not observed'}; ${(spec.tokens.fonts || []).join(', ') || ''}.`
        : '',
      spec.content_slots?.length ? `Values that must be supplied: ${spec.content_slots.join(' | ')}` : '',
      spec.interactions?.length ? `Interactions to support: ${spec.interactions.join(' | ')}` : '',
      spec.build_prompt || '',
      kind === 'site'
        ? 'Technical constraints: semantic sections, responsive at mobile/tablet/desktop, accessible contrast, a viewport meta tag, a lang attribute, and a meta description matching the source. Any [PLACEHOLDER: …] stays a visible placeholder unless the operator supplies real content — never invent proof, testimonials, prices or claims.'
        : 'Technical constraints: state the runtime, the dependencies with versions, every configuration value and secret by name, the data stores, the external services, and the order to bring the parts up. Never invent credentials or endpoints.'
    ].filter(Boolean).join('\n\n');

    const project = await base44.entities.CloneProject.create({
      name,
      source_type: sourceType,
      source_kind: kind,
      source_url: sourceUrl,
      source_label: signature.title || name,
      industry: String(body.industry || ''),
      capture_json: JSON.stringify(signature),
      capture_text: (text || visibleText(html)).slice(0, 15000),
      spec_json: JSON.stringify(spec),
      build_prompt: buildPrompt,
      reference_image_uri: referenceImage,
      status: 'spec_ready',
      operational_gate: 'pending',
      visual_gate: 'not_run',
      evidence_notes: JSON.stringify([
        sourceType === 'url' || sourceType === 'ip'
          ? `Captured ${signature.html_length.toLocaleString()} characters over ${sourceUrl}.`
          : `Captured a ${sourceType} source: ${(text || html).length.toLocaleString()} characters read.`,
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