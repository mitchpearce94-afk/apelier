import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, job_id } = body;

    console.log('[processing-jobs API]', action, job_id || '');

    if (action === 'mark_delivered') {
      if (!job_id) {
        return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from('processing_jobs')
        .update({ status: 'delivered', completed_at: new Date().toISOString() })
        .eq('id', job_id)
        .select('id, status');

      console.log('[mark_delivered] result:', data, 'error:', error);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, updated: data });
    }

    if (action === 'delete') {
      if (!job_id) {
        return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from('processing_jobs')
        .delete()
        .eq('id', job_id)
        .select('id');

      console.log('[delete] result:', data, 'error:', error);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: data?.length || 0 });
    }

    if (action === 'clear_all') {
      // Delete all non-active processing jobs
      const { data, error } = await supabaseAdmin
        .from('processing_jobs')
        .delete()
        .in('status', ['completed', 'delivered', 'failed', 'error'])
        .select('id');

      console.log('[clear_all] deleted:', data?.length, 'error:', error);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: data?.length || 0 });
    }

    if (action === 'clear_force') {
      // Delete ALL processing jobs regardless of status
      const { data, error } = await supabaseAdmin
        .from('processing_jobs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id');

      console.log('[clear_force] deleted:', data?.length, 'error:', error);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, deleted: data?.length || 0 });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[processing-jobs API] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
