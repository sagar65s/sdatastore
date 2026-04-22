import React, { useEffect, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';

const CloudBG = memo(() => {
  const { dark } = useAuth();
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    // Clouds
    const makeClouds = () => Array.from({ length: 7 }, (_, i) => ({
      x:     Math.random() * W * 1.5 - W * 0.25,
      y:     Math.random() * H * 0.55 + H * 0.03,
      scale: Math.random() * 0.9 + 0.4,
      speed: Math.random() * 0.18 + 0.06,
      alpha: Math.random() * 0.35 + 0.55,
      puffs: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => ({
        ox: (Math.random() - 0.5) * 120,
        oy: (Math.random() - 0.2) * 30,
        r:  Math.random() * 40 + 25,
      })),
      delay: i * -800,
    }));
    const clouds = makeClouds();

    // Birds (V-shape flocks)
    const makeBirds = () => Array.from({ length: 4 }, (_, i) => ({
      x:     -Math.random() * W * 0.3 - 100,
      y:     Math.random() * H * 0.35 + H * 0.05,
      speed: Math.random() * 0.6 + 0.3,
      scale: Math.random() * 0.5 + 0.5,
      count: Math.floor(Math.random() * 5) + 3,
      alpha: Math.random() * 0.4 + 0.45,
      wOff:  0,
      delay: i * -3000,
    }));
    const birds = makeBirds();

    // Sun position
    const sun = { x: W * 0.78, y: H * 0.12, r: 52, rayRot: 0 };

    // Sparkles
    const sparkles = Array.from({ length: 20 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      r: Math.random() * 2.5 + 0.5,
      ph: Math.random() * Math.PI * 2,
      ps: Math.random() * 0.03 + 0.01,
      col: ['rgba(255,255,255,0.9)', 'rgba(255,240,150,0.8)', 'rgba(200,230,255,0.85)'][Math.floor(Math.random() * 3)],
    }));

    let frameMs = 0;

    const drawCloud = (cx, cy, puffs, scale, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(200,230,255,0.4)';
      ctx.shadowBlur = 18;
      puffs.forEach(p => {
        const px = cx + p.ox * scale;
        const py = cy + p.oy * scale;
        const pr = p.r * scale;
        const g = ctx.createRadialGradient(px, py - pr * 0.2, pr * 0.1, px, py, pr);
        g.addColorStop(0, 'rgba(255,255,255,0.98)');
        g.addColorStop(0.5, 'rgba(245,252,255,0.92)');
        g.addColorStop(1, 'rgba(210,235,255,0.15)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    };

    const drawBirdWing = (bx, by, wingPhase, s) => {
      // Single bird: two arcs for wings
      const wh = Math.sin(wingPhase) * 6 * s;
      ctx.beginPath();
      // Left wing
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - 9*s, by - wh, bx - 16*s, by + 2*s);
      // Right wing
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 9*s, by - wh, bx + 16*s, by + 2*s);
      ctx.strokeStyle = 'rgba(30,60,120,0.75)';
      ctx.lineWidth = Math.max(0.8, 1.4 * s);
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const draw = (ts) => {
      const t = ts * 0.001;
      frameMs += 16;
      ctx.clearRect(0, 0, W, H);

      // Sky is CSS background — canvas is transparent

      // Sun
      sun.rayRot = t * 0.08;

      // Sun outer glow
      ctx.save();
      const sg1 = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.5, sun.x, sun.y, sun.r * 5.5);
      sg1.addColorStop(0, 'rgba(255,230,80,0.22)');
      sg1.addColorStop(0.4, 'rgba(255,200,40,0.10)');
      sg1.addColorStop(1, 'transparent');
      ctx.fillStyle = sg1;
      ctx.beginPath(); ctx.arc(sun.x, sun.y, sun.r * 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Sun rays
      ctx.save();
      ctx.translate(sun.x, sun.y);
      ctx.rotate(sun.rayRot);
      ctx.globalAlpha = 0.28 + Math.sin(t * 0.5) * 0.06;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r1 = sun.r * 1.25, r2 = sun.r * (1.8 + (i % 2) * 0.5);
        ctx.strokeStyle = `rgba(255,${200 + i * 3},40,0.6)`;
        ctx.lineWidth = i % 2 === 0 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // Sun body
      ctx.save();
      const sunB = ctx.createRadialGradient(sun.x - sun.r * 0.25, sun.y - sun.r * 0.25, sun.r * 0.1, sun.x, sun.y, sun.r);
      sunB.addColorStop(0, '#fffbe0');
      sunB.addColorStop(0.4, '#ffe066');
      sunB.addColorStop(0.85, '#ffb800');
      sunB.addColorStop(1, '#ff9200');
      ctx.fillStyle = sunB;
      ctx.beginPath(); ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); ctx.fill();
      // Sun rim
      ctx.strokeStyle = 'rgba(255,200,0,0.4)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();

      // Clouds
      clouds.forEach(cl => {
        cl.x += cl.speed;
        if (cl.x > W + 300) {
          cl.x = -300;
          cl.y = Math.random() * H * 0.55 + H * 0.03;
          cl.alpha = Math.random() * 0.35 + 0.55;
        }
        drawCloud(cl.x, cl.y, cl.puffs, cl.scale, cl.alpha);
      });

      // Birds
      birds.forEach(b => {
        b.x += b.speed;
        b.wOff += 0.12;
        if (b.x > W + 200) {
          b.x = -150;
          b.y = Math.random() * H * 0.35 + H * 0.05;
        }
        ctx.save();
        ctx.globalAlpha = b.alpha;
        // Draw V formation
        for (let i = 0; i < b.count; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const row  = Math.floor(i / 2);
          const bx = b.x + side * row * 22 * b.scale;
          const by = b.y + row * 10 * b.scale;
          const wph = b.wOff + i * 0.4;
          drawBirdWing(bx, by, wph, b.scale * 0.9);
        }
        ctx.restore();
      });

      // Sparkles (light reflections)
      sparkles.forEach(sp => {
        sp.ph += sp.ps;
        const a = (Math.sin(sp.ph) + 1) * 0.5 * 0.7;
        if (a > 0.1) {
          ctx.save();
          ctx.globalAlpha = a;
          const sg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r * 3);
          sg.addColorStop(0, sp.col); sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r * 3, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });

      // Light rays from sun (god rays)
      ctx.save();
      ctx.globalAlpha = 0.04 + Math.sin(t * 0.3) * 0.015;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * (Math.PI * 0.7) + Math.PI * 0.65;
        const rayW = (Math.PI * 0.7) / 6 * 0.5;
        const g = ctx.createLinearGradient(
          sun.x, sun.y,
          sun.x + Math.cos(ang) * W * 1.2,
          sun.y + Math.sin(ang) * H * 1.2
        );
        g.addColorStop(0, 'rgba(255,230,80,0.5)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sun.x, sun.y);
        ctx.arc(sun.x, sun.y, W * 1.5, ang - rayW, ang + rayW);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      sun.x = W * 0.78; sun.y = H * 0.12;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0, 0, W, H);
    };
  }, [dark]);

  return (
    <canvas ref={canvasRef} id="cloud-canvas"
      style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', display:'block', opacity:dark?0:1, transition:'opacity 0.8s ease' }}
    />
  );
});

export default CloudBG;
