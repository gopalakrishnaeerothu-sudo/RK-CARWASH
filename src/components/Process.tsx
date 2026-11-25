import { useEffect, useRef, useState } from 'react';
import { steps } from '../data';

/** Sticky, scroll-driven walkthrough of the five washing stages. */
export function Process() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      setProgress(p);
      setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const jump = (i: number) => {
    const el = ref.current!;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + ((i + 0.5) / steps.length) * total, behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="process dark" aria-labelledby="process-title" style={{ '--steps': steps.length } as React.CSSProperties}>
      <div className="process-sticky">
        <div className="wrap process-grid">
          <div className="process-copy">
            <p className="eyebrow">The washing experience</p>
            <h2 id="process-title" className="section-title">Five stages.{' '}<br />One fresh start.</h2>
            <ol className="step-list">
              {steps.map((s, i) => (
                <li key={s.no} className={i === active ? 'on' : i < active ? 'done' : ''}>
                  <button onClick={() => jump(i)} aria-current={i === active ? 'step' : undefined}>
                    <small>{s.no}</small>
                    <span className="step-title">{s.title}</span>
                    <span className="step-text">{s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="process-visual frame">
            {steps.map((s, i) => (
              <img
                key={s.no}
                src={s.img}
                alt=""
                loading="lazy"
                className={i === active ? 'on' : ''}
                style={{ objectPosition: s.pos }}
              />
            ))}
            <div className="process-number" aria-hidden="true">{steps[active].no}</div>
            <div className="process-caption">
              <span>{steps[active].title}</span>
              <span className="promo-note">Promotional visual</span>
            </div>
            <div className="process-bar"><i style={{ transform: `scaleX(${progress})` }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
