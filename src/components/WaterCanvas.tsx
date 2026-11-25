import { useEffect, useRef } from 'react';

/**
 * Real-time water / foam / shine simulation drawn over the hero photograph.
 * All geometry is in percentages of the hero image (800x533 promo-red-car.webp),
 * so it stays locked to the photo at every size.
 *
 * Cycle: 0 pre-wash jet → 1 tri-colour foam builds on the body → 2 rinse dissolves it
 * into running streaks → 3 neon shine sweep.
 * Colours come from the wash palette (--w1..--w4 in index.css).
 */

export const PHASES = ['Pre-wash', 'Foam wash', 'High-pressure rinse', 'Final shine'] as const;
const PHASE_LEN = [3.2, 4.6, 4.4, 3.4];
const CYCLE = PHASE_LEN.reduce((a, b) => a + b, 0);

// #16C47F  #FFD65A  #FF9D23  #F93827
const PALETTE: [number, number, number][] = [[22, 196, 127], [255, 214, 90], [255, 157, 35], [249, 56, 39]];
const WATER: [number, number, number] = [200, 245, 225];
const rgba = ([r, g, b]: [number, number, number], a: number) => `rgba(${r},${g},${b},${a})`;
function mix(t: number): [number, number, number] {
  const s = Math.max(0, Math.min(0.9999, t)) * (PALETTE.length - 1);
  const i = Math.floor(s), f = s - i;
  const [a, b] = [PALETTE[i], PALETTE[i + 1]];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f].map(Math.round) as [number, number, number];
}

const NOZZLE = { x: 61.2, y: 17.2 };
// Upper outline of the car body, left → right (x%, y%)
const TOP: [number, number][] = [
  [20, 43], [26, 39.5], [33, 37], [40, 34], [45, 30], [50, 28], [56, 27.2], [62, 28], [68, 30], [72.5, 33],
];
// Closed body silhouette for clipping the shine sweep
const BODY: [number, number][] = [
  ...TOP, [73, 45], [72, 56], [60, 58.5], [48, 60.5], [32, 60], [21, 58.5], [19.5, 50],
];
const BOTTOM = 57;

function topY(x: number) {
  if (x <= TOP[0][0]) return TOP[0][1];
  for (let i = 1; i < TOP.length; i++) {
    const [x1, y1] = TOP[i];
    const [x0, y0] = TOP[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return TOP[TOP.length - 1][1];
}

type Drop = { x: number; y: number; vx: number; vy: number; t: number; life: number; s: number; k: 0 | 1 | 2 | 3; tx: number; ty: number; c: number };
type Bubble = { x: number; y: number; r: number; R: number; a: number; dying: boolean; c: number };
type Streak = { x: number; y: number; vy: number; len: number; a: number; c: number };
type Ambient = { x: number; y: number; r: number; vy: number; z: number; ph: number; c: number };

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

    // One foam sprite per palette colour: white soapy core, coloured body, soft rim.
    const foamSprites = PALETTE.map((c) =>
      sprite(64, [[0, 'rgba(255,255,255,.97)'], [0.28, rgba(c.map((v) => Math.round(v + (255 - v) * 0.55)) as [number, number, number], 0.95)], [0.62, rgba(c, 0.85)], [0.86, rgba(c, 0.35)], [1, rgba(c, 0)]]),
    );
    const glowSprites = PALETTE.map((c) => sprite(64, [[0, rgba(c, 0.9)], [0.4, rgba(c, 0.35)], [1, rgba(c, 0)]]));
    const mistSprite = sprite(64, [[0, 'rgba(210,245,255,.55)'], [1, 'rgba(210,245,255,0)']]);
    const dropSprite = sprite(32, [[0, 'rgba(255,255,255,.95)'], [0.35, 'rgba(170,240,210,.6)'], [1, 'rgba(22,196,127,0)']]);

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
    const streaks: Streak[] = [];
    const ambient: Ambient[] = Array.from({ length: 18 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100, r: 2 + Math.random() * 5,
      vy: 1.2 + Math.random() * 2.5, z: Math.random(), ph: Math.random() * 6, c: (Math.random() * 4) | 0,
    }));

    let start = performance.now();
    let last = start;
    let raf = 0;
    let running = true;
    let lastPhase = -1;
    let aimX = 55, aimY = 30;
    let hitGlow = 0;

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

    // Foam colour bands run along the car: purple at the nose → aqua at the tail.
    const bandAt = (x: number) => Math.max(0, Math.min(3, Math.floor(((x - 20) / 53) * 4 + (Math.random() - 0.5) * 0.9)));

    function emitJet(phase: number, tx: number, ty: number) {
      const spread = phase === 1 ? 4.5 : 2.2;
      const ex = tx + (Math.random() - 0.5) * spread * 2;
      const ey = Math.max(topY(ex) - 0.5, ty + (Math.random() - 0.5) * spread);
      const life = 0.22 + Math.random() * 0.12;
      const sx = NOZZLE.x + (Math.random() - 0.5) * 0.4;
      const sy = NOZZLE.y + (Math.random() - 0.5) * 0.4;
      drops.push({ x: sx, y: sy, vx: (ex - sx) / life, vy: (ey - sy) / life, t: 0, life, s: 0.6 + Math.random() * 0.8, k: phase === 1 ? 3 : 0, tx: ex, ty: ey, c: bandAt(ex) });
    }

    function impact(d: Drop, phase: number) {
      hitGlow = Math.min(1, hitGlow + 0.08);
      const n = 2 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        drops.push({
          x: d.tx, y: d.ty, vx: (Math.random() - 0.65) * 22, vy: -8 - Math.random() * 16,
          t: 0, life: 0.5 + Math.random() * 0.5, s: 0.4 + Math.random() * 0.7, k: 1, tx: 0, ty: 0, c: d.c,
        });
      }
      if (Math.random() < 0.08) {
        drops.push({ x: d.tx + (Math.random() - 0.5) * 6, y: d.ty - 1, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 3, t: 0, life: 1 + Math.random(), s: 2 + Math.random() * 2, k: 2, tx: 0, ty: 0, c: 0 });
      }
      if (phase === 1 && bubbles.length < 1500) {
        // Foam lands and slides a little down the panel
        for (let i = 0; i < 5; i++) {
          const bx = d.tx + (Math.random() - 0.5) * 8;
          const by = Math.max(topY(bx) + 0.6, d.ty + Math.random() * 9);
          bubbles.push({ x: bx, y: Math.min(by, BOTTOM - 1), r: 0, R: 0.4 + Math.random() * 0.8, a: 0.95, dying: false, c: bandAt(bx) });
        }
      } else if (phase === 2) {
        for (const b of bubbles) {
          const dx = b.x - d.tx, dy = (b.y - d.ty) * 1.4;
          if (dx * dx + dy * dy < 40) b.dying = true;
        }
      }
    }

    function bodyPath() {
      ctx.beginPath();
      BODY.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
      ctx.closePath();
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
        if (phase === 0) { bubbles.length = 0; streaks.length = 0; }
      }

      // ---- Aim: hotspot override > pointer > automatic sweep
      let tx: number, ty: number;
      const ptr = pointerRef.current;
      if (aimRef.current) {
        tx = aimRef.current.x; ty = aimRef.current.y;
      } else if (ptr.inside && ptr.x > 18 && ptr.x < 74) {
        tx = ptr.x; ty = Math.min(Math.max(ptr.y, topY(ptr.x)), 52);
      } else {
        const sweep = phase === 1 || phase === 2 ? p : 0.5 + Math.sin(t * 0.9) * 0.18;
        tx = 24 + sweep * 46 + Math.sin(t * 3.1) * 2.5;
        ty = topY(tx) + 2 + Math.sin(t * 2.3) * 3;
      }
      aimX += (tx - aimX) * Math.min(1, dt * 6);
      aimY += (ty - aimY) * Math.min(1, dt * 6);

      const jetOn = phase !== 3;
      if (jetOn) {
        const rate = phase === 1 ? 190 : 240;
        let n = rate * dt;
        while (n > 0) { if (Math.random() < n) emitJet(phase, aimX, aimY); n -= 1; }
      }
      hitGlow *= Math.pow(0.04, dt);

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
          // Dissolving foam leaves a coloured streak running down the paint
          if (streaks.length < 160 && Math.random() < dt * 1.4) {
            streaks.push({ x: b.x, y: b.y, vy: 3 + Math.random() * 4, len: 1.5 + Math.random() * 3, a: 0.9, c: b.c });
          }
          if (b.a <= 0) { bubbles.splice(k, 1); continue; }
        } else {
          b.r += (b.R - b.r) * Math.min(1, dt * 5);
          b.y += dt * 0.25; // foam slowly creeps down
          if (phase === 2 && Math.random() < dt * 0.22 * (0.5 + p)) b.dying = true;
          if (phase === 3) b.dying = true;
        }
      }
      for (let k = streaks.length - 1; k >= 0; k--) {
        const s = streaks[k];
        s.vy += dt * 6; s.y += s.vy * dt;
        if (s.y > BOTTOM) s.a -= dt * 3; else s.a -= dt * 0.35;
        if (s.a <= 0) streaks.splice(k, 1);
      }

      // ---- Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const unit = W / 100;
      const cycleCol = mix((Math.sin(t * 0.6) + 1) / 2);

      // Neon reflection on the wet floor under the car
      ctx.globalCompositeOperation = 'lighter';
      {
        const cx = px(46), cy = py(64), rx = unit * 32, ry = unit * 5.5;
        const pulse = 0.55 + Math.sin(t * 2) * 0.12 + (phase === 3 ? Math.sin(p * Math.PI) * 0.35 : 0);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        grad.addColorStop(0, rgba(cycleCol, 0.5 * pulse));
        grad.addColorStop(0.5, rgba(PALETTE[0], 0.2 * pulse));
        grad.addColorStop(1, rgba(PALETTE[0], 0));
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Rinse streaks
      ctx.lineCap = 'round';
      for (const s of streaks) {
        const x = px(s.x), y = py(s.y);
        const grad = ctx.createLinearGradient(x, y - s.len * unit, x, y);
        grad.addColorStop(0, rgba(PALETTE[s.c], 0));
        grad.addColorStop(1, rgba(PALETTE[s.c], 0.85));
        ctx.globalAlpha = Math.max(0, s.a);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1, unit * 0.22);
        ctx.beginPath(); ctx.moveTo(x, y - s.len * unit); ctx.lineTo(x, y); ctx.stroke();
      }

      // Tri-colour foam
      for (const b of bubbles) {
        const r = b.r * unit;
        ctx.globalAlpha = Math.max(0, b.a);
        ctx.drawImage(foamSprites[b.c], px(b.x) - r, py(b.y) - r, r * 2, r * 2);
      }

      // Jet: glowing core beam from nozzle to aim, then particle streaks on top
      ctx.globalCompositeOperation = 'lighter';
      if (jetOn) {
        const nx = px(NOZZLE.x), ny = py(NOZZLE.y), ax = px(aimX), ay = py(aimY);
        const jetCol = phase === 1 ? mix((aimX - 20) / 53) : WATER;
        const flick = 0.85 + Math.random() * 0.15;
        for (const [w, a] of [[unit * 1.6, 0.12], [unit * 0.7, 0.28], [unit * 0.22, 0.85]] as const) {
          const grad = ctx.createLinearGradient(nx, ny, ax, ay);
          grad.addColorStop(0, `rgba(255,255,255,${a})`);
          grad.addColorStop(0.35, rgba(jetCol, a));
          grad.addColorStop(1, rgba(jetCol, a * 0.4));
          ctx.globalAlpha = flick;
          ctx.strokeStyle = grad;
          ctx.lineWidth = w;
          ctx.beginPath(); ctx.moveTo(nx, ny); ctx.quadraticCurveTo((nx + ax) / 2, (ny + ay) / 2 - unit, ax, ay); ctx.stroke();
        }
        // Impact bloom
        const r = unit * (3 + hitGlow * 4);
        ctx.globalAlpha = 0.5 + hitGlow * 0.5;
        ctx.drawImage(glowSprites[phase === 1 ? bandAt(aimX) : 0], ax - r, ay - r, r * 2, r * 2);
        // Nozzle flare
        const nr = unit * 2.2;
        ctx.globalAlpha = 0.7;
        ctx.drawImage(glowSprites[1], nx - nr, ny - nr, nr * 2, nr * 2);
      }
      for (const d of drops) {
        if (d.k === 0 || d.k === 3) {
          const x = px(d.x), y = py(d.y);
          const len = 0.05;
          ctx.globalAlpha = d.k === 3 ? 0.6 : 0.5;
          ctx.strokeStyle = d.k === 3 ? rgba(PALETTE[d.c], 1) : rgba(WATER, 1);
          ctx.lineWidth = d.s * unit * (d.k === 3 ? 0.42 : 0.24) * (0.6 + d.t / d.life);
          ctx.beginPath();
          ctx.moveTo(x - d.vx * len * unit, y - d.vy * len * (H / 100));
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Splash + mist
      for (const d of drops) {
        if (d.k === 1) {
          const r = d.s * unit * 0.45;
          ctx.globalAlpha = Math.max(0, 1 - d.t / d.life);
          ctx.drawImage(dropSprite, px(d.x) - r, py(d.y) - r, r * 2, r * 2);
        } else if (d.k === 2) {
          const r = d.s * unit;
          ctx.globalAlpha = 0.14 * Math.max(0, 1 - d.t / d.life);
          ctx.drawImage(mistSprite, px(d.x) - r, py(d.y) - r, r * 2, r * 2);
        }
      }

      // Final shine: a palette-coloured light band sweeps across the body, then a white highlight
      if (phase === 3) {
        const env = Math.sin(p * Math.PI);
        ctx.save();
        bodyPath();
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        const bx = px(5 + p * 85);
        const band = ctx.createLinearGradient(bx - unit * 16, 0, bx + unit * 16, H * 0.25);
        band.addColorStop(0, rgba(PALETTE[0], 0));
        band.addColorStop(0.25, rgba(PALETTE[0], 0.45));
        band.addColorStop(0.45, rgba(PALETTE[1], 0.5));
        band.addColorStop(0.6, rgba(PALETTE[2], 0.55));
        band.addColorStop(0.75, rgba(PALETTE[3], 0.45));
        band.addColorStop(1, rgba(PALETTE[3], 0));
        ctx.globalAlpha = env;
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, W, H);
        const hx = bx + unit * 4;
        const hi = ctx.createLinearGradient(hx - unit * 2.5, 0, hx + unit * 2.5, H * 0.25);
        hi.addColorStop(0, 'rgba(255,255,255,0)');
        hi.addColorStop(0.5, 'rgba(255,255,255,.55)');
        hi.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hi;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // Neon rim light tracing the roofline
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = env;
        const rim = ctx.createLinearGradient(px(20), 0, px(73), 0);
        PALETTE.forEach((c, i) => rim.addColorStop(i / 3, rgba(c, 0.9)));
        ctx.strokeStyle = rim;
        ctx.shadowColor = rgba(PALETTE[1], 0.9);
        ctx.shadowBlur = unit * 2;
        ctx.lineWidth = Math.max(1.5, unit * 0.25);
        ctx.lineJoin = 'round';
        const upto = Math.min(TOP.length, Math.ceil(p * 1.6 * TOP.length));
        ctx.beginPath();
        TOP.slice(0, upto).forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
        ctx.stroke();
        ctx.restore();

        // Sparkle glints
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 6; k++) {
          const gp = (p * 4 + k * 0.29) % 1;
          const [gx, gy] = [[32, 42], [47, 31], [60, 30], [44, 46], [26, 47], [67, 38]][k];
          const s = Math.sin(gp * Math.PI) * unit * 2;
          ctx.globalAlpha = Math.sin(gp * Math.PI);
          ctx.strokeStyle = '#fff';
          ctx.shadowColor = rgba(PALETTE[k % 4], 1);
          ctx.shadowBlur = unit * 1.2;
          ctx.lineWidth = Math.max(1, unit * 0.14);
          ctx.beginPath();
          ctx.moveTo(px(gx) - s, py(gy)); ctx.lineTo(px(gx) + s, py(gy));
          ctx.moveTo(px(gx), py(gy) - s); ctx.lineTo(px(gx), py(gy) + s);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Floating coloured bokeh droplets in front of the lens (parallax with pointer)
      const ox = ptr.inside ? (ptr.x - 50) / 50 : 0;
      const oy = ptr.inside ? (ptr.y - 50) / 50 : 0;
      ctx.globalCompositeOperation = 'lighter';
      for (const a of ambient) {
        a.y += a.vy * dt * (0.4 + a.z);
        if (a.y > 104) { a.y = -4; a.x = Math.random() * 100; }
        const x = px(a.x) - ox * (6 + a.z * 18);
        const y = py(a.y) - oy * (4 + a.z * 12) + Math.sin(t + a.ph) * 2;
        const r = a.r * (0.6 + a.z) * 1.4;
        ctx.globalAlpha = 0.18 + a.z * 0.3;
        ctx.drawImage(glowSprites[a.c], x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
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
