"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface Crystal {
  x: number;
  y: number;
  rotX: number;
  rotY: number;
  vRotX: number;
  vRotY: number;
  floatOffset: number;
  scale: number;
}

// Project a 3-D point onto 2-D screen space
function project(
  x: number, y: number, z: number,
  fov: number, cx: number, cy: number
) {
  const s = fov / (fov + z);
  return { x: cx + x * s, y: cy + y * s, s };
}

// Draw one ETH diamond (octahedron) projected from 3-D
function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  rotY: number, rotX: number,
  alpha: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  // Six vertices of an octahedron in local 3-D space
  const rawVerts: [number, number, number][] = [
    [0, -size, 0],                                                          // top
    [ size * Math.cos(rotY),                  0,  size * Math.sin(rotY)],   // right
    [ size * Math.cos(rotY + 2.094),          0,  size * Math.sin(rotY + 2.094)],
    [ size * Math.cos(rotY + 4.189),          0,  size * Math.sin(rotY + 4.189)],
    [0,  size * 0.75, 0],                                                   // bottom
  ];

  // Apply X rotation, then project
  const fov = 320;
  const verts = rawVerts.map(([vx, vy, vz]) => {
    const ry2 = vy * cosX - vz * sinX;
    const rz2 = vy * sinX + vz * cosX;
    const s   = fov / (fov + rz2 + 250);
    return { px: vx * s, py: ry2 * s, rz: rz2 };
  });

  // Eight triangular faces
  const faces: [number, number, number][] = [
    [0,1,2],[0,2,3],[0,3,1],
    [4,1,2],[4,2,3],[4,3,1],
  ];

  // Brightness palette — whites and light greys
  const brightness = [0.95, 0.65, 0.80, 0.70, 0.90, 0.55];

  faces.forEach(([a, b, c], i) => {
    const pa = verts[a], pb = verts[b], pc = verts[c];

    // Back-face cull
    const cross =
      (pb.px - pa.px) * (pc.py - pa.py) -
      (pb.py - pa.py) * (pc.px - pa.px);
    if (cross < 0) return;

    const br = brightness[i] * alpha;
    ctx.beginPath();
    ctx.moveTo(pa.px, pa.py);
    ctx.lineTo(pb.px, pb.py);
    ctx.lineTo(pc.px, pc.py);
    ctx.closePath();
    ctx.fillStyle   = `rgba(255,255,255,${br * 0.18})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${br * 0.55})`;
    ctx.lineWidth   = 0.6;
    ctx.stroke();
  });

  ctx.restore();
}

export default function EthCrystal3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── particles ────────────────────────────────────────────────────────────
    const mkParticles = (): Particle[] =>
      Array.from({ length: 220 }, () => ({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        vx:      (Math.random() - 0.5) * 0.12,
        vy:      (Math.random() - 0.5) * 0.08,
        size:    Math.random() * 1.2 + 0.2,
        opacity: Math.random() * 0.35 + 0.05,
      }));
    const particles: Particle[] = mkParticles();

    // ── crystals ─────────────────────────────────────────────────────────────
    const crystals: Crystal[] = [
      { x:    0, y:   0, rotX:  0,    rotY: 0,    vRotX: 0.003, vRotY: 0.007, floatOffset: 0,    scale: 52 },
      { x: -175, y: -70, rotX:  0.2,  rotY: 0.5,  vRotX: 0.004, vRotY: 0.011, floatOffset: 1.2,  scale: 26 },
      { x:  180, y:  55, rotX: -0.1,  rotY: 1.0,  vRotX: 0.003, vRotY: 0.009, floatOffset: 2.4,  scale: 20 },
      { x:  115, y:-115, rotX:  0.4,  rotY: 2.0,  vRotX: 0.005, vRotY: 0.014, floatOffset: 0.8,  scale: 15 },
      { x: -140, y: 105, rotX: -0.2,  rotY: 3.0,  vRotX: 0.004, vRotY: 0.010, floatOffset: 3.1,  scale: 18 },
      { x:    5, y:-145, rotX:  0.1,  rotY: 1.5,  vRotX: 0.003, vRotY: 0.013, floatOffset: 1.8,  scale: 12 },
    ];

    // ── mouse parallax ───────────────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left  - r.width  / 2) / r.width;
      my = (e.clientY - r.top   - r.height / 2) / r.height;
    };
    canvas.addEventListener("mousemove", onMouse);

    let t = 0;

    const frame = () => {
      t += 0.016;

      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;

      ctx.clearRect(0, 0, W, H);

      // ── particles ──────────────────────────────────────────────────────────
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > W + 20) p.x = -20;
        if (p.x < -20)    p.x =  W + 20;
        if (p.y > H + 20) p.y = -20;
        if (p.y < -20)    p.y =  H + 20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });

      // ── ambient halo behind main crystal ───────────────────────────────────
      const hx = cx + mx * 18, hy = cy + my * 18 + Math.sin(t * 0.5) * 8;
      const g  = ctx.createRadialGradient(hx, hy, 0, hx, hy, 130);
      g.addColorStop(0,   "rgba(255,255,255,0.06)");
      g.addColorStop(0.6, "rgba(255,255,255,0.02)");
      g.addColorStop(1,   "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(hx - 130, hy - 130, 260, 260);

      // ── orbital ring ───────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(cx + mx * 14, cy + my * 12);
      ctx.rotate(t * 0.25);
      ctx.beginPath();
      const rr = 88 + Math.sin(t * 0.7) * 4;
      for (let i = 0; i <= 360; i += 4) {
        const a = (i * Math.PI) / 180;
        const rx = Math.cos(a) * rr;
        const ry = Math.sin(a) * rr * 0.22; // flatten to ellipse
        i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth   = 0.8;
      ctx.stroke();
      ctx.restore();

      // ── second ring (counter-rotating) ─────────────────────────────────────
      ctx.save();
      ctx.translate(cx + mx * 14, cy + my * 12);
      ctx.rotate(-t * 0.15);
      ctx.beginPath();
      const rr2 = 115 + Math.sin(t * 0.5) * 5;
      for (let i = 0; i <= 360; i += 4) {
        const a = (i * Math.PI) / 180;
        const rx = Math.cos(a) * rr2;
        const ry = Math.sin(a) * rr2 * 0.18;
        i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth   = 0.5;
      ctx.stroke();
      ctx.restore();

      // ── crystals ───────────────────────────────────────────────────────────
      crystals.forEach((c, i) => {
        c.rotY += c.vRotY;
        c.rotX += c.vRotX * Math.sin(t * 0.4);

        const floatY = Math.sin(t * 0.55 + c.floatOffset) * 11;
        const floatX = Math.cos(t * 0.38 + c.floatOffset) * 5;
        const px     = cx + mx * (i === 0 ? 14 : 22 + i * 6) + c.x + floatX;
        const py     = cy + my * (i === 0 ? 10 : 16 + i * 4) + c.y + floatY;

        const alpha  = i === 0 ? 0.95 : 0.55 + Math.sin(t * 0.7 + c.floatOffset) * 0.1;
        drawDiamond(ctx, px, py, c.scale, c.rotY, c.rotX, alpha);
      });

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}
