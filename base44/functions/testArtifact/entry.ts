import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchPage, extractSignature, visibleText } from '../../shared/webCapture.ts';

// The test agent. It measures the actual document — the artifact on the canvas, or
// any live page handed to it — probe by probe, then an agent reads that measured
// evidence and reports what passed, what failed, and what this runtime could not
// execute. Nothing is reported as tested because a button was pressed, and the
// probes that need a browser are recorded as NOT RUN rather than assumed.

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    summary: { type: 'string' },
    score: { type: 'number' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          probe: { type: 'string' },
          finding: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['finding']
      }
    },
    could_not_test: { type: 'array', items: { type: 'string' } }
  },
  required: ['verdict', 'summary', 'findings', 'could_not_test']
};

const probe = (id, label, pass, found) => ({
  id,
  label,
  result: pass === null ? 'NOT RUN' : pass ? 'PASS' : 'FAIL',
  found
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let html = String(body.html || '');
    const url = String(body.url || '').trim();
    const name = String(body.name || 'Visual X artifact').slice(0, 120);
    const projectRef = String(body.project_id || '').trim() || name;

    const limitations = [];
    let target = 'the document supplied by the editor';

    if (!html.trim() && url) {
      let page;
      try {
        page = await fetchPage(url);
      } catch (e) {
        return Response.json({ error: `Could not reach ${url}: ${e.message}` }, { status: 200 });
      }
      html = page.html;
      target = page.final_url || url;
      limitations.push(`The live page ${target} was read over the network (HTTP ${page.status}).`);
    }

    if (!html.trim()) {
      return Response.json({ error: 'There is nothing to test: render an artifact, or hand the agent a live URL.' }, { status: 200 });
    }
    if (html.trim().length < 100) {
      return Response.json({ error: 'The document is too small to test.' }, { status: 200 });
    }

    const sig = extractSignature(html, url);
    const text = visibleText(html);
    const lower = html.toLowerCase();

    const mediaQueries = (html.match(/@media/gi) || []).length;
    const clamps = (html.match(/clamp\(/gi) || []).length;
    const inlineHandlers = (html.match(/\son[a-z]+\s*=/gi) || []).length;
    const listeners = (html.match(/addEventListener\(/gi) || []).length;
    const externalScripts = (html.match(/<script[^>]+src=/gi) || []).length;
    const externalStyles = (html.match(/<link[^>]+href=["']https?:/gi) || []).length;
    const externalImages = (html.match(/<img[^>]+src=["']https?:/gi) || []).length;
    const ariaAttrs = (html.match(/\saria-[a-z]+=/gi) || []).length;
    const hasFocusRule = /:focus(-visible)?/.test(html);
    const labels = (html.match(/<label\b/gi) || []).length;
    const inputs = (html.match(/<(input|select|textarea)\b/gi) || []).length;
    const alts = (html.match(/<img[^>]+alt=/gi) || []).length;
    const images = sig.images?.count || 0;
    const filler = /lorem ipsum|consectetur adipiscing|\[placeholder|\[supply/i.test(text);
    const h1 = sig.headings?.h1 || [];
    const landmarks = ['header', 'nav', 'main', 'footer'].filter((tag) => lower.includes(`<${tag}`));

    const probes = [
      probe('doctype', 'A doctype is declared', /<!doctype/i.test(html), /<!doctype/i.test(html) ? 'declared' : 'missing'),
      probe('title', 'The document has a title', Boolean(sig.title), sig.title || 'none'),
      probe('description', 'A meta description is present', Boolean(sig.description), sig.description ? `${sig.description.length} characters` : 'missing'),
      probe('lang', 'The document language is declared', Boolean(sig.lang), sig.lang || 'missing'),
      probe('viewport', 'A responsive viewport is declared', Boolean(sig.viewport_meta), sig.viewport_meta ? 'present' : 'missing'),
      probe('h1', 'Exactly one primary heading', h1.length === 1, `${h1.length} h1 element(s)`),
      probe('landmarks', 'Header, nav, main and footer are present', landmarks.length === 4, landmarks.join(', ') || 'none'),
      probe('sections', 'The document has more than one section', (sig.sections_estimate || 0) >= 2, `${sig.sections_estimate || 0} section(s)`),
      probe('text', 'Visible text is substantial', text.length >= 1200, `${text.length.toLocaleString()} characters`),
      probe('filler', 'No placeholder or filler copy is left', !filler, filler ? 'filler text found' : 'clean'),
      probe('styles', 'Styling ships with the document', (sig.stylesheets || 0) + (sig.inline_style_tags || 0) > 0, `${sig.stylesheets || 0} stylesheet(s), ${sig.inline_style_tags || 0} style block(s)`),
      probe('responsive', 'The layout adapts to smaller widths', mediaQueries > 0 || clamps > 0, `${mediaQueries} media quer${mediaQueries === 1 ? 'y' : 'ies'}, ${clamps} clamp() use(s)`),
      probe('interactivity', 'Interaction is wired through listeners', listeners > 0, `${listeners} addEventListener call(s)`),
      probe('inline_handlers', 'No inline event handler attributes', inlineHandlers === 0, `${inlineHandlers} inline handler(s)`),
      probe('self_contained', 'No external scripts, styles or images', externalScripts + externalStyles + externalImages === 0, `${externalScripts} script(s), ${externalStyles} stylesheet(s), ${externalImages} image(s) fetched from outside`),
      probe('aria', 'ARIA attributes support the interactive parts', ariaAttrs >= 5, `${ariaAttrs} aria attribute(s)`),
      probe('focus', 'Focus states are styled', hasFocusRule, hasFocusRule ? 'a :focus rule is present' : 'no :focus rule found'),
      probe('labels', 'Form inputs are labelled', inputs === 0 ? null : labels > 0, `${inputs} input(s), ${labels} label(s)`),
      probe('images_alt', 'Every image carries an alt attribute', images === 0 ? null : alts >= images, `${images} image(s), ${alts} with alt`),
      probe('links', 'Links are present to carry the page', (sig.links_count || 0) > 0, `${sig.links_count || 0} link(s)`),
      probe('cta', 'Calls to action are present', (sig.cta_labels || []).length > 0, (sig.cta_labels || []).slice(0, 4).join(', ') || 'none found'),
      probe('js_runtime', 'Live interaction in a real browser', null, 'Not executed: this runtime has no browser, so clicks, focus order and script behaviour were not run.'),
      probe('console', 'Browser console errors', null, 'Not read: no browser session was opened.'),
      probe('viewports', 'Rendered at 390, 768 and 1440 widths', null, 'Not measured: no viewport rendering is available in this runtime.')
    ];

    const required = probes.filter((p) => p.result !== 'NOT RUN');
    const passed = required.filter((p) => p.result === 'PASS').length;
    const failed = required.filter((p) => p.result === 'FAIL');
    const notRun = probes.filter((p) => p.result === 'NOT RUN');
    const score = required.length ? Math.round((passed / required.length) * 100) : 0;

    const agent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Visual X test agent. You are given measured probes from an actual document and must report what they prove, what they break, and what they do not cover.

TARGET: ${name} (${target})

MEASURED PROBES (each one was run against the document itself):
${JSON.stringify(probes, null, 1).slice(0, 12000)}

MEASURED STRUCTURE:
${JSON.stringify({ title: sig.title, description: sig.description, lang: sig.lang, viewport: sig.viewport_meta, headings: sig.headings, sections: sig.sections_estimate, nav_links: sig.nav_links, forms: sig.forms, images: sig.images, colors: sig.colors, fonts: sig.fonts, html_length: sig.html_length, text_length: sig.text_length }).slice(0, 6000)}

OPENING OF THE VISIBLE TEXT:
${text.slice(0, 4000)}

Rules:
- Only report findings the probes above actually support, and quote the probe's own "found" value as the evidence.
- NEVER claim a runtime behaviour was tested. No browser was available, so click, focus, console and viewport behaviour are unverified and belong in could_not_test.
- A failing probe is a defect. Severity: blocker (the page cannot be trusted or used), major (a real quality or access failure), minor (polish).
- verdict is one line: TESTED PASS, DEFECTS FOUND, or PARTIALLY TESTED.
- score is 0-100 for how well the document holds up against the probes that could run.
- could_not_test lists each thing this run genuinely could not verify, and why.`,
      response_json_schema: REPORT_SCHEMA
    });

    const report = typeof agent === 'string' ? JSON.parse(agent) : agent;

    let recordId = '';
    try {
      const record = await base44.entities.TestResult.create({
        project_id: projectRef,
        test_type: 'e2e',
        results: JSON.stringify({ target, probes, passed, failed: failed.length, not_run: notRun.length, score, agent: report }),
        pass_count: passed,
        fail_count: failed.length,
        failures: JSON.stringify(failed.map((f) => `${f.label} — found ${f.found}`)),
        status: failed.length === 0 && passed > 0 ? 'passed' : 'failed'
      });
      recordId = record.id;
    } catch {
      recordId = '';
    }

    return Response.json({
      name,
      target,
      probes,
      passed,
      failed: failed.length,
      not_run: notRun.length,
      score,
      agent: report,
      limitations,
      record_id: recordId,
      method: 'Deterministic probes run against the document itself, then an agent pass over those measurements. Runtime behaviour in a browser was not executed.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}