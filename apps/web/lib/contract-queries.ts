import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { Contract, Job, Client, Photographer } from '@/lib/types';
import { getCurrentPhotographer } from '@/lib/queries';
import { DEFAULT_CONTRACT } from '@/lib/default-contract';

const supabase = () => createSupabaseClient();

// ============================================
// Contract Template (stored on photographer profile)
// ============================================

export async function getContractTemplate(): Promise<string | null> {
  const photographer = await getCurrentPhotographer();
  if (!photographer) return null;
  return photographer.contract_template || null;
}

export async function saveContractTemplate(content: string): Promise<boolean> {
  const photographer = await getCurrentPhotographer();
  if (!photographer) return false;

  const sb = supabase();
  const { error } = await sb
    .from('photographers')
    .update({ contract_template: content })
    .eq('id', photographer.id);

  if (error) {
    console.error('Error saving contract template:', error);
    return false;
  }
  return true;
}

// ============================================
// Contracts (generated from template, linked to jobs)
// ============================================

export async function getContracts(): Promise<Contract[]> {
  const sb = supabase();
  const { data, error } = await sb
    .from('contracts')
    .select('*, client:clients(first_name, last_name, email), job:jobs(title, job_number, job_type)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contracts:', error);
    return [];
  }
  return data || [];
}

export async function getContract(id: string): Promise<Contract | null> {
  const sb = supabase();
  const { data, error } = await sb
    .from('contracts')
    .select('*, client:clients(first_name, last_name, email, phone), job:jobs(title, job_number, job_type, date, time, location, package_name, package_amount, included_images)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching contract:', error);
    return null;
  }
  return data;
}

export async function getContractByToken(token: string): Promise<Contract | null> {
  const sb = supabase();
  const { data, error } = await sb
    .from('contracts')
    .select('*, client:clients(first_name, last_name, email), job:jobs(title, job_number, date, time, location, package_name, package_amount)')
    .eq('signing_token', token)
    .single();

  if (error) {
    console.error('Error fetching contract by token:', error);
    return null;
  }
  return data;
}

/**
 * Generate a contract from the photographer's template, filling in merge tags
 * from the job and client data. Called automatically when a job is booked.
 */
export async function generateContract(jobId: string): Promise<Contract | null> {
  const photographer = await getCurrentPhotographer();
  if (!photographer) {
    console.error('No photographer profile found — cannot generate contract');
    return null;
  }

  const sb = supabase();

  // Get the job with client data
  const { data: job, error: jobError } = await sb
    .from('jobs')
    .select('*, client:clients(*)')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    console.error('Error fetching job for contract:', jobError);
    return null;
  }

  // Get the template (from photographer profile, or use default)
  const template = photographer.contract_template || DEFAULT_CONTRACT;
  if (!template) {
    console.error('No contract template found for photographer');
    return null;
  }

  // Get packages from localStorage won't work server-side, so we pull from job data
  const client = job.client as Client;
  const packageAmount = job.package_amount || 0;

  // Look up the actual package to check deposit settings
  let requireDeposit = false;
  let depositPercent = 25;

  if (job.package_name) {
    const { data: pkg } = await sb
      .from('packages')
      .select('require_deposit, deposit_percent')
      .eq('photographer_id', photographer.id)
      .eq('name', job.package_name)
      .single();

    if (pkg) {
      requireDeposit = pkg.require_deposit ?? false;
      depositPercent = pkg.deposit_percent ?? 25;
    }
  }

  const depositAmount = requireDeposit ? Math.round(packageAmount * (depositPercent / 100) * 100) / 100 : 0;
  const finalAmount = packageAmount - depositAmount;

  // Fill in merge tags
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  let content = template
    .replace(/\{\{client_name\}\}/g, `${client.first_name} ${client.last_name || ''}`.trim())
    .replace(/\{\{client_email\}\}/g, client.email || '')
    .replace(/\{\{job_date\}\}/g, job.date ? new Date(job.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC')
    .replace(/\{\{job_time\}\}/g, job.time || 'TBC')
    .replace(/\{\{job_location\}\}/g, job.location || 'TBC')
    .replace(/\{\{package_name\}\}/g, job.package_name || 'Custom')
    .replace(/\{\{package_amount\}\}/g, formatCurrencySimple(packageAmount))
    .replace(/\{\{included_images\}\}/g, String(job.included_images || 'as per package'))
    .replace(/\{\{business_name\}\}/g, photographer.business_name || photographer.name)
    .replace(/\{\{photographer_name\}\}/g, photographer.name)
    .replace(/\{\{today_date\}\}/g, today)
    .replace(/\{\{deposit_amount\}\}/g, formatCurrencySimple(depositAmount))
    .replace(/\{\{deposit_percent\}\}/g, String(depositPercent))
    .replace(/\{\{final_amount\}\}/g, formatCurrencySimple(finalAmount));

  // Process conditional blocks
  content = processConditionals(content, {
    deposit: requireDeposit,
    no_deposit: !requireDeposit,
    second_shooter: false, // TODO: pull from package settings
    minors: false, // TODO: pull from job metadata
  });

  // Create the contract record
  const { data: contract, error: createError } = await sb
    .from('contracts')
    .insert({
      photographer_id: photographer.id,
      job_id: jobId,
      client_id: job.client_id,
      content,
      status: 'sent',
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      signature_data: photographer.signature_image
        ? { photographer_signature: photographer.signature_image }
        : null,
    })
    .select('*, client:clients(first_name, last_name, email), job:jobs(title, job_number, job_type)')
    .single();

  if (createError) {
    console.error('Error creating contract:', createError);
    return null;
  }

  return contract;
}

/**
 * Sign a contract (called from the public signing page)
 */
export async function signContract(
  signingToken: string,
  signatureData: {
    signature_image: string;
    ip_address: string;
    user_agent: string;
  }
): Promise<boolean> {
  const sb = supabase();

  // First get existing signature_data to preserve photographer signature
  const { data: existing } = await sb
    .from('contracts')
    .select('signature_data')
    .eq('signing_token', signingToken)
    .single();

  const existingData = existing?.signature_data || {};

  const { error } = await sb
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signature_data: {
        ...existingData,
        ...signatureData,
      },
    })
    .eq('signing_token', signingToken)
    .neq('status', 'signed');

  if (error) {
    console.error('Error signing contract:', error);
    return false;
  }
  return true;
}

/**
 * Mark a contract as viewed (when client opens the signing link)
 */
export async function markContractViewed(signingToken: string): Promise<boolean> {
  const sb = supabase();
  const { error } = await sb
    .from('contracts')
    .update({
      status: 'viewed',
      viewed_at: new Date().toISOString(),
    })
    .eq('signing_token', signingToken)
    .in('status', ['sent']); // Only update if not already viewed/signed

  if (error) {
    console.error('Error marking contract viewed:', error);
    return false;
  }
  return true;
}

export async function deleteContract(id: string): Promise<boolean> {
  const sb = supabase();
  const { error } = await sb.from('contracts').delete().eq('id', id);
  if (error) {
    console.error('Error deleting contract:', error);
    return false;
  }
  return true;
}

// ============================================
// Helpers
// ============================================

function formatCurrencySimple(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Process {{#if condition}}...{{/if}} blocks in the template
 */
function processConditionals(template: string, conditions: Record<string, boolean>): string {
  let result = template;

  for (const [key, value] of Object.entries(conditions)) {
    const regex = new RegExp(`\\{\\{#if ${key}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
    if (value) {
      // Keep the content, remove the tags
      result = result.replace(regex, '$1');
    } else {
      // Remove the entire block
      result = result.replace(regex, '');
    }
  }

  // Clean up any remaining double newlines from removed blocks
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}
