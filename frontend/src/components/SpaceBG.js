import React, { useEffect, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';

const SpaceBG = memo(() => {
  const { dark } = useAuth();
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    // Stars
    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.9+0.2,
      a: Math.random()*0.7+0.2,
      s: Math.random()*0.005+0.001,
      ph: Math.random()*Math.PI*2,
      col: ['#eaf4ff','#c0d8ff','#d0f0ff','#ffffff','#ffe8c0'][Math.floor(Math.random()*5)],
    }));

    // Moon
    const moon = { x: W*0.82, y: H*0.14, r: 46 };

    // Nebulas
    const nebulas = [
      { cx:W*.12, cy:H*.20, rx:280, ry:200, col:'rgba(40,0,120,0.10)', ang:-0.2 },
      { cx:W*.85, cy:H*.72, rx:320, ry:220, col:'rgba(0,100,200,0.09)', ang:0.3  },
      { cx:W*.50, cy:H*.48, rx:400, ry:260, col:'rgba(0,180,140,0.06)', ang:0.0  },
      { cx:W*.68, cy:H*.10, rx:200, ry:130, col:'rgba(100,0,200,0.08)', ang:-0.1 },
    ];

    // Shooting stars
    const shoots = Array.from({ length: 5 }, (_, i) => ({
      x:0, y:0, prog:0, speed:Math.random()*8+10,
      len:Math.random()*130+70, active:false,
      nextAt: i*3500+Math.random()*4000,
    }));

    // Meteors
    const meteors = Array.from({ length: 2 }, (_, i) => ({
      x:0, y:0, prog:0, speed:Math.random()*3+2,
      len:Math.random()*200+150, active:false, trail:[],
      nextAt: i*12000+Math.random()*8000+6000,
    }));

    // Floating particles
    const particles = Array.from({ length: 28 }, () => ({
      x:Math.random()*W, y:Math.random()*H,
      r:Math.random()*2.5+0.5,
      vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28,
      a:Math.random()*.4+.1,
      col:Math.random()>.5?'#00f5d4':'#ffd166',
      ph:Math.random()*Math.PI*2, ps:Math.random()*.02+.01,
    }));

    let frameMs = 0;

    const draw = (ts) => {
      const t = ts * .001;
      frameMs += 16;
      ctx.clearRect(0, 0, W, H);

      // Deep space bg
      const bgG = ctx.createRadialGradient(W*.5, H*.5, 0, W*.5, H*.5, Math.max(W,H)*.85);
      bgG.addColorStop(0, '#050a1e');
      bgG.addColorStop(.5, '#020510');
      bgG.addColorStop(1, '#010208');
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

      // Nebulas
      nebulas.forEach(n => {
        const p = 1 + Math.sin(t*.25+n.cx*.001)*.06;
        ctx.save(); ctx.translate(n.cx, n.cy); ctx.rotate(n.ang);
        const g = ctx.createRadialGradient(0,0,0,0,0,n.rx*p);
        g.addColorStop(0, n.col); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.scale(1, n.ry/n.rx);
        ctx.beginPath(); ctx.arc(0,0,n.rx*p,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Stars with twinkle
      stars.forEach(s => {
        const tw = s.a + Math.sin(t*s.s*8+s.ph)*.22;
        ctx.save(); ctx.globalAlpha = Math.max(.04, Math.min(1,tw));
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=s.col; ctx.fill();
        if (s.r > 1.2) {
          ctx.globalAlpha = tw*.2;
          const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*3.5);
          g.addColorStop(0,s.col); g.addColorStop(1,'transparent');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3.5,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      // Galaxy spiral (top-right)
      ctx.save(); ctx.globalAlpha=.058;
      for (let i=0; i<200; i++) {
        const ang=i*.13+t*.035, rad=i*.8;
        ctx.beginPath();
        ctx.arc(W*.8+Math.cos(ang)*rad, H*.13+Math.sin(ang)*rad*.5, Math.max(.15,1.5-i*.006),0,Math.PI*2);
        ctx.fillStyle=i<60?'#ffd166':'#c8d8ff'; ctx.fill();
      }
      ctx.restore();

      // Moon — floating
      const moonFloat = Math.sin(t*.4)*8;
      const mx = moon.x, my = moon.y + moonFloat;
      const mr = moon.r;

      // Moon glow aura
      ctx.save();
      const mga = ctx.createRadialGradient(mx,my,mr*.3,mx,my,mr*5);
      mga.addColorStop(0,'rgba(180,200,255,0.16)');
      mga.addColorStop(.4,'rgba(140,170,255,0.07)');
      mga.addColorStop(1,'transparent');
      ctx.fillStyle=mga; ctx.beginPath(); ctx.arc(mx,my,mr*5,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // Moon body
      ctx.save();
      ctx.beginPath(); ctx.arc(mx,my,mr,0,Math.PI*2);
      const ms=ctx.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);
      ms.addColorStop(0,'#f2f2ff'); ms.addColorStop(.5,'#d8e0f8'); ms.addColorStop(1,'#b0c0e8');
      ctx.fillStyle=ms; ctx.fill();
      // Moon edge glow
      ctx.strokeStyle='rgba(180,200,255,0.35)'; ctx.lineWidth=2; ctx.stroke();
      // Craters
      [[-14,-8,7],[10,12,5],[-6,16,4],[18,-14,6],[-20,6,4]].forEach(([ox,oy,cr]) => {
        const crx=mx+ox, cry=my+oy;
        ctx.beginPath(); ctx.arc(crx,cry,cr,0,Math.PI*2);
        const cg=ctx.createRadialGradient(crx-cr*.3,cry-cr*.3,0,crx,cry,cr);
        cg.addColorStop(0,'rgba(160,180,220,0.45)'); cg.addColorStop(1,'rgba(100,130,180,0.12)');
        ctx.fillStyle=cg; ctx.fill();
      });
      ctx.restore();

      // Shooting stars
      shoots.forEach(sh => {
        if (frameMs>sh.nextAt && !sh.active) {
          sh.active=true; sh.x=Math.random()*W*.55+W*.1; sh.y=Math.random()*H*.3; sh.prog=0;
          sh.nextAt=frameMs+4000+Math.random()*8000;
        }
        if (sh.active) {
          sh.prog+=sh.speed;
          const dx=sh.prog, dy=sh.prog*.48;
          const al=sh.prog<sh.len*.3?sh.prog/(sh.len*.3):1-(sh.prog-sh.len*.3)/(sh.len*.7);
          if (al>0) {
            const gr=ctx.createLinearGradient(sh.x+dx-sh.len*.35,sh.y+dy-sh.len*.17,sh.x+dx,sh.y+dy);
            gr.addColorStop(0,'transparent'); gr.addColorStop(.6,`rgba(200,240,255,${al*.5})`); gr.addColorStop(1,`rgba(255,255,255,${al*.9})`);
            ctx.save(); ctx.globalAlpha=al; ctx.strokeStyle=gr; ctx.lineWidth=2; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(sh.x+dx-sh.len*.35,sh.y+dy-sh.len*.17); ctx.lineTo(sh.x+dx,sh.y+dy); ctx.stroke();
            ctx.globalAlpha=al*.85;
            const sg=ctx.createRadialGradient(sh.x+dx,sh.y+dy,0,sh.x+dx,sh.y+dy,7);
            sg.addColorStop(0,'rgba(255,255,255,0.95)'); sg.addColorStop(1,'transparent');
            ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(sh.x+dx,sh.y+dy,7,0,Math.PI*2); ctx.fill();
            ctx.restore();
          }
          if (sh.prog>sh.len) sh.active=false;
        }
      });

      // Meteors (fireballs with glowing trail)
      meteors.forEach(mt => {
        if (frameMs>mt.nextAt && !mt.active) {
          mt.active=true; mt.x=Math.random()*W*.4+W*.05; mt.y=Math.random()*H*.2; mt.prog=0; mt.trail=[];
          mt.nextAt=frameMs+15000+Math.random()*12000;
        }
        if (mt.active) {
          mt.prog+=mt.speed;
          const dx=mt.prog*1.1, dy=mt.prog*.6;
          mt.trail.push({x:mt.x+dx,y:mt.y+dy});
          if (mt.trail.length>45) mt.trail.shift();
          // Trail
          mt.trail.forEach((p,i) => {
            const frac=i/mt.trail.length;
            ctx.save(); ctx.globalAlpha=frac*.5;
            ctx.fillStyle=`rgba(${Math.round(255*frac+150*(1-frac))},${Math.round(160*frac+60*(1-frac))},${Math.round(20*frac)},1)`;
            ctx.beginPath(); ctx.arc(p.x,p.y,1+frac*4,0,Math.PI*2); ctx.fill();
            ctx.restore();
          });
          // Fireball
          const hx=mt.x+dx, hy=mt.y+dy;
          const al=Math.max(0,Math.min(1,1-(mt.prog-mt.len*.7)/(mt.len*.3)));
          if (al>0 && mt.trail.length>2) {
            ctx.save(); ctx.globalAlpha=al;
            const fg=ctx.createRadialGradient(hx,hy,0,hx,hy,14);
            fg.addColorStop(0,'rgba(255,255,200,1)'); fg.addColorStop(.3,'rgba(255,180,50,.9)'); fg.addColorStop(.7,'rgba(255,80,0,.5)'); fg.addColorStop(1,'transparent');
            ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(hx,hy,14,0,Math.PI*2); ctx.fill();
            ctx.restore();
          }
          if (mt.prog>mt.len+80) mt.active=false;
        }
      });

      // Floating particles
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.ph+=p.ps;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const a=p.a*(.7+Math.sin(p.ph)*.3);
        ctx.save(); ctx.globalAlpha=a;
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        g.addColorStop(0,p.col); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=Math.min(1,a*2); ctx.fillStyle=p.col;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const onResize = () => {
      W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight;
      moon.x=W*.82; moon.y=H*.14;
      nebulas[0].cx=W*.12; nebulas[0].cy=H*.20;
      nebulas[1].cx=W*.85; nebulas[1].cy=H*.72;
      nebulas[2].cx=W*.50; nebulas[2].cy=H*.48;
      nebulas[3].cx=W*.68; nebulas[3].cy=H*.10;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      ctx.clearRect(0,0,W,H);
    };
  }, [dark]);

  return (
    <canvas ref={canvasRef} id="space-canvas"
      style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', display:'block', opacity:dark?1:0, transition:'opacity 0.8s ease' }}
    />
  );
});

export default SpaceBG;
