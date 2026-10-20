import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ASSET_SCHEMA = {
  type: 'object',
  properties: {
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asset_type: { type: 'string' },
          variant_name: { type: 'string' },
          concept: { type: 'string' },
          layout_spec: { type: 'string' },
          image_prompt: { type: 'string' },
          colors: { type: 'array', items: { type: 'string' } },
          typography: { type: 'string' },
          print_notes: { type: 'string' }
        },
        required: ['asset_type', 'variant_name', 'image_prompt']
      }
    }
  },
  required: ['variants']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const clientId = String(body.client_id || '').trim();
    if (!clientId) return Response.json({ error: 'Pick the client profile this work is for.' }, { status: 400 });

    const client = await base44.entities.ClientIntake.get(clientId);
    if (!client) return Response.json({ error: 'Client profile not found.' }, { status: 404 });

    const requested = Array.isArray(body.asset_types) ? body.asset_types.filter((t) => ['business_card', 'apparel'].includes(t)) : [];
    const types = requested.length ? requested : ['business_card', 'apparel'];
    const perType = Math.min(Math.max(Number(body.per_type) || 2, 1), 3);

    const identity = {
      company_name: client.company_name || '',
      industry: client.industry || '',
      tagline: client.tagline || '',
      logo_url: /^https?:/i.test(client.logo_url || '') ? client.logo_url : '',
      brand_colors: client.brand_colors || '',
      brand_fonts: client.brand_fonts || '',
      brand_voice: client.brand_voice || '',
      brand_notes: client.brand_notes || '',
      primary_services: client.primary_services || '',
      service_area: client.service_area || '',
      phone: client.phone || '',
      email: client.email || '',
      website_url: client.website_url || '',
      city: client.city || '',
      state: client.state || ''
    };

    const missing = [];
    if (!identity.brand_colors) missing.push('brand colors');
    if (!identity.tagline) missing.push('a tagline');
    if (!identity.logo_url) missing.push('a logo URL');
    if (!identity.phone && !identity.email) missing.push('contact details');

    const prompt = `You are a brand identity designer producing production artwork for ${identity.company_name} (${identity.industry}).

THE BRAND AS RECORDED ON THE CLIENT PROFILE:
${JSON.stringify(identity, null, 2)}

Produce exactly ${perType} concepts for each of these asset types: ${types.join(', ')}.
- "business_card" concepts are print-ready card layouts, front and back. Standard credit-card proportion (85mm x 55mm). Name the exact placement of the logo, the name and title block, the contact block, and any graphic device. Give the bleed and the print finish in print_notes.
- "apparel" concepts are garment mockups: pick the garment that suits this brand (tee, hoodie, cap, polo, work shirt), state the placement, the print method and the colourway, and keep the artwork legible at arm's length.

Rules:
- Use the recorded brand colors and fonts when they exist. If a value is missing, choose one and say in the concept that it is proposed.
- Every image_prompt must be a complete, self-contained image-generation prompt: state the subject, the medium (photorealistic product mockup or clean flat vector layout), the exact composition, the background, the lighting, and give the palette as hex values.
- A business card image must show the card flat on a plain surface with the text readable. An apparel image must show the garment on a plain background, worn or flat laid, with the artwork visible.
- Never invent awards, certifications, guarantees, client names or address details that are not in the profile. Where contact copy is needed but missing, use exactly "{{phone}}" and "{{email}}" as placeholders.
- layout_spec is the text a printer could follow, so be specific: measurements in mm, alignment, hierarchy, spacing.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: ASSET_SCHEMA });
    const spec = typeof llm === 'string' ? JSON.parse(llm) : llm;
    const variants = (spec?.variants || [])
      .filter((v) => types.includes(v.asset_type) && v.image_prompt)
      .slice(0, types.length * perType);

    if (!variants.length) {
      return Response.json({ error: 'The designer returned no workable concepts. Add brand colors and a tagline to the client profile and try again.' }, { status: 200 });
    }

    const created = [];
    for (const variant of variants) {
      const image = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: variant.image_prompt,
        ...(identity.logo_url ? { existing_image_urls: [identity.logo_url] } : {})
      });
      const asset = await base44.entities.BrandAsset.create({
        client_id: client.id,
        company_name: client.company_name,
        asset_type: variant.asset_type,
        variant_name: variant.variant_name,
        image_url: image.url,
        spec_json: JSON.stringify({
          concept: variant.concept || '',
          layout_spec: variant.layout_spec || '',
          colors: variant.colors || [],
          typography: variant.typography || '',
          print_notes: variant.print_notes || ''
        }),
        prompt_used: variant.image_prompt,
        status: 'generated'
      });
      created.push(asset);
    }

    return Response.json({
      assets: created,
      identity_used: identity,
      missing,
      note: 'Generated artwork is a concept, not camera-ready print. Check the layout spec before sending anything to print, and replace the {{phone}} and {{email}} placeholders with real details.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}