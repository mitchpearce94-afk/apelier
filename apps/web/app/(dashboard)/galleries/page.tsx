'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { getGalleries } from '@/lib/queries';
import { GalleryDetail } from '@/components/galleries/gallery-detail';
import type { Gallery } from '@/lib/types';
import {
  ImageIcon, Eye, Share2, Search, Copy, Check,
  Lock, Globe, Mail, Camera, ExternalLink,
} from 'lucide-react';

type FilterStatus = 'ready' | 'delivered' | 'all';

function GalleryCard({ gallery, onClick }: { gallery: Gallery; onClick: () => void }) {
  const [copied, setCopied] = useState(false);
  const clientName = gallery.client
    ? `${gallery.client.first_name} ${gallery.client.last_name || ''}`.trim()
    : undefined;

  const galleryUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/gallery/${gallery.slug || gallery.id}`;

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AccessIcon = gallery.access_type === 'password' ? Lock
    : gallery.access_type === 'email' ? Mail
    : Globe;

  const coverUrl = (gallery as any).cover_thumb_url;

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-white/[0.06] bg-[#0c0c16] hover:border-white/[0.12] transition-all cursor-pointer group overflow-hidden"
    >
      {/* Cover area */}
      <div className="relative h-32 sm:h-36 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={gallery.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <Camera className="w-8 h-8 text-slate-800" />
        )}

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <StatusBadge status={gallery.status} />
          <AccessIcon className="w-3 h-3 text-slate-500" />
        </div>

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] text-white/80">
          <ImageIcon className="w-2.5 h-2.5" />
          <span>{gallery.photo_count || 0}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-white truncate">{gallery.title}</h3>
        {clientName && <p className="text-xs text-slate-500 mt-0.5 truncate">{clientName}</p>}

        <div className="flex items-center gap-3 mt-2.5 text-[10px] sm:text-[11px] text-slate-500">
          {gallery.view_count > 0 && (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{gallery.view_count}</span>
          )}
          <span>{formatDate(gallery.created_at, 'relative')}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {(gallery.status === 'delivered' || gallery.status === 'ready') && (
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.12] transition-all"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          )}
          {gallery.status === 'ready' && (
            <Button size="sm" className="h-6 text-[10px] px-2">
              <Share2 className="w-2.5 h-2.5" />Deliver
            </Button>
          )}
          {gallery.status === 'delivered' && (
            <button
              onClick={(e) => { e.stopPropagation(); window.open(galleryUrl, '_blank'); }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.12] transition-all"
            >
              <ExternalLink className="w-2.5 h-2.5" />View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('ready');
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGalleries();
        setGalleries(data);
      } catch {
        setGalleries([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Refresh galleries when returning from detail view
  const handleBack = async () => {
    setSelectedGallery(null);
    try {
      const data = await getGalleries();
      setGalleries(data);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedGallery) {
    return (
      <GalleryDetail
        gallery={selectedGallery}
        onBack={handleBack}
        onUpdate={(updated) => {
          setSelectedGallery(updated);
          setGalleries(prev => prev.map(g => g.id === updated.id ? updated : g));
        }}
      />
    );
  }

  const filtered = galleries.filter((g) => {
    if (filter !== 'all' && g.status !== filter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = {
    ready: galleries.filter((g) => g.status === 'ready').length,
    delivered: galleries.filter((g) => g.status === 'delivered').length,
    all: galleries.length,
  };

  const totalPhotos = galleries.reduce((sum, g) => sum + (g.photo_count || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Galleries</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          {galleries.length} galler{galleries.length !== 1 ? 'ies' : 'y'} · {totalPhotos} photos
        </p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ready', 'delivered', 'all'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[11px] rounded-full whitespace-nowrap border transition-all ${
                filter === s
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {statusCounts[s] > 0 && (
                <span className={`ml-1.5 ${filter === s ? 'text-amber-400' : 'text-slate-600'}`}>{statusCounts[s]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search galleries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>
      </div>

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={filter !== 'all' ? 'No galleries match this filter' : 'No galleries yet'}
          description={filter !== 'all' ? 'Try a different filter or search term.' : 'Galleries are created automatically when you send photos from Auto Editor.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((gallery) => (
            <GalleryCard
              key={gallery.id}
              gallery={gallery}
              onClick={() => setSelectedGallery(gallery)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
