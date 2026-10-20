import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { benchmark_ids, industry, limit } = body;
    const maxPerCall = limit || 5;

    // Build query for benchmarks needing images
    let query = { is_active: true };
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }

    let benchmarks = [];
    if (benchmark_ids && Array.isArray(benchmark_ids) && benchmark_ids.length > 0) {
      for (const id of benchmark_ids.slice(0, maxPerCall)) {
        try {
          const b = await base44.entities.BenchmarkReference.get(id);
          benchmarks.push(b);
        } catch (e) { /* skip */ }
      }
    } else {
      const page = await base44.entities.BenchmarkReference.filter(
        query,
        { sort: '-ux_score', limit: maxPerCall, fields: ['name', 'url', 'industry', 'sub_industry', 'site_type', 'ux_score', 'description', 'key_patterns', 'desktop_screenshot_url'] }
      );
      benchmarks = page.items || page;
    }

    const results = [];
    for (const benchmark of benchmarks) {
      // Skip if already has a desktop screenshot
      if (benchmark.desktop_screenshot_url) {
        results.push({ benchmark: benchmark.name, status: 'exists', image_url: benchmark.desktop_screenshot_url });
        continue;
      }

      // Check if a BenchmarkImage record already exists
      const existing = await base44.entities.BenchmarkImage.filter(
        { site_name: benchmark.name },
        { limit: 1, fields: ['image_url'] }
      );
      const existingItems = existing.items || existing;
      if (existingItems.length > 0 && existingItems[0].image_url) {
        await base44.entities.BenchmarkReference.update(benchmark.id, {
          desktop_screenshot_url: existingItems[0].image_url
        });
        results.push({ benchmark: benchmark.name, status: 'linked', image_url: existingItems[0].image_url });
        continue;
      }

      // Generate image
      const patterns = benchmark.key_patterns || 'modern clean design';
      const prompt = `Professional website screenshot of ${benchmark.name}, a ${benchmark.industry} company${benchmark.sub_industry ? ' in ' + benchmark.sub_industry : ''}. ${benchmark.description || ''} Design patterns to showcase: ${patterns}. Modern, clean, high-quality web design with excellent typography and layout. Desktop view, 16:9 aspect ratio, photorealistic.`;

      const imageRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
      const image_url = imageRes.url || imageRes;

      // Create BenchmarkImage record
      await base44.entities.BenchmarkImage.create({
        industry: benchmark.industry,
        site_name: benchmark.name,
        image_url,
        image_type: 'desktop',
        quality_score: benchmark.ux_score || 0,
        description: benchmark.description || `Benchmark image for ${benchmark.name}`,
        tags: benchmark.key_patterns
      });

      // Update BenchmarkReference with image URL
      await base44.entities.BenchmarkReference.update(benchmark.id, {
        desktop_screenshot_url: image_url
      });

      results.push({ benchmark: benchmark.name, status: 'generated', image_url });
    }

    return Response.json({
      results,
      processed: results.length,
      generated: results.filter(r => r.status === 'generated').length,
      skipped: results.filter(r => r.status !== 'generated').length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}