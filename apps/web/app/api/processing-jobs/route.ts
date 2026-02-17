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
    const supabaseAdmin = getAdminClient();
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

    if (action === 'send_to_gallery') {
      const { processing_job_id, gallery_id, job_id, auto_deliver } = body;
      
      if (!processing_job_id || !gallery_id) {
        return NextResponse.json({ error: 'Missing processing_job_id or gallery_id' }, { status: 400 });
      }

      const results: Record<string, any> = {};

      // 1. Update all photos in this gallery to 'delivered'
      const { data: updatedPhotos, error: photoErr } = await supabaseAdmin
        .from('photos')
        .update({ status: 'delivered' })
        .eq('gallery_id', gallery_id)
        .in('status', ['approved', 'edited', 'uploaded', 'processing'])
        .select('id');
      results.photos = { updated: updatedPhotos?.length || 0, error: photoErr?.message };

      // 2. Update gallery status
      const newGalleryStatus = auto_deliver ? 'delivered' : 'ready';
      const { error: galErr } = await supabaseAdmin
        .from('galleries')
        .update({ status: newGalleryStatus })
        .eq('id', gallery_id);
      results.gallery = { status: newGalleryStatus, error: galErr?.message };

      // 3. Update job status - use job_id passed from frontend, or look it up
      let resolvedJobId = job_id;
      
      if (!resolvedJobId) {
        // Fallback: look up from gallery
        const { data: galData } = await supabaseAdmin
          .from('galleries')
          .select('job_id')
          .eq('id', gallery_id)
          .single();
        resolvedJobId = galData?.job_id;
      }

      console.log('[send_to_gallery] resolvedJobId:', resolvedJobId, 'passed job_id:', job_id);

      if (resolvedJobId) {
        const newJobStatus = auto_deliver ? 'delivered' : 'edited';
        const { data: jobResult, error: jobErr } = await supabaseAdmin
          .from('jobs')
          .update({ status: newJobStatus })
          .eq('id', resolvedJobId)
          .select('id, status');
        results.job = { id: resolvedJobId, newStatus: newJobStatus, result: jobResult, error: jobErr?.message };
      } else {
        results.job = { error: 'No job_id found — not passed and not on gallery' };
      }

      // 4. Delete the processing job
      const { error: pjErr } = await supabaseAdmin
        .from('processing_jobs')
        .delete()
        .eq('id', processing_job_id);
      results.processing_job = { deleted: !pjErr, error: pjErr?.message };

      console.log('[send_to_gallery] RESULTS:', JSON.stringify(results));

      return NextResponse.json({ success: true, results });
    }

    if (action === 'update_job_status') {
      // Update a job's status using service role (bypasses RLS)
      const { target_job_id, status } = body;
      if (!target_job_id || !status) {
        return NextResponse.json({ error: 'Missing target_job_id or status' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('jobs')
        .update({ status })
        .eq('id', target_job_id)
        .select('id, status');

      console.log('[update_job_status]', target_job_id, status, 'result:', data, 'error:', error);

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

    if (action === 'send_back_to_review') {
      const { gallery_id, job_id: targetJobId } = body;
      if (!gallery_id) {
        return NextResponse.json({ error: 'Missing gallery_id' }, { status: 400 });
      }

      // 1. Set gallery status back to 'ready' (so it appears in review)
      await supabaseAdmin
        .from('galleries')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', gallery_id);

      // 2. Set job status back to 'ready_for_review'
      if (targetJobId) {
        await supabaseAdmin
          .from('jobs')
          .update({ status: 'ready_for_review' })
          .eq('id', targetJobId);
      }

      // 3. Re-create a completed processing job so it shows up in the Review tab
      const { data: gallery } = await supabaseAdmin
        .from('galleries')
        .select('photographer_id')
        .eq('id', gallery_id)
        .single();

      const { count: photoCount } = await supabaseAdmin
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('gallery_id', gallery_id)
        .eq('is_culled', false);

      if (gallery) {
        await supabaseAdmin
          .from('processing_jobs')
          .insert({
            photographer_id: gallery.photographer_id,
            gallery_id,
            total_images: photoCount || 0,
            processed_images: photoCount || 0,
            current_phase: 'output',
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
      }

      console.log('[send_back_to_review] gallery:', gallery_id, 'job:', targetJobId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[processing-jobs API] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
