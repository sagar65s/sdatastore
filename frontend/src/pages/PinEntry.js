import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SpaceBG from '../components/SpaceBG';
import CloudBG from '../components/CloudBG';

export default function PinEntry() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [locked, setLocked] = useState(0);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login, dark } = useAuth();
  const nav = useNavigate();
  const timerRef = useRef();

  useEffect(() => {
    if (!locked) return;
    timerRef.current = setInterval(() => {
      setLocked(p => { if (p<=1){clearInterval(timerRef.current);setErr('');return 0;} return p-1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [locked]);

  const submit = useCallback(async (p) => {
    if (loading || locked) return;
    setLoading(true); setErr('');
    try {
      await login(p);
      setSuccess(true);
      setTimeout(() => { toast.success(dark?'🌌 Vault unlocked — welcome back':'☀️ Welcome back!'); nav('/'); }, 900);
    } catch (e) {
      const d = e.response?.data;
      setShake(true); setTimeout(()=>setShake(false),500); setPin('');
      if (d?.remaining) { setLocked(d.remaining); setErr(`${d.remaining}s lockout`); }
      else setErr(d?.error || 'Invalid PIN');
    } finally { setLoading(false); }
  }, [loading, locked, login, nav, dark]);

  const press = useCallback(k => {
    if (locked||loading) return;
    if (k==='⌫'){setPin(p=>p.slice(0,-1));setErr('');return;}
    if (k==='CLR'){setPin('');setErr('');return;}
    if (pin.length<4){const np=pin+k;setPin(np);if(np.length===4)setTimeout(()=>submit(np),150);}
  },[pin,locked,loading,submit]);

  useEffect(() => {
    const h=e=>{if(e.key>='0'&&e.key<='9')press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Escape')press('CLR');};
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[press]);

  const keys=['1','2','3','4','5','6','7','8','9','CLR','0','⌫'];
  const scanLines = dark ? [8,22,38,55,72,88] : [];

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', padding:'16px' }}>
      <SpaceBG/>
      <CloudBG/>

      {/* Scan lines (space mode) */}
      {scanLines.map((left,i)=>(
        <div key={i} style={{ position:'fixed', left:`${left}%`, top:0, width:1, height:'100%', background:`linear-gradient(to bottom,transparent,rgba(0,245,212,${.03+i*.006}),transparent)`, animation:`scanLine ${13+i*3}s linear ${i*2}s infinite`, pointerEvents:'none' }}/>
      ))}

      {/* Sky ambient (light mode) */}
      {!dark && <>
        <div style={{ position:'fixed', top:'5%', left:'5%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.25) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'fixed', bottom:'10%', right:'8%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,240,180,0.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
      </>}

      <motion.div initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
        style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <motion.div initial={{ scale:0, rotate:-30 }} animate={{ scale:1, rotate:0 }}
            transition={{ delay:0.2, type:'spring', stiffness:180, damping:12 }}
            style={{ width:90, height:90, borderRadius:28, margin:'0 auto 22px', background:dark?'linear-gradient(135deg,#06102a,#030818)':'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,240,255,0.88))', border:'1px solid var(--em-border)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', animation:'vaultPulse 3s ease-in-out infinite' }}>
            <motion.div animate={{ x:['-200%','200%'] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:3 }}
              style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', pointerEvents:'none' }}/>
            <ShieldCheck size={40} color="var(--em)" strokeWidth={1.5}/>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            className="orbitron" style={{ fontSize:30, fontWeight:800, color:'var(--text)', letterSpacing:'0.06em', marginBottom:8 }}>
            MYVAULT
          </motion.h1>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}
            style={{ color:'var(--text3)', fontSize:13.5 }}>
            {dark ? '🌌 Enter PIN to access space vault' : '☀️ Enter PIN to open vault'}
          </motion.p>
        </div>

        {/* PIN card */}
        <motion.div animate={shake?{ x:[-12,12,-9,9,-5,5,0] }:success?{ borderColor:'var(--em)' }:{}}
          transition={{ duration:0.45 }}
          style={{ padding:32, borderRadius:20, position:'relative', overflow:'hidden', background:'var(--glass)', backdropFilter:'blur(28px)', border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,var(--em),transparent)' }}/>
          <AnimatePresence>
            {success&&<motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'absolute', inset:0, background:'var(--em-soft)', zIndex:5, borderRadius:'inherit', pointerEvents:'none' }}/>}
          </AnimatePresence>
          {/* Dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:28 }}>
            {[0,1,2,3].map(i=>(
              <motion.div key={i} className={`pin-dot ${i<pin.length?'on':''}`}
                animate={i<pin.length?{ scale:[1,1.5,1] }:{ scale:1 }} transition={{ duration:0.2 }}/>
            ))}
          </div>
          <AnimatePresence>
            {err&&<motion.div initial={{ opacity:0, height:0, marginBottom:0 }} animate={{ opacity:1, height:'auto', marginBottom:16 }} exit={{ opacity:0, height:0, marginBottom:0 }}
              style={{ background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'9px 14px', display:'flex', alignItems:'center', gap:8, color:'#ef4444', fontSize:13 }}>
              <Lock size={12}/> {locked?`Locked — ${locked}s remaining`:err}
            </motion.div>}
          </AnimatePresence>
          {/* Keypad */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {keys.map((k,idx)=>(
              <motion.button key={k} className="pin-key" onClick={()=>press(k)} disabled={!!locked||loading}
                whileTap={{ scale:0.88 }} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5+idx*0.03 }}
                style={{ width:'100%', opacity:(locked||loading)?0.4:1, fontSize:(k==='⌫'||k==='CLR')?11:18, color:k==='CLR'?'#ef4444':undefined, cursor:(locked||loading)?'not-allowed':'pointer' }}>
                {loading&&k==='0'?<div className="spin" style={{ width:16, height:16 }}/>:k}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
          style={{ textAlign:'center', marginTop:18, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,var(--border))' }}/>
          <span style={{ color:'var(--text3)', fontSize:12 }}>5 attempts · 60s lockout</span>
          <div style={{ flex:1, height:1, background:'linear-gradient(to left,transparent,var(--border))' }}/>
        </motion.div>
      </motion.div>
      <style>{`@keyframes vaultPulse{0%,100%{box-shadow:0 0 22px var(--em-glow),0 0 60px var(--em-soft)}50%{box-shadow:0 0 44px var(--em-glow),0 0 100px var(--em-soft)}}@keyframes scanLine{0%{transform:translateY(-100%)}100%{transform:translateY(110vh)}}`}</style>
    </div>
  );
}
