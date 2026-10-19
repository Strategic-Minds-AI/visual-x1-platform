import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { prompt, context } = body;
    if (!prompt || prompt.trim().length < 3) {
      return Response.json({ error: 'A prompt is required' }, { status: 400 });
    }

    const contextBlock = context ? `\n\nPrevious chain output to build upon:\n"""\n${context.slice(0, 4000)}\n"""` : '';

    const metaPrompt = `You are a senior web developer and designer. Generate a complete, self-contained HTML page that visually renders the result of this prompt.

PROMPT:
"""
${prompt}
"""
${contextBlock}

REQUIREMENTS:
- Return a SINGLE complete HTML document (<!DOCTYPE html>...</html>).
- ALL CSS must be inline in a <style> tag — no external stylesheets, no CDN links.
- ALL JavaScript must be inline in <script> tags — no external scripts.
- Use modern, clean, professional design with excellent typography and spacing.
- Use a cohesive color palette (grays + one accent color).
- Responsive layout that works on mobile and desktop.
- Use realistic placeholder content — no "lorem ipsum".
- Include visual elements: buttons, cards, sections, navigation, hero, etc.
- Add subtle hover states and transitions.
- If the prompt asks for a specific type of page (landing, dashboard, form, etc.), build that.
- If the prompt is abstract, build a polished landing page that represents the concept.

Return ONLY the raw HTML code. No markdown fences, no explanation, no commentary.`;

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: metaPrompt });
    let html = typeof llmRes === 'string' ? llmRes : (llmRes && llmRes.response) || String(llmRes || '');

    // Strip markdown code fences if present
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // Ensure it starts with <!DOCTYPE or <html
    if (!html.toLowerCase().startsWith('<!doctype') && !html.toLowerCase().startsWith('<html')) {
      html = `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`;
    }

    return Response.json({ html, prompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}