import { NextRequest, NextResponse } from 'next/server';

// AI Engine URL — Railway deployment or local dev
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gallery_id, style_profile_id, settings, included_images, job_id, photo_ids } = body;

    if (action === 'process') {
      // Trigger gallery processing
      if (!gallery_id) {
        return NextResponse.json({ error: 'Missing gallery_id' }, { status: 400 });
      }

      const response = await fetch(`${AI_ENGINE_URL}/api/process/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id,
          style_profile_id: style_profile_id || null,
          settings: settings || null,
          included_images: included_images || null,
        }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.ok ? 200 : 500 });
    }

    if (action === 'restyle') {
      // Re-process specific photos with a different style
      if (!gallery_id || !style_profile_id || !photo_ids?.length) {
        return NextResponse.json(
          { error: 'Missing gallery_id, style_profile_id, or photo_ids' },
          { status: 400 }
        );
      }

      const response = await fetch(`${AI_ENGINE_URL}/api/process/restyle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_ids,
          style_profile_id,
          gallery_id,
        }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.ok ? 200 : 500 });
    }

    if (action === 'status') {
      // Check processing status
      if (!job_id) {
        return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
      }

      const response = await fetch(`${AI_ENGINE_URL}/api/process/status/${job_id}`);
      const result = await response.json();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action. Use "process", "restyle", or "status".' }, { status: 400 });

  } catch (err) {
    console.error('Process API error:', err);
    return NextResponse.json(
      { error: 'AI Engine is not reachable. Make sure it is running.' },
      { status: 503 },
    );
  }
}
