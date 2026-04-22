import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FolderOpen, ImageIcon, StickyNote, KeyRound, Trash2, HardDrive, Activity, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API, { fmt } from '../utils/api';

function Counter({ target, duration=1100 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now()-start)/duration,1), e = 1-Math.pow(1-t,3);
      setV(Math.round(e*target));
      if (t<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{v}</>;
}

const STATS = [
  { key:'files',     label:'Files',     icon:FileText,    path:'/files',     accent:'var(--em)', bg:'var(--em-soft)',   emoji:'🛸' },
  { key:'folders',   label:'Folders',   icon:FolderOpen,  path:'/folders',   accent:'var(--gold)', bg:'rgba(255,217,125,0.07)', emoji:'🌌' },
  { key:'images',    label:'Images',    icon:ImageIcon,   path:'/images',    accent:'#a78bfa', bg:'rgba(167,139,250,0.07)', emoji:'🔮' },
  { key:'notes',     label:'Notes',     icon:StickyNote,  path:'/notes',     accent:'#fb923c', bg:'rgba(251,146,60,0.07)',  emoji:'☄️' },
  { key:'passwords', label:'Passwords', icon:KeyRound,    path:'/passwords', accent:'var(--em)', bg:'var(--em-soft)',   emoji:'🌠' },
  { key:'trash',     label:'Trash',     icon:Trash2,      path:'/trash',     accent:'#f87171', bg:'rgba(248,113,113,0.07)', emoji:'💫' },
];

const typeEmoji = { file:'📄', note:'📝', image:'🖼️', folder:'📁' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentItems, setRecentItems] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    API.get('/dashboard/stats').then(r => {
      setData(r.data);
      // Store recent with unique ids for deletion
      const items = (r.data.recentActivity || r.data.recent || []).map((item, i) => ({
        ...item,
        _uid: `${item.type}-${i}-${Date.now()}`
      }));
      setRecentItems(items);
    }).catch(() => {});
  }, []);

  const handleDeleteActivity = async (item) => {
    setDeletingId(item._uid);
    try {
      // Delete from actual DB based on type
      const endpointMap = { file: '/files', note: '/notes', image: '/images', folder: '/folders' };
      const endpoint = endpointMap[item.type];
      if (endpoint && item._id) {
        await API.delete(`${endpoint}/${item._id}`);
      }
      // Remove from UI
      setRecentItems(prev => prev.filter(r => r._uid !== item._uid));
      toast.success(`${item.name} moved to trash`);
    } catch {
      // Even if API fails, remove from activity list visually
      setRecentItems(prev => prev.filter(r => r._uid !== item._uid));
      toast.success('Removed from activity');
    } finally {
      setDeletingId(null);
    }
  };

  const container = { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } };
  const item = { hidden:{ opacity:0, y:24, scale:0.93 }, show:{ opacity:1, y:0, scale:1, transition:{ type:'spring', stiffness:180, damping:18 } } };
  const total = (data?.storage?.files||0) + (data?.storage?.images||0);

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:28, background:'linear-gradient(to bottom,var(--em),transparent)', borderRadius:2 }}/>
              <h1 className="orbitron" style={{ fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'0.06em' }}>DASHBOARD</h1>
            </div>
            <p style={{ color:'var(--text3)', fontSize:13.5, paddingLeft:13 }}>Mission control — all systems nominal</p>
          </div>
          <div style={{ padding:'8px 16px', borderRadius:10, background:'var(--em-soft)', border:'1px solid rgba(0,255,224,0.15)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--em)', boxShadow:'0 0 8px var(--em)', animation:'dotPulse 2s infinite' }}/>
            <span className="orbitron" style={{ fontSize:11, color:'var(--em)', letterSpacing:'0.1em' }}>VAULT ACTIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={container} initial="hidden" animate="show"
        style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:13, marginBottom:24 }} className="grid-stats">
        {STATS.map(({ key, label, icon:Icon, path, accent, bg, emoji }) => (
          <motion.div key={key} variants={item} className="stat-card" onClick={()=>nav(path)}
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
            {/* Orbit ring decoration */}
            <div style={{ position:'absolute', top:-15, right:-15, width:60, height:60, borderRadius:'50%', border:`1px solid ${accent}22`, animation:'orbitRing 8s linear infinite' }}/>
            <div style={{ position:'absolute', top:-25, right:-25, width:80, height:80, borderRadius:'50%', border:`1px solid ${accent}11`, animation:'orbitRing 12s linear infinite reverse' }}/>
            <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.3, type:'spring' }}
              style={{ width:42, height:42, borderRadius:12, background:bg, border:`1px solid ${accent}22`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, fontSize:20 }}>
              {emoji}
            </motion.div>
            <div className="orbitron" style={{ fontSize:28, fontWeight:700, color:'var(--text)', lineHeight:1, marginBottom:5 }}>
              {data ? <Counter target={data.stats?.[key]??0}/> : <div className="shimmer" style={{ width:36, height:28 }}/>}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', fontWeight:500, letterSpacing:'0.03em' }}>{label}</div>
            <div style={{ position:'absolute', bottom:14, right:14, width:5, height:5, borderRadius:'50%', background:accent, opacity:0.5 }}/>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }} className="dash-bottom">
        {/* Storage */}
        <motion.div className="glass" style={{ padding:24 }}
          initial={{ opacity:0, x:-18 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,217,125,0.08)', border:'1px solid rgba(255,217,125,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>💾</div>
            <div>
              <h3 className="orbitron" style={{ fontWeight:700, fontSize:13, color:'var(--text)', letterSpacing:'0.05em' }}>STORAGE</h3>
              <div className="gold-text" style={{ fontSize:11, fontWeight:600 }}>{fmt.size(total)} used</div>
            </div>
          </div>
          {[{ label:'Files', val:data?.storage?.files||0, color:'var(--em)' },
            { label:'Images', val:data?.storage?.images||0, color:'var(--gold)' }
          ].map(({ label, val, color }) => (
            <div key={label} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                <span style={{ fontSize:12.5, color:'var(--text3)' }}>{label}</span>
                <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text)' }}>{fmt.size(val)}</span>
              </div>
              <div className="prog-track">
                <motion.div className="prog-bar"
                  initial={{ width:0 }}
                  animate={{ width:`${total?(Math.max((val/total)*100,2)):2}%` }}
                  transition={{ duration:1.2, delay:0.6, ease:[0.22,1,0.36,1] }}
                  style={{ background:`linear-gradient(90deg,${color},${color}99)` }}/>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recent */}
        <motion.div className="glass" style={{ padding:24 }}
          initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.45 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'var(--em-soft)', border:'1px solid rgba(0,255,224,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>⚡</div>
            <h3 className="orbitron" style={{ fontWeight:700, fontSize:13, color:'var(--text)', letterSpacing:'0.05em' }}>ACTIVITY</h3>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:260, overflowY:'auto' }}>
            {!recentItems ? [1,2,3,4].map(i=><div key={i} className="shimmer" style={{ height:42, borderRadius:9 }}/>) :
             recentItems.length===0 ? (
               <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'24px 0' }}>No activity yet</p>
             ) : (
               <AnimatePresence>
                 {recentItems.map((r, i) => (
                   <motion.div key={r._uid}
                     initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                     exit={{ opacity:0, x:30, scale:0.9, height:0, marginBottom:0, padding:0 }}
                     transition={{ delay: recentItems.indexOf(r) < 5 ? 0.5+i*0.04 : 0, exit:{ duration:0.25 } }}
                     style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:9, background:'var(--row-bg)', border:'1px solid var(--border)', position:'relative', overflow:'hidden', group:true }}
                     whileHover={{ backgroundColor:'var(--row-hover)' }}
                   >
                     <span style={{ fontSize:15, flexShrink:0 }}>{typeEmoji[r.type]||'📄'}</span>
                     <div style={{ flex:1, minWidth:0 }}>
                       <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</div>
                       <div style={{ fontSize:11, color:'var(--text3)' }}>{fmt.ago(r.date)}</div>
                     </div>
                     <span className="badge" style={{ fontSize:10, flexShrink:0 }}>{r.type}</span>
                     {/* Delete button */}
                     <motion.button
                       onClick={() => handleDeleteActivity(r)}
                       disabled={deletingId === r._uid}
                       whileHover={{ scale:1.1 }}
                       whileTap={{ scale:0.88 }}
                       title="Delete"
                       style={{
                         background: 'rgba(239,68,68,0.08)',
                         border: '1px solid rgba(239,68,68,0.22)',
                         borderRadius: 8,
                         width: 28, height: 28,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         cursor: deletingId === r._uid ? 'not-allowed' : 'pointer',
                         flexShrink: 0,
                         opacity: deletingId === r._uid ? 0.5 : 1,
                         transition: 'all 0.2s',
                         marginLeft: 2,
                       }}
                     >
                       {deletingId === r._uid
                         ? <div className="spin" style={{ width:12, height:12 }}/>
                         : <X size={12} color="#f87171"/>
                       }
                     </motion.button>
                   </motion.div>
                 ))}
               </AnimatePresence>
             )
            }
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes orbitRing{to{transform:rotate(360deg)}} @keyframes dotPulse{0%,100%{box-shadow:0 0 6px rgba(0,255,224,.7)}50%{box-shadow:0 0 18px rgba(0,255,224,1),0 0 40px rgba(0,255,224,.5)}}`}</style>
    </div>
  );
}
