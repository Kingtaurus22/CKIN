"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

export type CarouselMedia = { type: "image" | "video"; url: string };

const AUTOPLAY_MS = 4500;

/**
 * Galeri media laporan survei:
 * - carousel utama yang berjalan sendiri (berhenti saat kursor di atasnya,
 *   saat video diputar, atau saat popup terbuka)
 * - strip thumbnail semua foto & video; klik → carousel lompat ke media itu
 * - klik media besar → popup layar penuh (lightbox) dengan navigasi & penghitung
 */
export default function MediaCarousel({ media, title }: { media: CarouselMedia[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const total = media.length;

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
      setVideoPlaying(false);
    },
    [total],
  );

  // Putar otomatis.
  useEffect(() => {
    if (total < 2 || hover || videoPlaying || lightbox) return;
    const timer = setTimeout(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, total, hover, videoPlaying, lightbox, go]);

  // Jaga thumbnail aktif tetap terlihat (hanya menggulir strip, bukan halaman).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [index]);

  if (total === 0) {
    return <div className="media-empty mc-empty">Belum ada foto atau video dari surveyor</div>;
  }

  const current = media[index];
  const autoplay = total > 1 && !hover && !videoPlaying && !lightbox;

  return (
    <div className="mc">
      <div className="mc-stage" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
          />
        ) : (
          <button type="button" className="mc-open" onClick={() => setLightbox(true)} aria-label="Perbesar foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.url} src={current.url} alt={`${title} — media ${index + 1}`} />
          </button>
        )}

        {total > 1 && (
          <>
            <button type="button" className="mc-arrow prev" onClick={() => go(index - 1)} aria-label="Media sebelumnya">
              <Icon name="chevronRight" size={30} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button type="button" className="mc-arrow next" onClick={() => go(index + 1)} aria-label="Media berikutnya">
              <Icon name="chevronRight" size={30} />
            </button>
          </>
        )}
        {current.type === "video" && (
          <button type="button" className="mc-expand" onClick={() => setLightbox(true)} aria-label="Layar penuh">
            <Icon name="arrowUpRight" size={15} />
          </button>
        )}
        <span className="mc-count">
          {index + 1} / {total}
        </span>
        {autoplay && <span key={index} className="mc-progress" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}
      </div>

      <div className="mc-strip-wrap">
        <button
          type="button"
          className="mc-strip-btn"
          onClick={() => stripRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
          aria-label="Geser thumbnail ke kiri"
        >
          <Icon name="chevronRight" size={18} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="mc-strip" ref={stripRef}>
          {media.map((m, i) => (
            <button
              key={`${m.url}-${i}`}
              type="button"
              className={`mc-thumb ${i === index ? "active" : ""}`}
              onClick={() => go(i)}
              aria-label={`Tampilkan media ${i + 1}`}
              aria-current={i === index}
            >
              {m.type === "video" ? (
                <>
                  <video src={m.url} muted preload="metadata" tabIndex={-1} />
                  <span className="mc-play">
                    <Icon name="video" size={14} />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" loading="lazy" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mc-strip-btn"
          onClick={() => stripRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
          aria-label="Geser thumbnail ke kanan"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      {lightbox && (
        <Lightbox media={media} index={index} onChange={go} onClose={() => setLightbox(false)} title={title} />
      )}
    </div>
  );
}

function Lightbox({
  media,
  index,
  onChange,
  onClose,
  title,
}: {
  media: CarouselMedia[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange(index + 1);
      if (e.key === "ArrowLeft") onChange(index - 1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, onChange, onClose]);

  const m = media[index];
  return createPortal(
    <div className="mc-lightbox" role="dialog" aria-modal="true" aria-label={`Media ${title}`} onClick={onClose}>
      <button type="button" className="mc-lb-close" onClick={onClose} aria-label="Tutup">
        <Icon name="x" size={28} />
      </button>
      {media.length > 1 && (
        <button
          type="button"
          className="mc-lb-arrow prev"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index - 1);
          }}
          aria-label="Media sebelumnya"
        >
          <Icon name="chevronRight" size={36} style={{ transform: "rotate(180deg)" }} />
        </button>
      )}
      <div className="mc-lb-media" onClick={(e) => e.stopPropagation()}>
        {m.type === "video" ? (
          <video key={m.url} src={m.url} controls autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m.url} src={m.url} alt={`${title} — media ${index + 1}`} />
        )}
      </div>
      {media.length > 1 && (
        <button
          type="button"
          className="mc-lb-arrow next"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index + 1);
          }}
          aria-label="Media berikutnya"
        >
          <Icon name="chevronRight" size={36} />
        </button>
      )}
      <span className="mc-lb-count">
        {index + 1}/{media.length}
      </span>
    </div>,
    document.body,
  );
}
