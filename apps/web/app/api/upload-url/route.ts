import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Missing env vars: URL=${!!url}, SERVICE_KEY=${!!key}`);
  }
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storageKey, contentType } = body;

    if (!storageKey) {
      return NextResponse.json({ error: 'Missing storageKey' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Generate a signed upload URL (valid for 10 minutes)
    // This allows the browser to upload directly to Supabase Storage
    // bypassing the 4.5MB Vercel serverless function limit
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUploadUrl(storageKey);

    if (error) {
      console.error('[upload-url] Signed URL error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (err) {
    console.error('[upload-url] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate upload URL' },
      { status: 500 },
    );
  }
}
