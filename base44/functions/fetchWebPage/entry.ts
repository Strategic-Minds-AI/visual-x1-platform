import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchPage, extractSignature, visibleText } from '../../shared/webCapture.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const raw = String(body.url || '').trim();
    if (!raw) return Response.json({ error: 'url is required' }, { status: 400 });
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (!/^https?:\/\/[^\s]+$/i.test(url)) return Response.json({ error: 'That does not look like a URL.' }, { status: 400 });

    let page;
    try {
      page = await fetchPage(url);
    } catch (e) {
      return Response.json({ error: `Could not reach ${url}: ${e.message}` }, { status: 200 });
    }

    const signature = extractSignature(page.html, page.final_url);
    const text = visibleText(page.html).slice(0, 20000);

    return Response.json({
      ok: page.ok,
      status: page.status,
      final_url: page.final_url,
      title: signature.title,
      description: signature.description,
      lang: signature.lang,
      headings: [
        ...signature.headings.h1.map((t) => ({ tag: 'h1', text: t })),
        ...signature.headings.h2.map((t) => ({ tag: 'h2', text: t })),
        ...signature.headings.h3.map((t) => ({ tag: 'h3', text: t }))
      ],
      links: signature.links_sample,
      images: signature.images,
      forms: signature.forms,
      nav_links: signature.nav_links,
      colors: signature.colors,
      fonts: signature.fonts,
      sections_estimate: signature.sections_estimate,
      stylesheets: signature.stylesheets,
      scripts: signature.scripts,
      html_length: signature.html_length,
      text,
      note: page.status >= 400
        ? `The page answered HTTP ${page.status}; the content below may be an error page.`
        : signature.html_length < 400
        ? 'The page returned very little content, which usually means it refused the automated read.'
        : ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}