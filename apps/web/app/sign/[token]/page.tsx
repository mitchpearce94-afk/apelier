'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { CheckCircle2, RotateCcw, FileSignature, AlertCircle, Printer } from 'lucide-react';

type ContractData = {
  id: string;
  content: string;
  status: string;
  signed_at: string | null;
  signature_data: any;
  expires_at: string | null;
  client: { first_name: string; last_name: string; email: string } | null;
  job: { title: string; job_number: number; date: string } | null;
};

export default function SignContractPage() {
  const params = useParams();
  const token = params.token as string;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    loadContract();
  }, [token]);

  async function loadContract() {
    setLoading(true);
    try {
      const sb = createSupabaseClient();
      const { data, error: fetchError } = await sb
        .from('contracts')
        .select('id, content, status, signed_at, signature_data, expires_at, client:clients(first_name, last_name, email), job:jobs(title, job_number, date)')
        .eq('signing_token', token)
        .single();

      if (fetchError || !data) {
        setError('Contract not found or the link has expired.');
        setLoading(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This contract link has expired. Please contact your photographer for a new link.');
        setLoading(false);
        return;
      }

      const contractData: ContractData = {
        ...data,
        client: Array.isArray(data.client) ? data.client[0] ?? null : data.client,
        job: Array.isArray(data.job) ? data.job[0] ?? null : data.job,
      };
      setContract(contractData);

      if (data.status === 'signed') {
        setSigned(true);
      } else if (data.status === 'sent') {
        // Mark as viewed
        await sb
          .from('contracts')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('signing_token', token)
          .eq('status', 'sent');
      }
    } catch {
      setError('Something went wrong loading the contract.');
    }
    setLoading(false);
  }

  // Canvas drawing handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  }, [getCanvasCoords]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [isDrawing, getCanvasCoords]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSign() {
    if (!contract || !hasSignature || !agreedToTerms) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSigning(true);
    try {
      const signatureImage = canvas.toDataURL('image/png');

      // Get IP address (best effort)
      let ipAddress = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch {
        // IP fetch failed, continue with 'unknown'
      }

      const sb = createSupabaseClient();
      const { error: signError } = await sb
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_data: {
            signature_image: signatureImage,
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
          },
        })
        .eq('signing_token', token)
        .neq('status', 'signed');

      if (signError) {
        setError('Failed to save signature. Please try again.');
      } else {
        setSigned(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setSigning(false);
  }

  function handlePrint() {
    window.print();
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Contract</h1>
          <p className="text-sm text-gray-500">{error || 'Contract not found.'}</p>
        </div>
      </div>
    );
  }

  // Already signed
  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Contract Signed</h1>
            <p className="text-sm text-gray-500">
              Thank you{contract.client ? `, ${contract.client.first_name}` : ''}! Your contract has been signed successfully.
            </p>
            {contract.signed_at && (
              <p className="text-xs text-gray-400 mt-1">
                Signed on {new Date(contract.signed_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Signed contract view */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Signed Contract</span>
              </div>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />Print / Save PDF
              </button>
            </div>
            <div className="px-6 py-6 print:px-0">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {contract.content}
              </pre>

              {/* Signature display */}
              {contract.signature_data?.signature_image && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-3">CLIENT SIGNATURE</p>
                  <div className="inline-block border-b-2 border-gray-300 pb-1">
                    <img
                      src={contract.signature_data.signature_image}
                      alt="Signature"
                      className="h-16"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {contract.client?.first_name} {contract.client?.last_name || ''} · {contract.signed_at && new Date(contract.signed_at).toLocaleDateString('en-AU')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Signing view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <FileSignature className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Photography Services Agreement</h1>
          {contract.client && (
            <p className="text-sm text-gray-500">
              Prepared for {contract.client.first_name} {contract.client.last_name || ''}
            </p>
          )}
        </div>

        {/* Contract content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Contract</span>
          </div>
          <div className="px-6 py-6 max-h-[500px] overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {contract.content}
            </pre>
          </div>
        </div>

        {/* Signing section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Sign Below</h2>
            <p className="text-xs text-gray-500 mt-0.5">Draw your signature using your mouse or finger</p>
          </div>

          <div className="px-6 py-6 space-y-4">
            {/* Signature canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg cursor-crosshair bg-white touch-none"
                style={{ height: '160px' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-gray-300">Sign here</p>
                </div>
              )}
            </div>

            {/* Clear button */}
            {hasSignature && (
              <button
                onClick={clearSignature}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />Clear signature
              </button>
            )}

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500/20"
              />
              <span className="text-sm text-gray-600 leading-snug">
                I, <strong className="text-gray-800">{contract.client?.first_name} {contract.client?.last_name || ''}</strong>, have read, understood, and agree to the terms outlined in this Photography Services Agreement.
              </span>
            </label>

            {/* Sign button */}
            <button
              onClick={handleSign}
              disabled={!hasSignature || !agreedToTerms || signing}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {signing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  I Agree &amp; Sign
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              By signing, you agree this electronic signature is legally binding and equivalent to a handwritten signature.
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
