'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1714, #0d0c0a)' }}>
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="9" width="34" height="26" rx="2" stroke="#d4a574" strokeWidth="0.5" opacity="0.15"/>
              <rect x="29" y="4.5" width="6" height="3.5" rx="0.8" stroke="#d4a574" strokeWidth="0.5" opacity="0.15"/>
              <path d="M22 3.5 L25.5 15.5 L22 13 Z" fill="#c47d4a" opacity="0.95"/>
              <path d="M38 11 L29 19 L28.5 14.5 Z" fill="#d4a574" opacity="0.7"/>
              <path d="M38 33 L28 25.5 L29.5 21 Z" fill="#c47d4a" opacity="0.55"/>
              <path d="M22 40.5 L18.5 28.5 L22 31 Z" fill="#d4a574" opacity="0.95"/>
              <path d="M6 33 L15 25.5 L15.5 30 Z" fill="#c47d4a" opacity="0.7"/>
              <path d="M6 11 L16 19 L14.5 23.5 Z" fill="#d4a574" opacity="0.55"/>
              <circle cx="22" cy="22" r="4" fill="#c47d4a"/>
            </svg>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Libre Baskerville', serif" }}>Apelier</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              From shutter click to client delivery in under 1 hour.
            </h1>
            <p className="text-lg" style={{ color: '#8a7560' }}>
              CRM, AI editing, and client galleries — all in one platform built for photographers.
            </p>
          </div>
          <p className="text-sm" style={{ color: '#4a453f' }}>
            &copy; 2026 Apelier. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0f]">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
