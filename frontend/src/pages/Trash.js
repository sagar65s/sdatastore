import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, FolderOpen, FileText, File, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt } from '../utils/api';

const TYPE_CONFIG = {
  folder: { icon: FolderOpen, color:'var(--gold)', bg:'rgba(240,192,96,0.08)', border:'rgba(240,192,96,0.15)' },
  note:   { icon: FileText,   color:'#fb923c',    bg:'rgba(251,146,60,0.08)',  border:'rgba(251,146,60,0.15)' },
  file:   { icon: File,       color:'var(--em)',  bg:'rgba(52,211,153,0.07)', border:'rgba(52,211,153,0.14)' },
  image:  { icon: ImageIcon,  color:'#a78bfa',    bg:'rgba(167,139,250,0.08)',border:'rgba(167,139,250,0.15)' },
};

export default function Trash() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await API.get('/trash');
      setItems([...r.data.folders, ...r.data.notes, ...r.data.files, ...r.data.images]
        .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const restore = async (item) => {
    setRestoring(item._id);
    try {
      await API.post(`/trash/restore/${item.type}/${item._id}`);
      setItems(p => p.filter(x => x._id !== item._id));
      toast.success(`${item.title || item.name} restored`);
    } catch { toast.error('Failed'); }
    finally { setRestoring(null); }
  };

  const permDel = async (item) => {
    setDeleting(item._id);
    try {
      await API.delete(`/trash/permanent/${item.type}/${item._id}`);
      setItems(p => p.filter(x => x._id !== item._id));
      toast.success('Permanently deleted');
    } catch { toast.error('Failed'); }
    finally { setDeleting(null); }
  };

  const emptyAll = async () => {
    try {
      await Promise.all(items.map(i => API.delete(`/trash/permanent/${i.type}/${i._id}`)));
      setItems([]); setConfirm(false);
      toast.success('Trash emptied');
    } catch { toast.error('Some items failed'); }
  };

  const filtered = filter === 'all' ? items : items.filter(x => x.type === filter);
  const counts = items.reduce((a, x) => ({ ...a, [x.type]:(a[x.type]||0)+1 }), {});

  const FILTERS = [
    { key:'all',    label:'All',     color:'var(--text2)' },
    { key:'file',   label:'Files',   color:'var(--em)' },
    { key:'folder', label:'Folders', color:'var(--gold)' },
    { key:'note',   label:'Notes',   color:'#fb923c' },
    { key:'image',  label:'Images',  color:'#a78bfa' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:26, background:'linear-gradient(to bottom,#f87171,transparent)', borderRadius:2 }}/>
              <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>Trash</h1>
            </div>
            <p style={{ color:'var(--text3)', fontSize:13, paddingLeft:13, fontStyle:'italic' }}>{items.length} item{items.length !== 1 ? 's' : ''} in trash</p>
          </div>
          {items.length > 0 && (
            <motion.button className="btn btn-red" onClick={() => setConfirm(true)} whileTap={{ scale:0.95 }}>
              <Trash2 size={14}/> Empty Trash
            </motion.button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {FILTERS.map(({ key, label, color }) => {
          const count = key === 'all' ? items.length : (counts[key]||0);
          const active = filter === key;
          return (
            <motion.button key={key} onClick={() => setFilter(key)} whileTap={{ scale:0.93 }}
              style={{
                padding:'7px 15px', borderRadius:10, border:`1px solid ${active ? color+'40' : 'var(--border)'}`,
                cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:12.5,
                background: active ? `${color}15` : 'var(--row-bg)',
                color: active ? color : 'var(--text3)',
                transition:'all 0.2s',
              }}>
              {label} <span style={{ opacity:0.7 }}>({count})</span>
            </motion.button>
          );
        })}
      </div>

      {/* Items */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:64, borderRadius:12 }}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'80px 20px' }}>
          <motion.div animate={{ y:[0,-8,0], rotate:[0,-4,4,0] }} transition={{ repeat:Infinity, duration:3.5 }}>
            <Trash2 size={52} color="rgba(248,113,113,0.2)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:16 }}>
            {filter === 'all' ? 'Trash is empty' : `No ${filter}s in trash`}
          </p>
          <p style={{ color:'var(--text3)', fontSize:12.5, marginTop:6, opacity:0.6 }}>Deleted items will appear here</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <AnimatePresence>
            {filtered.map((item, i) => {
              const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.file;
              const Icon = cfg.icon;
              return (
                <motion.div key={item._id}
                  initial={{ opacity:0, x:-14, scale:0.97 }}
                  animate={{ opacity:1, x:0, scale:1 }}
                  exit={{ opacity:0, x:24, scale:0.93, filter:'blur(4px)' }}
                  transition={{ delay:i*0.03, type:'spring', stiffness:250, damping:22 }}
                  layout
                  style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 15px', background:'var(--file-row-bg)', border:`1px solid ${cfg.border}`, borderRadius:12, position:'relative', overflow:'hidden' }}
                >
                  {/* Subtle left accent */}
                  <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:`linear-gradient(to bottom,${cfg.color},transparent)`, borderRadius:'12px 0 0 12px' }}/>

                  <div style={{ width:40, height:40, borderRadius:11, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} color={cfg.color} strokeWidth={1.8}/>
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.title || item.name || 'Untitled'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                      <span className="badge" style={{ fontSize:10, background:cfg.bg, color:cfg.color, borderColor:cfg.border }}>{item.type}</span>
                      {item.deletedAt && <span style={{ fontSize:11, color:'var(--text3)' }}>Deleted {fmt.ago(item.deletedAt)}</span>}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                    <motion.button className="btn btn-ghost"
                      onClick={() => restore(item)} disabled={restoring === item._id}
                      whileHover={{ scale:1.05 }} whileTap={{ scale:0.9 }}
                      style={{ padding:'7px 12px', fontSize:12, gap:6 }}
                      title="Restore">
                      {restoring === item._id
                        ? <div className="spin" style={{ width:13, height:13 }}/>
                        : <RotateCcw size={13}/>}
                      <span style={{ display:'none' }}>Restore</span>
                    </motion.button>
                    <motion.button className="btn btn-red"
                      onClick={() => permDel(item)} disabled={deleting === item._id}
                      whileHover={{ scale:1.05 }} whileTap={{ scale:0.9 }}
                      style={{ padding:'7px 12px' }}
                      title="Delete forever">
                      {deleting === item._id
                        ? <div className="spin" style={{ width:13, height:13 }}/>
                        : <Trash2 size={13}/>}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirm && (
          <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="modal" style={{ maxWidth:380, textAlign:'center' }}
              initial={{ scale:0.85, y:24 }} animate={{ scale:1, y:0 }} exit={{ scale:0.85 }}>
              <motion.div
                animate={{ rotate:[0,-8,8,-4,4,0] }} transition={{ duration:0.6, delay:0.2 }}
                style={{ width:56, height:56, borderRadius:16, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <AlertTriangle size={26} color="#f87171"/>
              </motion.div>
              <h3 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:20, color:'var(--text)', marginBottom:10 }}>
                Empty Trash?
              </h3>
              <p style={{ color:'var(--text3)', fontSize:13.5, marginBottom:26, lineHeight:1.55 }}>
                This will permanently delete all <strong style={{ color:'var(--text)' }}>{items.length}</strong> items.<br/>
                <span style={{ color:'#f87171', fontSize:12 }}>This action cannot be undone.</span>
              </p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button className="btn btn-ghost" onClick={() => setConfirm(false)} style={{ minWidth:100 }}>Cancel</button>
                <motion.button className="btn btn-red" onClick={emptyAll} whileTap={{ scale:0.95 }} style={{ minWidth:120, fontWeight:700, justifyContent:'center' }}>
                  Delete All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
