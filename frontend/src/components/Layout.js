import React, { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileText, FolderOpen, ImageIcon, StickyNote, KeyRound, Trash2, LogOut, Menu, X, ShieldCheck, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SpaceBG from './SpaceBG';
import CloudBG from './CloudBG';

const NAV = [
  { path:'/',          label:'Dashboard', icon:LayoutDashboard, dc:'#00f5d4', lc:'#0077cc' },
  { path:'/files',     label:'Files',     icon:FileText,        dc:'#00c9af', lc:'#0066bb' },
  { path:'/folders',   label:'Folders',   icon:FolderOpen,      dc:'#ffd166', lc:'#f59e0b' },
  { path:'/images',    label:'Images',    icon:ImageIcon,       dc:'#bd93f9', lc:'#7c3aed' },
  { path:'/notes',     label:'Notes',     icon:StickyNote,      dc:'#ffb86c', lc:'#ea580c' },
  { path:'/passwords', label:'Passwords', icon:KeyRound,        dc:'#00f5d4', lc:'#0077cc' },
  { path:'/trash',     label:'Trash',     icon:Trash2,          dc:'#ff5555', lc:'#dc2626' },
];

function NavItem({ item, active, onClick }) {
  const [ripples, setRipples] = useState([]);
  const { dark } = useAuth();
  const ref = useRef();
  const Icon = item.icon;
  const color = dark ? item.dc : item.lc;

  const click = e => {
    const rect = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX-rect.left, y: e.clientY-rect.top }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id!==id)), 600);
    onClick();
  };

  return (
    <motion.button ref={ref} className={`nav-item ${active?'active':''}`} onClick={click} whileTap={{ scale:0.97 }}>
      {ripples.map(rp => <span key={rp.id} className="ripple" style={{ left:rp.x-20, top:rp.y-20, width:40, height:40 }}/>)}
      <motion.div animate={active?{ rotate:[0,-10,10,0], scale:[1,1.15,1] }:{ rotate:0, scale:1 }} transition={{ duration:0.4 }}>
        <Icon size={16} strokeWidth={active?2.5:1.8} color={active?color:undefined}/>
      </motion.div>
      <span>{item.label}</span>
      {active && <motion.div layoutId="navdot" style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}`, animation:'dotPulse 2s infinite' }}/>}
    </motion.button>
  );
}

export default function Layout() {
  const { logout, dark, toggleDark } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = path => { nav(path); setMobileOpen(false); };
  const active  = loc.pathname;
  const current = NAV.find(n => n.path === active);

  const SidebarContent = ({ onClose }) => (
    <>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:11, padding:'6px 4px 26px' }}>
        <motion.div whileHover={{ rotate:12, scale:1.1 }} transition={{ type:'spring', stiffness:300 }}
          style={{ width:40, height:40, borderRadius:13, background:dark?'linear-gradient(135deg,#06102a,#030818)':'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,240,255,0.85))', border:`1px solid ${dark?'rgba(0,245,212,0.3)':'rgba(0,119,204,0.35)'}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:dark?'0 0 20px rgba(0,245,212,0.15)':'0 4px 16px rgba(0,119,204,0.2)', flexShrink:0, animation:'vaultPulse 3s ease-in-out infinite', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', animation:'shimSweep 3s ease-in-out 1s infinite' }}/>
          <ShieldCheck size={20} color="var(--em)" strokeWidth={1.8}/>
        </motion.div>
        <div>
          <div className="orbitron" style={{ fontWeight:700, fontSize:15, color:'var(--text)', letterSpacing:'0.05em' }}>MyVault</div>
          <div className="gold-text" style={{ fontSize:9.5, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' }}>Secure Storage</div>
        </div>
        {onClose && <button onClick={onClose} className="btn btn-ghost" style={{ marginLeft:'auto', padding:'5px 8px', border:'none' }}><X size={16}/></button>}
      </div>

      <div style={{ height:1, background:`linear-gradient(90deg,transparent,${dark?'rgba(255,209,102,0.2)':'rgba(0,119,204,0.25)'},transparent)`, marginBottom:14 }}/>

      {/* Nav */}
      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
        {NAV.map((item, i) => (
          <motion.div key={item.path} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}>
            <NavItem item={item} active={active===item.path} onClick={() => go(item.path)}/>
          </motion.div>
        ))}
      </nav>

      {/* Online badge */}
      <div style={{ margin:'14px 0', padding:'9px 12px', borderRadius:10, background:'var(--em-soft)', border:'1px solid var(--em-border)', display:'flex', alignItems:'center', gap:8 }}>
        <Wifi size={13} color="var(--em)"/>
        <span style={{ fontSize:11.5, color:'var(--em)', fontWeight:600, letterSpacing:'0.04em' }}>Vault Online</span>
        <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'var(--em)', animation:'dotPulse 2s infinite' }}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <div className="divider"/>

        {/* Theme toggle with Moon/Sun */}
        <motion.button className="nav-item" onClick={toggleDark} whileTap={{ scale:0.97 }} style={{ fontWeight:600 }}>
          <AnimatePresence mode="wait">
            <motion.div key={dark?'moon':'sun'}
              initial={{ rotate:-90, opacity:0, scale:0.5 }}
              animate={{ rotate:0,   opacity:1, scale:1   }}
              exit    ={{ rotate: 90, opacity:0, scale:0.5 }}
              transition={{ duration:0.28 }}
              style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {dark
                ? /* Moon SVG */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      fill="#c8d8ff" stroke="#a0b8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="16" cy="8" r="1.2" fill="rgba(180,200,255,0.6)"/>
                    <circle cx="13" cy="5.5" r="0.8" fill="rgba(180,200,255,0.5)"/>
                  </svg>
                : /* Sun SVG */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" fill="#ffb800" stroke="#ff9200" strokeWidth="1.5"/>
                    {[0,45,90,135,180,225,270,315].map(deg => {
                      const r = Math.PI * deg / 180;
                      return <line key={deg} x1={12+8.5*Math.cos(r)} y1={12+8.5*Math.sin(r)} x2={12+11*Math.cos(r)} y2={12+11*Math.sin(r)} stroke="#ffcc00" strokeWidth="2" strokeLinecap="round"/>;
                    })}
                  </svg>
              }
            </motion.div>
          </AnimatePresence>
          <span style={{ flex:1, textAlign:'left', color:'var(--text)', fontSize:13.5 }}>
            {dark ? 'Light Mode' : 'Dark Mode'}
          </span>
          {/* Pill toggle */}
          <div style={{ width:42, height:23, borderRadius:12, background:dark?'var(--em-soft)':'rgba(0,119,204,0.15)', border:`1px solid ${dark?'var(--em-border)':'rgba(0,119,204,0.35)'}`, position:'relative', flexShrink:0 }}>
            <motion.div
              animate={{ x: dark ? 21 : 2 }}
              transition={{ type:'spring', stiffness:500, damping:30 }}
              style={{ position:'absolute', top:3, width:15, height:15, borderRadius:'50%', background:dark?'var(--em)':'var(--em2)', boxShadow:dark?'0 0 8px var(--em)':'0 0 8px var(--em2)' }}/>
          </div>
        </motion.button>

        <motion.button className="nav-item" onClick={() => { logout(); nav('/login'); }} whileTap={{ scale:0.97 }} style={{ color:'#ef4444' }}>
          <LogOut size={16} color="#ef4444"/>
          Lock Vault
        </motion.button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      <SpaceBG/>
      <CloudBG/>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setMobileOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', zIndex:99 }}/>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="sidebar mob-hide" style={{ display:'flex' }}>
        <SidebarContent onClose={null}/>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside className="sidebar" style={{ display:'flex', transform:'none', zIndex:101 }}
            initial={{ x:-270 }} animate={{ x:0 }} exit={{ x:-270 }}
            transition={{ type:'spring', stiffness:300, damping:30 }}>
            <SidebarContent onClose={() => setMobileOpen(false)}/>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <button className="btn btn-ghost mob-show"
            style={{ padding:'7px 10px', border:'1px solid var(--em-border)', background:'var(--em-soft)', display:'none' }}
            onClick={() => setMobileOpen(true)}>
            <Menu size={19} color="var(--em)"/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {current && <current.icon size={15} color={dark?current.dc:current.lc} strokeWidth={1.8}/>}
            <span className="orbitron" style={{ fontWeight:600, fontSize:13, color:'var(--text2)', letterSpacing:'0.04em' }}>
              {current?.label||'MyVault'}
            </span>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:9 }}>
            {/* Moon/Sun indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:9, background:'var(--em-soft)', border:'1px solid var(--em-border)' }}>
              {dark
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#c8d8ff" stroke="#a0b8f0" strokeWidth="2"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#ffb800"/>{[0,60,120,180,240,300].map(d=>{const r=Math.PI*d/180;return<line key={d} x1={12+7.5*Math.cos(r)} y1={12+7.5*Math.sin(r)} x2={12+10*Math.cos(r)} y2={12+10*Math.sin(r)} stroke="#ffcc00" strokeWidth="2" strokeLinecap="round"/>;})}  </svg>
              }
              <span style={{ fontSize:11, color:'var(--em)', fontWeight:700, letterSpacing:'0.08em' }}>
                {dark ? 'SPACE' : 'SKY'}
              </span>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--em)', boxShadow:'0 0 8px var(--em)', animation:'dotPulse 2s infinite' }}/>
            </div>
          </div>
        </div>

        {/* Page */}
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname}
            initial={{ opacity:0, y:18, filter:'blur(8px)' }}
            animate={{ opacity:1, y:0, filter:'blur(0px)' }}
            exit   ={{ opacity:0, y:-12, filter:'blur(4px)' }}
            transition={{ duration:0.32, ease:[0.22,1,0.36,1] }}
            className="page-body">
            <Outlet/>
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes vaultPulse{0%,100%{box-shadow:0 0 22px var(--em-glow),0 0 60px var(--em-soft)}50%{box-shadow:0 0 44px var(--em-glow),0 0 100px var(--em-soft)}}
        @keyframes dotPulse{0%,100%{box-shadow:0 0 6px var(--em-glow)}50%{box-shadow:0 0 18px var(--em),0 0 40px var(--em-soft)}}
        @keyframes shimSweep{0%{left:-100%}100%{left:200%}}
        @media(max-width:768px){.mob-show{display:flex!important}.mob-hide{display:none!important}}
        @media(min-width:769px){.mob-show{display:none!important}.mob-hide{display:flex!important}}
      `}</style>
    </div>
  );
}
