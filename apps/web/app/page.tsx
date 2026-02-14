export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Libre Baskerville', serif" }}>
          Apelier
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Shoot. Edit. Deliver.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg font-semibold hover:border-slate-500 transition"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
