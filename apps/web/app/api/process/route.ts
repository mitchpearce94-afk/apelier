import { NextRequest, NextResponse } from 'next/server';

// AI Engine URL — Railway deployment or local dev
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gallery_id, style_profile_id, settings, included_images, job_id } = body;

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

    if (action === 'status') {
      // Check processing status
      if (!job_id) {
        return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
      }

      const response = await fetch(`${AI_ENGINE_URL}/api/process/status/${job_id}`);
      const result = await response.json();
      return NextResponse.json(result);
    }

    if (action === 'restyle_photo') {
      // Re-process a single photo with a different style profile
      const { photo_id, style_profile_id: restyle_id } = body;
      if (!photo_id || !restyle_id) {
        return NextResponse.json({ error: 'Missing photo_id or style_profile_id' }, { status: 400 });
      }

      try {
        const response = await fetch(`${AI_ENGINE_URL}/api/process/restyle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo_id,
            style_profile_id: restyle_id,
            gallery_id: gallery_id || null,
          }),
        });
        const result = await response.json();
        return NextResponse.json(result, { status: response.ok ? 200 : 500 });
      } catch (err) {
        console.error('Restyle API error:', err);
        return NextResponse.json(
          { error: 'AI Engine is not reachable for restyle.' },
          { status: 503 },
        );
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use "process", "status", or "restyle_photo".' }, { status: 400 });

  } catch (err) {
    console.error('Process API error:', err);
    return NextResponse.json(
      { error: 'AI Engine is not reachable. Make sure it is running.' },
      { status: 503 },
    );
  }
}
