import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gallery } from '../data';

const ORDER = ['Cars', 'Bikes', 'Lorries', 'Others', 'Owner', 'Promotional'];

export function Gallery() {
  const cats = useMemo(
    () => ['All', ...ORDER.filter((c) => gallery.some((g) => g.category === c))],
    [],
  );
  const [cat, setCat] = useState('All');
  const items = cat === 'All' ? gallery : gallery.filter((g) => g.category === cat);
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, close, step]);

  const cur = open !== null ? items[open] : null;

  return (
    <section id="work" className="gallery section" aria-labelledby="work-title">
      <div className="wrap">
        <div className="section-head reveal">
          <div>
            <p className="eyebrow">Our work</p>
            <h2 id="work-title" className="section-title">Faces and finishes.</h2>
          </div>
          {cats.length > 2 && (
            <div className="chips" role="group" aria-label="Filter gallery">
              {cats.map((c) => (
                <button key={c} className={c === cat ? 'on' : ''} aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          )}
        </div>
        <div className="masonry">
          {items.map((g, i) => (
            <button
              key={g.src}
              className="tile reveal"
              onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
              aria-label={`View larger: ${g.alt}`}
            >
              <img src={g.src} alt={g.alt} loading="lazy" width={g.w} height={g.h} />
              <span className={`tag tag-${g.kind}`}>{g.kind === 'promo' ? 'Promotional visual' : 'Photograph'}</span>
            </button>
          ))}
        </div>
      </div>

      {cur && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={cur.alt} onClick={close}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img key={cur.src} src={cur.src} alt={cur.alt} />
            <figcaption>
              <span>{cur.alt}</span>
              <span>{open! + 1} / {items.length}</span>
            </figcaption>
          </figure>
          <button ref={closeRef} className="lb-btn lb-close" onClick={close} aria-label="Close"><X size={22} /></button>
          {items.length > 1 && (
            <>
              <button className="lb-btn lb-prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous"><ChevronLeft size={24} /></button>
              <button className="lb-btn lb-next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next"><ChevronRight size={24} /></button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
