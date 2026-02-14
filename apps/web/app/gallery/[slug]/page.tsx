'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { Photo } from '@/lib/types';
import {
  Camera, Heart, Download, Lock, X, ChevronLeft, ChevronRight,
  Grid3X3, LayoutGrid, Loader2,
} from 'lucide-react';

type GalleryData = {
  id: string;
  photographer_id: string;
  title: string;
  description?: string;
  slug: string;
  access_type: string;
  download_permissions: { allow_full_res: boolean; allow_web: boolean; allow_favorites_only: boolean };
  status: string;
  view_count: number;
  photo_count: number;
  expires_at?: string;
  password_hash?: string;
  client?: { first_name: string; last_name: string } | null;
};

type BrandData = {
  business_name?: string;
  brand_settings: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
  };
};

/* ─── Password Gate ─── */
function PasswordGate({ onUnlock, brandColor }: { onUnlock: () => void; brandColor: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) { onUnlock(); } else { setError(true); }
  };
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: brandColor + '15' }}>
            <Lock className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Protected Gallery</h2>
          <p className="text-sm text-gray-500 mt-1">Enter the password your photographer provided.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="Enter password" autoFocus
            className={`w-full px-4 py-3 text-sm border rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-gray-200'}`} />
          {error && <p className="text-xs text-red-500">Please enter the gallery password.</p>}
          <button type="submit" className="w-full py-3 text-sm font-medium text-white rounded-xl transition-colors" style={{ backgroundColor: brandColor }}>View Gallery</button>
        </form>
      </div>
    </div>
  );
}

/* ─── Lightbox ─── */
function ClientLightbox({ photo, photos, onClose, onPrev, onNext, onToggleFav }: {
  photo: Photo; photos: Photo[]; onClose: () => void; onPrev: () => void; onNext: () => void; onToggleFav: (id: string, fav: boolean) => void;
}) {
  const idx = photos.findIndex(p => p.id === photo.id);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
        <span className="text-sm text-white/70">{idx + 1} / {photos.length}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggleFav(photo.id, !photo.is_favorite)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Heart className={`w-5 h-5 ${photo.is_favorite ? 'text-pink-400 fill-pink-400' : 'text-white/50'}`} />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-2 sm:left-6 p-2 text-white/30 hover:text-white transition-colors">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <div className="max-w-[90vw] max-h-[80vh] flex items-center justify-center">
          {(photo as any).preview_url ? (
            <img src={(photo as any).preview_url.replace('/800/533', '/1200/800')} alt={photo.filename} className="max-w-full max-h-[80vh] rounded-lg object-contain" />
          ) : (
            <div className="w-[800px] max-w-full aspect-[3/2] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{photo.filename}</p>
              </div>
            </div>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-2 sm:right-6 p-2 text-white/30 hover:text-white transition-colors">
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
      <div className="px-4 py-3 flex items-center justify-center gap-4 text-xs text-white/50 z-10" onClick={e => e.stopPropagation()}>
        {photo.section && <span className="capitalize">{photo.section.replace('-', ' ')}</span>}
        <span>{photo.filename}</span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PublicGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [activeSection, setActiveSection] = useState('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [gridSize, setGridSize] = useState<'small' | 'large'>('large');

  const brandColor = brand?.brand_settings?.primary_color || '#6366f1';
  const businessName = brand?.business_name || 'Gallery';

  useEffect(() => {
    loadGallery();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadGallery() {
    setLoading(true);
    try {
      const sb = createSupabaseClient();
      const { data: gData, error: gErr } = await sb
        .from('galleries')
        .select('*, client:clients(first_name, last_name)')
        .eq('slug', slug)
        .in('status', ['delivered', 'ready'])
        .single();

      if (gErr || !gData) { setError('Gallery not found or no longer available.'); setLoading(false); return; }

      if (gData.expires_at && new Date(gData.expires_at) < new Date()) {
        setError('This gallery has expired. Please contact your photographer if you need access.');
        setLoading(false); return;
      }

      const g: GalleryData = { ...gData, client: Array.isArray(gData.client) ? gData.client[0] ?? null : gData.client };
      setGallery(g);
      if (g.access_type !== 'password') setUnlocked(true);

      const { data: brandData } = await sb.from('photographers').select('business_name, brand_settings').eq('id', g.photographer_id).single();
      if (brandData) setBrand(brandData);

      const { data: photoData } = await sb.from('photos').select('*').eq('gallery_id', g.id)
        .in('status', ['edited', 'approved', 'delivered']).order('sort_order', { ascending: true });
      setPhotos(photoData || []);

      try { await sb.rpc('increment_gallery_views', { gallery_id: g.id }); } catch { /* non-critical */ }
    } catch { setError('Something went wrong loading this gallery.'); }
    setLoading(false);
  }

  const toggleFavorite = async (photoId: string, isFavorite: boolean) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_favorite: isFavorite } : p));
    if (lightboxPhoto?.id === photoId) setLightboxPhoto(prev => prev ? { ...prev, is_favorite: isFavorite } : null);
    try {
      const sb = createSupabaseClient();
      await sb.from('photos').update({ is_favorite: isFavorite }).eq('id', photoId);
    } catch {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_favorite: !isFavorite } : p));
    }
  };

  const sections = ['all', ...Array.from(new Set(photos.map(p => p.section).filter(Boolean)))] as string[];
  let displayPhotos = photos;
  if (activeSection !== 'all') displayPhotos = displayPhotos.filter(p => p.section === activeSection);
  if (showFavoritesOnly) displayPhotos = displayPhotos.filter(p => p.is_favorite);
  const favoriteCount = photos.filter(p => p.is_favorite).length;

  const lightboxIndex = lightboxPhoto ? displayPhotos.findIndex(p => p.id === lightboxPhoto.id) : -1;
  const goLightbox = useCallback((dir: -1 | 1) => {
    if (lightboxIndex < 0) return;
    const next = (lightboxIndex + dir + displayPhotos.length) % displayPhotos.length;
    setLightboxPhoto(displayPhotos[next]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, displayPhotos]);

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: brandColor + '30', borderTopColor: brandColor }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <Camera className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Gallery Unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </div>
    </div>
  );

  if (!gallery) return null;
  if (gallery.access_type === 'password' && !unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} brandColor={brandColor} />;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {lightboxPhoto && (
        <ClientLightbox photo={lightboxPhoto} photos={displayPhotos}
          onClose={() => setLightboxPhoto(null)} onPrev={() => goLightbox(-1)} onNext={() => goLightbox(1)}
          onToggleFav={toggleFavorite} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brandColor }}>
                {businessName.charAt(0)}
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-semibold text-gray-900">{gallery.title}</h1>
                <p className="text-[11px] text-gray-400">{businessName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                  showFavoritesOnly ? 'border-pink-200 bg-pink-50 text-pink-600' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'}`}>
                <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-pink-500' : ''}`} />
                <span className="hidden sm:inline">{favoriteCount}</span>
              </button>
              <button onClick={() => setGridSize(gridSize === 'large' ? 'small' : 'large')}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-colors">
                {gridSize === 'large' ? <Grid3X3 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              </button>
              {gallery.download_permissions.allow_web && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full text-white transition-colors" style={{ backgroundColor: brandColor }}>
                  <Download className="w-3 h-3" /><span className="hidden sm:inline">Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Description */}
      {gallery.description && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <p className="text-sm text-gray-500 max-w-2xl">{gallery.description}</p>
        </div>
      )}

      {/* Section tabs */}
      {sections.length > 2 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {sections.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap border transition-all ${
                  activeSection === s
                    ? 'text-white border-transparent' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                }`}
                style={activeSection === s ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}>
                {s === 'all' ? `All (${photos.length})` : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {displayPhotos.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{showFavoritesOnly ? 'No favourites yet — click the heart on any photo!' : 'No photos in this section.'}</p>
          </div>
        ) : (
          <div className={`grid gap-2 sm:gap-3 ${
            gridSize === 'large'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
          }`}>
            {displayPhotos.map(photo => (
              <div key={photo.id} className="relative group cursor-pointer" onClick={() => setLightboxPhoto(photo)}>
                <div className={`${gridSize === 'large' ? 'aspect-[4/3]' : 'aspect-square'} rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
                  {(photo as any).preview_url ? (
                    <img src={(photo as any).preview_url} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-300" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <div className="flex items-center gap-2 w-full">
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id, !photo.is_favorite); }}
                          className="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm">
                          <Heart className={`w-3.5 h-3.5 ${photo.is_favorite ? 'text-pink-500 fill-pink-500' : 'text-gray-600'}`} />
                        </button>
                        {gallery.download_permissions.allow_web && (
                          <button onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm">
                            <Download className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Favourite indicator */}
                {photo.is_favorite && (
                  <div className="absolute top-2 right-2 group-hover:opacity-0 transition-opacity">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500 drop-shadow-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Camera className="w-3.5 h-3.5" />
            <span>Powered by Aperture Suite</span>
          </div>
          <p className="text-xs text-gray-400">{photos.length} photos</p>
        </div>
      </footer>
    </div>
  );
}
