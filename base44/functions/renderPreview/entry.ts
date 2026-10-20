import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { prompt, context, blueprint } = body;
    if (!prompt || prompt.trim().length < 3) {
      return Response.json({ error: 'A prompt is required' }, { status: 400 });
    }

    const contextBlock = context ? `\n\nPrevious chain output to build upon:\n"""\n${context.slice(0, 4000)}\n"""` : '';

    // Blueprint mode: build the artifact the brief actually asked for, with no imposed
    // landing-page sections and no fabricated social proof. Omitting it keeps the
    // original landing-page behaviour intact for the factory and backlink pipelines.
    const blueprintPrompt = blueprint ? `You are a senior frontend engineer and design director. Produce a COMPLETE, self-contained, production-quality implementation of this artifact: ${blueprint.artifact_label || blueprint.artifact_type}.

BUILD PROMPT:
"""
${prompt}
"""
${contextBlock}

STRUCTURE RULES:
   - Build only these regions, in this order: ${(blueprint.required_sections || []).join(' | ')}
   - Do NOT add: ${(blueprint.avoid_sections || ['sections the artifact does not call for']).join(' | ')}
   - Never force testimonials, pricing tables, FAQ accordions or logo walls onto an artifact type that does not call for them.

HONEST CONTENT RULES:
   - Use realistic but clearly illustrative copy. Never fabricate testimonials, customer names, logos, certifications, awards, usage numbers or performance claims.
   - Where social proof is required and none was supplied, render a labelled placeholder ("Placeholder — replace with a verified quote") or an honest process/feature explanation.
   - Every claim must trace to the request above. No invented statistics.

DESIGN TOKENS (authoritative — use exactly these): ${JSON.stringify(blueprint.tokens || {})}

ACCESSIBILITY: semantic landmarks, visible focus states, 4.5:1 body-text contrast, ARIA on interactive components, keyboard-operable nav/menus/dialogs/tabs.

RESPONSIVE: mobile-first, must hold at 390 / 768 / 1024 / 1440 widths with no horizontal overflow.

STATES: include loading, empty and error states wherever data or a form appears.

TECHNICAL: single HTML file, ALL CSS in <style>, ALL JS in <script>, no CDN, no external fonts or images (CSS gradients, SVG and emoji only). Working interactions.

Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown fences, no explanation.` : null;

    const metaPrompt = blueprintPrompt || `You are a world-class senior frontend engineer and award-winning UI/UX designer. Generate a COMPLETE, PRODUCTION-QUALITY website as a single self-contained HTML file. This must look like a real launched product — NOT a minimal stub.

PROMPT TO IMPLEMENT:
"""
${prompt}
"""
${contextBlock}

MANDATORY REQUIREMENTS:

1. SECTIONS — include ALL of these (do not skip any):
   - Sticky nav bar: logo, 4-5 nav links, primary CTA button, hamburger on mobile
   - Hero: bold headline, subheadline, two CTAs, visual element (gradient/SVG)
   - Features grid: 3-6 cards with icon (emoji or SVG), title, description
   - How it works: 3-step process with numbered steps
   - Testimonials: 3 cards with quote, name, title, avatar (CSS circle)
   - FAQ: 5 items as an accordion (clickable expand/collapse)
   - Final CTA: full-width gradient section with button
   - Footer: 3-4 link columns, newsletter input, social icons, copyright

2. DESIGN — modern and polished:
   - CSS custom properties for colors (accent + neutrals)
   - Gradients on hero and CTA sections
   - Box shadows, rounded corners (8-16px), hover lift effects
   - Smooth transitions (0.3s) on all interactive elements
   - Scroll-triggered fade-in animations via IntersectionObserver
   - Strong typography hierarchy (clamp-based font sizes)

3. CONTENT — realistic and specific. Real product names, real-sounding testimonials with full names and job titles, specific feature descriptions. No "lorem ipsum".

4. JAVASCRIPT — working interactivity:
   - Mobile hamburger menu toggle
   - Smooth scroll for nav links
   - FAQ accordion click handlers
   - IntersectionObserver fade-in animations

5. RESPONSIVE — mobile-first. Nav collapses to hamburger below 768px. Grids stack to single column. Font sizes scale with clamp().

6. TECHNICAL — single HTML file. ALL CSS in <style>. ALL JS in <script>. No external dependencies, no CDN, no external fonts (system font stack). No external images — use CSS gradients, SVG, and emoji for visuals.

Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown fences, no explanation.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: metaPrompt, model: "gemini_3_flash" });
    let html = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || String(llmRes || '');

    // Strip markdown code fences if present
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // Ensure it starts with <!DOCTYPE or <html
    if (!html.toLowerCase().startsWith('<!doctype') && !html.toLowerCase().startsWith('<html')) {
      html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`;
    }

    return Response.json({ html, prompt, mode: blueprint ? 'blueprint' : 'landing_page' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}