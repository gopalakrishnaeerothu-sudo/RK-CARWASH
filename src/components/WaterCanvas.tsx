import { useEffect, useRef } from 'react';

/**
 * Real-time water / foam / shine simulation drawn over the hero photograph.
 * All geometry is in percentages of the hero image (800x533 promo-red-car.webp),
 * so it stays locked to the photo at every size.
 *
 * Cycle: 0 pre-wash jet → 1 foam builds on the body → 2 rinse dissolves it → 3 shine sweep.
 */

export const PHASES = ['Pre-wash', 'Foam wash', 'High-pressure rinse', 'Final shine'] as const;
const PHASE_LEN = [3.2, 4.2, 4.2, 3.0];
const CYCLE = PHASE_LEN.reduce((a, b) => a + b, 0);

const NOZZLE = { x: 61.2, y: 17.2 };
// Upper outline of the car body, left → right (x%, y%)
const TOP: [number, number][] = [
  [20, 43], [26, 39.5], [33, 37], [40, 34], [45, 30], [50, 28], [56, 27.2], [62, 28], [68, 30], [72.5, 33],
];
// Closed body silhouette for clipping the shine sweep
const BODY: [number, number][] = [
  ...TOP, [73, 45], [72, 56], [60, 58.5], [48, 60.5], [32, 60], [21, 58.5], [19.5, 50],
];

function topY(x: number) {
  if (x <= TOP[0][0]) return TOP[0][1];
  for (let i = 1; i < TOP.length; i++) {
    const [x1, y1] = TOP[i];
    const [x0, y0] = TOP[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return TOP[TOP.length - 1][1];
}

type Drop = { x: number; y: number; vx: number; vy: number; t: number; life: number; s: number; k: 0 | 1 | 2 | 3; tx: number; ty: number };
type Bubble = { x: number; y: number; r: number; R: number; a: number; dying: boolean };
type Ambient = { x: number; y: number; r: number; vy: number; z: number; ph: number };

function sprite(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size * 0.42, size * 0.38, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fill();
  return c;
}


export function WaterCanvas({
  aimRef,
  pointerRef,
  onPhase,
}: {
  aimRef: React.MutableRefObject<{ x: number; y: number } | null>;
  pointerRef: React.MutableRefObject<{ x: number; y: number; inside: boolean }>;
  onPhase?: (i: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCb = useRef(onPhase);
  phaseCb.current = onPhase;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const foamSprite = sprite(64, [[0, 'rgba(255,255,255,.96)'], [0.45, 'rgba(247,250,252,.88)'], [0.78, 'rgba(222,233,240,.42)'], [1, 'rgba(222,233,240,0)']]);
    const mistSprite = sprite(64, [[0, 'rgba(235,245,255,.55)'], [1, 'rgba(235,245,255,0)']]);
    const dropSprite = sprite(32, [[0, 'rgba(255,255,255,.95)'], [0.35, 'rgba(210,235,255,.5)'], [1, 'rgba(160,200,230,0)']]);

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const px = (x: number) => (x / 100) * W;
    const py = (y: number) => (y / 100) * H;

    const drops: Drop[] = [];
    const bubbles: Bubble[] = [];
    const ambient: Ambient[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100, r: 2 + Math.random() * 5,
      vy: 1.2 + Math.random() * 2.5, z: Math.random(), ph: Math.random() * 6,
    }));

    let start = performance.now();
    let last = start;
    let raf = 0;
    let running = true;
    let lastPhase = -1;
    let sweep = 0; // foam-phase aim sweep 0..1
    let aimX = 55, aimY = 30;

    const visible = { current: true };
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (visible.current && running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(canvas);

    function phaseAt(t: number) {
      let c = t % CYCLE;
      for (let i = 0; i < PHASE_LEN.length; i++) {
        if (c < PHASE_LEN[i]) return { i, p: c / PHASE_LEN[i] };
        c -= PHASE_LEN[i];
      }
      return { i: 3, p: 1 };
    }

    function emitJet(phase: number, tx: number, ty: number) {
      const spread = phase === 1 ? 4.5 : 2.2;
      const ex = tx + (Math.random() - 0.5) * spread * 2;
      const ey = Math.max(topY(ex) - 0.5, ty + (Math.random() - 0.5) * spread);
      const life = 0.22 + Math.random() * 0.12;
      const sx = NOZZLE.x + (Math.random() - 0.5) * 0.4;
      const sy = NOZZLE.y + (Math.random() - 0.5) * 0.4;
      drops.push({ x: sx, y: sy, vx: (ex - sx) / life, vy: (ey - sy) / life, t: 0, life, s: 0.6 + Math.random() * 0.8, k: phase === 1 ? 3 : 0, tx: ex, ty: ey });
    }

    function impact(d: Drop, phase: number) {
      const n = 2 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        drops.push({
          x: d.tx, y: d.ty, vx: (Math.random() - 0.65) * 22, vy: -8 - Math.random() * 16,
          t: 0, life: 0.5 + Math.random() * 0.5, s: 0.4 + Math.random() * 0.7, k: 1, tx: 0, ty: 0,
        });
      }
      if (Math.random() < 0.08) {
        drops.push({ x: d.tx + (Math.random() - 0.5) * 6, y: d.ty - 1, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 3, t: 0, life: 1 + Math.random(), s: 2 + Math.random() * 2, k: 2, tx: 0, ty: 0 });
      }
      if (phase === 1 && bubbles.length < 1400) {
        // Foam lands and slides a little down the panel
        for (let i = 0; i < 5; i++) {
          const bx = d.tx + (Math.random() - 0.5) * 8;
          const by = Math.max(topY(bx) + 0.6, d.ty + Math.random() * 9);
          bubbles.push({ x: bx, y: Math.min(by, 56), r: 0, R: 0.35 + Math.random() * 0.75, a: 0.9, dying: false });
        }
      } else if (phase === 2) {
        for (const b of bubbles) {
          const dx = b.x - d.tx, dy = (b.y - d.ty) * 1.4;
          if (dx * dx + dy * dy < 40) b.dying = true;
        }
      }
    }

    function frame(now: number) {
      raf = 0;
      if (!visible.current || !running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;
      const { i: phase, p } = phaseAt(t);
      if (phase !== lastPhase) {
        lastPhase = phase;
        phaseCb.current?.(phase);
        if (phase === 0) bubbles.length = 0;
      }

      // ---- Aim: hotspot override > pointer > automatic sweep
      let tx: number, ty: number;
      const ptr = pointerRef.current;
      if (aimRef.current) {
        tx = aimRef.current.x; ty = aimRef.current.y;
      } else if (ptr.inside && ptr.x > 18 && ptr.x < 74) {
        tx = ptr.x; ty = Math.min(Math.max(ptr.y, topY(ptr.x)), 52);
      } else {
        sweep = phase === 1 || phase === 2 ? p : 0.5 + Math.sin(t * 0.9) * 0.18;
        tx = 24 + sweep * 46 + Math.sin(t * 3.1) * 2.5;
        ty = topY(tx) + 2 + Math.sin(t * 2.3) * 3;
      }
      aimX += (tx - aimX) * Math.min(1, dt * 6);
      aimY += (ty - aimY) * Math.min(1, dt * 6);

      const jetOn = phase !== 3;
      if (jetOn) {
        const rate = phase === 1 ? 170 : 230;
        let n = rate * dt;
        while (n > 0) { if (Math.random() < n) emitJet(phase, aimX, aimY); n -= 1; }
      }

      // ---- Update particles
      const g = 60; // % of height per s²
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k];
        d.t += dt;
        if (d.k === 0 || d.k === 3) {
          d.x += d.vx * dt; d.y += d.vy * dt + 0.5 * g * 0.15 * dt * dt;
          if (d.t >= d.life) { impact(d, phase); drops.splice(k, 1); continue; }
        } else if (d.k === 1) {
          d.vy += g * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        } else {
          d.x += d.vx * dt; d.y += d.vy * dt; d.s += dt * 1.5;
        }
        if (d.k !== 0 && d.k !== 3 && d.t >= d.life) drops.splice(k, 1);
      }

      for (let k = bubbles.length - 1; k >= 0; k--) {
        const b = bubbles[k];
        if (b.dying) {
          b.a -= dt * 1.6; b.y += dt * 2.5;
          if (Math.random() < dt * 0.6) drops.push({ x: b.x, y: b.y, vx: 0, vy: 2, t: 0, life: 1.2, s: 0.5, k: 1, tx: 0, ty: 0 });
          if (b.a <= 0) { bubbles.splice(k, 1); continue; }
        } else {
          b.r += (b.R - b.r) * Math.min(1, dt * 5);
          b.y += dt * 0.25; // foam slowly creeps down
          if (phase === 2 && Math.random() < dt * 0.22 * (0.5 + p)) b.dying = true;
          if (phase === 3) b.dying = true;
        }
      }

      // ---- Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const unit = W / 100;

      // Foam
      for (const b of bubbles) {
        const r = b.r * unit;
        ctx.globalAlpha = Math.max(0, b.a);
        ctx.drawImage(foamSprite, px(b.x) - r, py(b.y) - r, r * 2, r * 2);
      }

      // Jet: bright streaks
      ctx.lineCap = 'round';
      for (const d of drops) {
        if (d.k === 0 || d.k === 3) {
          const x = px(d.x), y = py(d.y);
          const len = 0.05;
          ctx.globalAlpha = d.k === 3 ? 0.55 : 0.42;
          ctx.strokeStyle = d.k === 3 ? '#ffffff' : '#dff1ff';
          ctx.lineWidth = d.s * unit * (d.k === 3 ? 0.42 : 0.24) * (0.6 + d.t / d.life);
          ctx.beginPath();
          ctx.moveTo(x - d.vx * len * unit, y - d.vy * len * (H / 100));
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
      // Splash + drips
      for (const d of drops) {
        if (d.k === 1) {
          const r = d.s * unit * 0.45;
          ctx.globalAlpha = Math.max(0, 1 - d.t / d.life);
          ctx.drawImage(dropSprite, px(d.x) - r, py(d.y) - r, r * 2, r * 2);
        } else if (d.k === 2) {
          const r = d.s * unit;
          ctx.globalAlpha = 0.12 * Math.max(0, 1 - d.t / d.life);
          ctx.drawImage(mistSprite, px(d.x) - r, py(d.y) - r, r * 2, r * 2);
        }
      }

      // Nozzle glow while spraying
      if (jetOn) {
        ctx.globalAlpha = 0.35;
        const r = unit * 1.6;
        ctx.drawImage(mistSprite, px(NOZZLE.x) - r, py(NOZZLE.y) - r, r * 2, r * 2);
      }

      // Shine sweep clipped to the body
      if (phase === 3) {
        ctx.save();
        ctx.beginPath();
        BODY.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
        ctx.closePath();
        ctx.clip();
        const bx = px(10 + p * 75);
        const grad = ctx.createLinearGradient(bx - unit * 10, 0, bx + unit * 10, H * 0.4);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,.38)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.sin(p * Math.PI);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
        // glints
        for (let k = 0; k < 4; k++) {
          const gp = (p * 4 + k * 0.37) % 1;
          const [gx, gy] = [[32, 42], [47, 31], [60, 30], [44, 46]][k];
          const s = Math.sin(gp * Math.PI) * unit * 1.6;
          ctx.globalAlpha = Math.sin(gp * Math.PI) * 0.9;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = Math.max(1, unit * 0.12);
          ctx.beginPath();
          ctx.moveTo(px(gx) - s, py(gy)); ctx.lineTo(px(gx) + s, py(gy));
          ctx.moveTo(px(gx), py(gy) - s); ctx.lineTo(px(gx), py(gy) + s);
          ctx.stroke();
        }
      }

      // Floating droplets in front of the lens (parallax with pointer)
      const ox = (ptr.inside ? (ptr.x - 50) / 50 : 0);
      const oy = (ptr.inside ? (ptr.y - 50) / 50 : 0);
      for (const a of ambient) {
        a.y += a.vy * dt * (0.4 + a.z);
        if (a.y > 104) { a.y = -4; a.x = Math.random() * 100; }
        const x = px(a.x) - ox * (6 + a.z * 18);
        const y = py(a.y) - oy * (4 + a.z * 12) + Math.sin(t + a.ph) * 2;
        const r = a.r * (0.6 + a.z);
        ctx.globalAlpha = 0.25 + a.z * 0.35;
        ctx.drawImage(dropSprite, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      phaseCb.current?.(3);
      return () => { ro.disconnect(); io.disconnect(); };
    }

    const onVis = () => {
      running = !document.hidden;
      if (running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener('visibilitychange', onVis);
    start = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [aimRef, pointerRef]);

  return <canvas ref={canvasRef} className="water-canvas" aria-hidden="true" />;
}
