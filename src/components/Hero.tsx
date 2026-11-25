import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, Plus } from 'lucide-react';
import { business, hotspots, links, vehicleNotes, type Hotspot } from '../data';
import { PHASES, WaterCanvas } from './WaterCanvas';

type Phase = 'overview' | 'entering' | 'detail' | 'returning';
const ZOOM_MS = 1500;

export function Hero() {
  const [phase, setPhase] = useState<Phase>('overview');
  const [active, setActive] = useState<Hotspot | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [openPart, setOpenPart] = useState<number | null>(null);
  const [washStep, setWashStep] = useState(0);
  const aimRef = useRef<{ x: number; y: number } | null>(null);
  const pointerRef = useRef({ x: 50, y: 50, inside: false });
  const planeRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<number>();
  const restoreFocus = useRef(false);

  const enter = (h: Hotspot, el: HTMLButtonElement) => {
    if (phase !== 'overview') return;
    returnFocus.current = el;
    setActive(h);
    setOpenPart(null);
    aimRef.current = { x: h.x, y: h.y };
    setPhase('entering');
    timer.current = window.setTimeout(() => {
      setPhase('detail');
      backRef.current?.focus();
    }, ZOOM_MS);
  };

  const back = useCallback(() => {
    if (phase !== 'detail') return;
    setPhase('returning');
    aimRef.current = null;
    timer.current = window.setTimeout(() => {
      restoreFocus.current = true;
      setPhase('overview');
      setActive(null);
    }, ZOOM_MS);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') back(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // The hotspot is disabled until the overview renders, so focus it afterwards.
  useEffect(() => {
    if (phase === 'overview' && restoreFocus.current) {
      restoreFocus.current = false;
      returnFocus.current?.focus();
    }
  }, [phase]);

  const onMove = (e: React.PointerEvent) => {
    const r = planeRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    pointerRef.current = { x, y, inside: true };
    planeRef.current!.style.setProperty('--mx', ((x - 50) / 50).toFixed(3));
    planeRef.current!.style.setProperty('--my', ((y - 50) / 50).toFixed(3));
  };
  const onLeave = () => {
    pointerRef.current.inside = false;
    planeRef.current!.style.setProperty('--mx', '0');
    planeRef.current!.style.setProperty('--my', '0');
  };

  const aimAt = (h: Hotspot | null) => {
    setHovered(h?.id ?? null);
    if (phase === 'overview') aimRef.current = h ? { x: h.x, y: h.y } : null;
  };

  const zoomed = phase === 'entering' || phase === 'detail';

  return (
    <section id="home" className={`hero phase-${phase}`} aria-label="R.K CAR WASH">
      <div className={`intro${phase !== 'overview' ? ' hide' : ''}`}>
        <div>
          <p className="eyebrow">{business.name} — {business.tagline}</p>
          <h1>Every vehicle deserves a fresh start.</h1>
        </div>
        <div className="intro-side">
          <p className="intro-description">
            From everyday rides to heavy-duty machines, we bring back the shine with passion, precision and care.
          </p>
          <div className="cta-row">
            <a className="btn btn-acid" href={links.whatsapp} target="_blank" rel="noopener">Book your wash</a>
            <a className="btn btn-line" href="#services">Explore our services</a>
          </div>
        </div>
      </div>

      <div className="stage">
        {phase !== 'overview' && (
          <button ref={backRef} className="back" onClick={back} disabled={phase !== 'detail'}>
            <ArrowLeft size={16} /> Back <kbd>Esc</kbd>
          </button>
        )}

        <div
          ref={planeRef}
          className="image-plane"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={active ? ({ '--focus-x': `${active.x}%`, '--focus-y': `${active.y}%` } as React.CSSProperties) : undefined}
        >
          <div className="media-envelope">
            <div className="car-visual">
              <div className="cam">
                <img
                  className="car-image"
                  src="/img/promo-red-car.webp"
                  width={800}
                  height={533}
                  alt="A washer in uniform sprays high-pressure water over a red sports car under studio lights (promotional visual)"
                  fetchPriority="high"
                />
                <WaterCanvas aimRef={aimRef} pointerRef={pointerRef} onPhase={setWashStep} />
              </div>
            </div>
            <div className={`detail-scrim${zoomed ? ' shown' : ''}`} />
            <span className="promo-tag">Promotional visual</span>
          </div>

          <div className={`wash-status${phase !== 'overview' ? ' hide' : ''}`} aria-hidden="true">
            {PHASES.map((p, i) => (
              <span key={p} className={i === washStep ? 'on' : ''}>
                <i className="small-dot" /> {p}
              </span>
            ))}
          </div>

          {hotspots.map((h) => (
            <button
              key={h.id}
              className={`hotspot${hovered === h.id ? ' active' : ''}`}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              disabled={phase !== 'overview'}
              aria-label={`${h.label}: open details`}
              onPointerEnter={() => aimAt(h)}
              onPointerLeave={() => aimAt(null)}
              onFocus={() => aimAt(h)}
              onBlur={() => aimAt(null)}
              onClick={(e) => enter(h, e.currentTarget)}
            >
              <span className="hotspot-ring"><Plus size={14} strokeWidth={1.6} /></span>
              <span className="hotspot-label">{h.label}</span>
            </button>
          ))}
        </div>

        {active && (
          <aside className={`detail-copy${phase === 'detail' ? ' shown' : ''}`} aria-hidden={phase !== 'detail'}>
            <h2><span>{active.title[0]}</span><span>{active.title[1]}</span></h2>
            <p className="system-description">{active.description}</p>
            <div className="part-list">
              {active.parts.map((part, i) => (
                <button
                  key={part.name}
                  className={openPart === i ? 'selected' : ''}
                  aria-expanded={openPart === i}
                  onClick={() => setOpenPart(openPart === i ? null : i)}
                  tabIndex={phase === 'detail' ? 0 : -1}
                >
                  <span className="part-row">
                    <small>0{i + 1}</small> {part.name} <Plus size={16} />
                  </span>
                  {openPart === i && <span className="part-description">{part.text}</span>}
                </button>
              ))}
            </div>
            <div className="benefit">
              <span>For you</span>
              <p>{active.benefit}</p>
            </div>
          </aside>
        )}
        <p className="sr-only" role="status">
          {phase === 'detail' && active ? `${active.label} details open. Press Escape to go back.` : ''}
        </p>
      </div>

      <footer className="scene-footer">
        <div className="feature-notes">
          {vehicleNotes.map((n) => (
            <div className="feature-note" key={n.title}>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </div>
          ))}
        </div>
        <div className="footer-baseline">
          <span>{business.name} — We don’t just wash vehicles. We bring back their shine.</span>
          <a href="#about" className="scroll-cue">Scroll to explore <ArrowDown size={13} /></a>
        </div>
      </footer>
    </section>
  );
}
