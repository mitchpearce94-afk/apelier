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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_id, storage_keys } = body;

    if (!photo_id) {
      return NextResponse.json({ error: 'Missing photo_id' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Delete storage files
    if (storage_keys && Array.isArray(storage_keys) && storage_keys.length > 0) {
      const { error: storageErr } = await supabaseAdmin.storage
        .from('photos')
        .remove(storage_keys);

      if (storageErr) {
        console.warn('[photos DELETE] Storage cleanup error:', storageErr.message);
        // Don't fail — still delete the DB record
      }
    }

    // 2. Delete photo record from DB
    const { error: dbErr } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('id', photo_id);

    if (dbErr) {
      console.error('[photos DELETE] DB error:', dbErr.message);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: photo_id });
  } catch (err) {
    console.error('[photos DELETE] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
