"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
}

interface Crystal {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  floatOffset: number;
  scale: number;
  color: string;
}

function project3D(
  x: number,
  y: number,
  z: number,
  fov: number,
  cx: number,
  cy: number
) {
  const scale = fov / (fov + z);
  return { x: cx + x * scale, y: cy + y * scale, scale };
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotY: number,
  rotX: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  // ETH diamond: 6 faces of an octahedron projected
  const vertices = [
    [0, -size, 0],    // top
    [size * cosY, 0, size * sinY],   // right
    [size * Math.cos(rotY + Math.PI * 2/3), 0, size * Math.sin(rotY + Math.PI * 2/3)], // left
    [size * Math.cos(rotY + Math.PI * 4/3), 0, size * Math.sin(rotY + Math.PI * 4/3)], // back
    [0, size * 0.8, 0],  // bottom
  ];

  // Project vertices
  const fov = 300;
  const projected = vertices.map(([vx, vy, vz]) => {
    const ry = vy * cosX - vz * sinX;
    const rz = vy * sinX + vz * cosX;
    const s = fov / (fov + rz + 200);
    return { px: vx * s, py: ry * s };
  });

  // Draw faces
  const faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 1],
    [4, 1, 2],
    [4, 2, 3],
    [4, 3, 1],
  ];

  const gradColors = [
    `rgba(98, 126, 234, ${alpha * 0.9})`,
    `rgba(61, 90, 254, ${alpha * 0.7})`,
    `rgba(167, 139, 250, ${alpha * 0.8})`,
    `rgba(98, 126, 234, ${alpha * 0.6})`,
    `rgba(61, 90, 254, ${alpha * 0.85})`,
    `rgba(138, 159, 255, ${alpha * 0.65})`,
  ];

  faces.forEach(([a, b, c], i) => {
    const pa = projected[a];
    const pb = projected[b];
    const pc = projected[c];

    // Back-face culling
    const cross =
      (pb.px - pa.px) * (pc.py - pa.py) -
      (pb.py - pa.py) * (pc.px - pa.px);
    if (cross < 0) return;

    ctx.beginPath();
    ctx.moveTo(pa.px, pa.py);
    ctx.lineTo(pb.px, pb.py);
    ctx.lineTo(pc.px, pc.py);
    ctx.closePath();
    ctx.fillStyle = gradColors[i];
    ctx.fill();
    ctx.strokeStyle = `rgba(138, 159, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  ctx.restore();
}

export default function EthCrystal3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    const particles: Particle[] = Array.from({ length: 250 }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 2,
      y: (Math.random() - 0.5) * canvas.height * 2,
      z: Math.random() * 500,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      vz: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.1,
    }));

    // Crystals
    const crystals: Crystal[] = [
      { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, vRotX: 0.003, vRotY: 0.008, floatOffset: 0, scale: 55, color: "#627EEA" },
      { x: -180, y: -80, z: -100, rotX: 0.2, rotY: 0.5, rotZ: 0, vRotX: 0.004, vRotY: 0.012, floatOffset: 1.2, scale: 28, color: "#A78BFA" },
      { x: 180, y: 60, z: -150, rotX: -0.1, rotY: 1.0, rotZ: 0, vRotX: 0.003, vRotY: 0.009, floatOffset: 2.4, scale: 22, color: "#627EEA" },
      { x: 120, y: -120, z: -80, rotX: 0.4, rotY: 2.0, rotZ: 0, vRotX: 0.005, vRotY: 0.015, floatOffset: 0.8, scale: 16, color: "#3D5AFE" },
      { x: -140, y: 110, z: -60, rotX: -0.2, rotY: 3.0, rotZ: 0, vRotX: 0.004, vRotY: 0.011, floatOffset: 3.1, scale: 20, color: "#8A9FFF" },
    ];

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
    };
    canvas.addEventListener("mousemove", handleMouse);

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw star particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > canvas.width) p.x = -50;
        if (p.x < -50) p.x = canvas.width;
        if (p.y > canvas.height) p.y = -50;
        if (p.y < -50) p.y = canvas.height;

        const fov = 400;
        const proj = project3D(p.x - cx, p.y - cy, p.z - 200, fov, cx, cy);
        if (proj.scale <= 0) return;

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(98, 126, 234, ${p.opacity * proj.scale})`;
        ctx.fill();
      });

      // Draw ambient glow behind main crystal
      const glowX = cx + mouseX * 20;
      const glowY = cy + mouseY * 20 + Math.sin(t * 0.5) * 10;
      const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 120);
      grad.addColorStop(0, "rgba(98, 126, 234, 0.12)");
      grad.addColorStop(0.5, "rgba(61, 90, 254, 0.05)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(glowX - 120, glowY - 120, 240, 240);

      // Draw orbital ring
      ctx.save();
      ctx.translate(cx + mouseX * 15, cy + mouseY * 15);
      ctx.rotate(t * 0.3);
      ctx.beginPath();
      const ringRad = 90 + Math.sin(t * 0.8) * 5;
      for (let i = 0; i <= 360; i += 5) {
        const angle = (i * Math.PI) / 180;
        const rx = Math.cos(angle) * ringRad;
        const ry = Math.sin(angle) * ringRad * 0.25;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(98, 126, 234, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Draw crystals
      crystals.forEach((c, i) => {
        c.rotY += c.vRotY;
        c.rotX += c.vRotX * Math.sin(t * 0.5);

        const floatY = Math.sin(t * 0.6 + c.floatOffset) * 12;
        const floatX = Math.cos(t * 0.4 + c.floatOffset) * 6;

        const parallaxX = mouseX * (i === 0 ? 15 : 25 + i * 5);
        const parallaxY = mouseY * (i === 0 ? 10 : 18 + i * 4);

        const screenX = cx + c.x + floatX + parallaxX;
        const screenY = cy + c.y + floatY + parallaxY;

        const alpha = i === 0 ? 0.92 : 0.6 + Math.sin(t * 0.8 + c.floatOffset) * 0.1;

        drawDiamond(ctx, screenX, screenY, c.scale, c.rotY, c.rotX, c.color, alpha);
      });

      // Subtle scanline effect
      const scanlineGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      for (let y = 0; y < canvas.height; y += 4) {
        scanlineGrad.addColorStop(y / canvas.height, "rgba(0,0,0,0.015)");
        if (y + 2 < canvas.height) {
          scanlineGrad.addColorStop((y + 2) / canvas.height, "rgba(0,0,0,0)");
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}
