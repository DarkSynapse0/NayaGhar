"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Play, Image as ImageIcon } from "lucide-react";

type MediaItem = {
  type: "image" | "video";
  url: string;
  alt?: string;
  thumbnail?: string;
};

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const close = useCallback(() => setLightboxOpen(false), []);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxOpen, close, next, prev]);

  if (items.length === 0) return null;

  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;

  return (
    <>
      {/* Grid */}
      <div className="rounded-2xl overflow-hidden border border-[var(--border)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
          {items.slice(0, 5).map((item, i) => (
            <button
              key={i}
              onClick={() => open(i)}
              className={`relative bg-[var(--bg-elevated)] overflow-hidden group ${
                i === 0 ? "col-span-2 sm:row-span-2 h-52 sm:h-[400px]" : "h-32 sm:h-[198px]"
              }`}
            >
              {item.type === "video" ? (
                <>
                  <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-warm-2">
                      <Play className="w-5 h-5 text-[#111] ml-0.5" fill="#111" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.alt || `Photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              )}

              {/* Show remaining count on last visible item */}
              {i === 4 && items.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{items.length - 5}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Media count bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--bg-card)] border-t border-[var(--border)]">
          {imageCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <ImageIcon className="w-3.5 h-3.5" /> {imageCount} photo{imageCount !== 1 && "s"}
            </span>
          )}
          {videoCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Play className="w-3.5 h-3.5" /> {videoCount} video{videoCount !== 1 && "s"}
            </span>
          )}
          <button onClick={() => open(0)} className="ml-auto text-xs text-[var(--accent)] font-semibold hover:underline">
            View all
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={close} />

          {/* Content */}
          <div className="relative z-10 w-full max-w-5xl mx-4 flex flex-col items-center">
            {/* Close */}
            <button onClick={close} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Media */}
            <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-black relative">
              {items[currentIndex].type === "video" ? (
                <video
                  key={items[currentIndex].url}
                  src={items[currentIndex].url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={items[currentIndex].url}
                  alt={items[currentIndex].alt || ""}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Nav arrows */}
              {items.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Type badge */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                {items[currentIndex].type === "video" ? "Video" : "Photo"}
              </div>
            </div>

            {/* Counter */}
            <p className="mt-3 text-sm text-white/40">
              {currentIndex + 1} / {items.length}
            </p>

            {/* Thumbnail strip */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-2">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex ? "border-[var(--accent)] opacity-100" : "border-transparent opacity-40 hover:opacity-70"
                  }`}
                >
                  {item.type === "video" ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" fill="white" />
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
