import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import OpenAI from 'npm:openai@6.45.0';

// Video generation is a long-running job: create returns an id without waiting, the
// browser retrieves the same job on later calls.
const MODELS = [
  'seedance_2_fast',
  'seedance_2_mini',
  'seedance_2',
  'seedance_2_5',
  'kling_3',
  'veo_3_1_fast',
  'veo_3_1_lite',
  'grok_imagine_video',
  'grok_imagine_video_1_5',
  'minimax_h3',
  'minimax_h3_max',
  'flux_3_video'
];

const VEO = new Set(['veo_3_1_lite', 'veo_3_1_fast']);

function clampSeconds(model, value) {
  if (VEO.has(model)) return [4, 6, 8].includes(Number(value)) ? Number(value) : 6;
  const n = Number(value);
  if (!n) return 4;
  return Math.min(Math.max(Math.round(n), 4), 15);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    const videos = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers }).videos;

    if (body.action === 'retrieve') {
      const videoId = String(body.videoId || '').trim();
      if (!videoId) return Response.json({ error: 'videoId is required to retrieve a job.' }, { status: 400 });
      return Response.json(await videos.retrieve(videoId, { maxRetries: 0 }));
    }

    const requested = body.request && typeof body.request === 'object' ? body.request : {};
    const model = MODELS.includes(requested.model) ? requested.model : 'seedance_2_fast';
    const prompt = String(requested.prompt || '').trim();
    if (!prompt) return Response.json({ error: 'A prompt is required.' }, { status: 400 });

    const imageUrl = String(requested.image_url || '').trim();
    if (imageUrl && !/^https:\/\//i.test(imageUrl) && !imageUrl.startsWith('mp/')) {
      return Response.json({ error: 'The image must be a public HTTPS URL or a private file uploaded from this app.' }, { status: 400 });
    }

    const payload = {
      model,
      prompt: prompt.slice(0, 4000),
      seconds: clampSeconds(model, requested.seconds),
      aspect_ratio: /^(16:9|9:16|1:1|21:9|3:4|4:3)$/.test(String(requested.aspect_ratio)) ? requested.aspect_ratio : '16:9',
      generate_audio: requested.generate_audio !== false
    };
    if (imageUrl) {
      payload.frame_images = [{ type: 'image_url', image_url: { url: imageUrl }, frame_type: 'first_frame' }];
    }

    return Response.json(await videos.create(payload, { maxRetries: 0 }), { status: 202 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}