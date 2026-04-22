import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Download, Edit3, X, StickyNote } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt } from '../utils/api';

const PALETTES = [
  { bg:'rgba(52,211,153,0.07)', border:'rgba(52,211,153,0.2)', accent:'#34d399', name:'Emerald' },
  { bg:'rgba(240,192,96,0.07)', border:'rgba(240,192,96,0.2)', accent:'#f0c060', name:'Gold' },
  { bg:'rgba(167,139,250,0.07)', border:'rgba(167,139,250,0.2)', accent:'#a78bfa', name:'Violet' },
  { bg:'rgba(251,146,60,0.07)', border:'rgba(251,146,60,0.2)', accent:'#fb923c', name:'Amber' },
  { bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)', accent:'#f87171', name:'Rose' },
  { bg:'rgba(56,189,248,0.07)', border:'rgba(56,189,248,0.2)', accent:'#38bdf8', name:'Sky' },
];

function NoteModal({ note, onSave, onClose }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [pi, setPi] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note?.color) {
      const i = PALETTES.findIndex(p => p.bg === note.color);
      if (i >= 0) setPi(i);
    }
  }, [note]);

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try { await onSave({ title, content, color: PALETTES[pi].bg }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <motion.div className="modal" style={{ maxWidth:560 }} initial={{ scale:0.88, y:24 }} animate={{ scale:1, y:0 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${PALETTES[pi].accent},transparent)`, borderRadius:'22px 22px 0 0' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:20, color:'var(--text)' }}>
            {note?._id ? 'Edit Note' : 'New Note'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={18}/></button>
        </div>
        <input className="inp" placeholder="Title…" value={title} onChange={e => setTitle(e.target.value)}
          style={{ marginBottom:12, fontSize:15, fontWeight:600 }} autoFocus/>
        <textarea className="inp" placeholder="Write your note…" value={content} onChange={e => setContent(e.target.value)}
          style={{ minHeight:200, marginBottom:18 }}/>
        <div style={{ display:'flex', gap:9, marginBottom:20 }}>
          {PALETTES.map((p, i) => (
            <motion.button key={i} onClick={() => setPi(i)} whileTap={{ scale:0.8 }}
              style={{ width:24, height:24, borderRadius:'50%', background:p.accent, border:i===pi?`2px solid ${p.accent}`:'2px solid transparent', cursor:'pointer', opacity:i===pi?1:0.45, boxShadow:i===pi?`0 0 10px ${p.accent}60`:'none', transition:'all 0.2s' }}/>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-em" onClick={save} disabled={saving}>
            {saving && <div className="spin" style={{ width:13, height:13 }}/>} Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editNote, setEditNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expId, setExpId] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setNotes((await API.get('/notes', { params:{ search } })).data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const save = async (data) => {
    try {
      if (editNote?._id) {
        const r = await API.put(`/notes/${editNote._id}`, data);
        setNotes(p => p.map(n => n._id===editNote._id ? r.data : n));
        toast.success('Updated');
      } else {
        const r = await API.post('/notes', data);
        setNotes(p => [r.data, ...p]);
        toast.success('Note saved');
      }
      setShowModal(false); setEditNote(null);
    } catch { toast.error('Save failed'); }
  };

  const del = async (id) => {
    try { await API.delete(`/notes/${id}`); setNotes(p => p.filter(n => n._id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const exportNote = async (note, type) => {
    setExpId(note._id);
    try {
      const res = await fetch(`/api/notes/download/${note._id}/${type}`, { headers:{ 'x-auth-token': localStorage.getItem('mv_token')||'' } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:`${note.title}.${type==='txt'?'txt':'html'}` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast.success(`Exported .${type}`);
    } catch { toast.error('Export failed'); }
    finally { setExpId(null); }
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:26, background:'linear-gradient(to bottom,#fb923c,transparent)', borderRadius:2 }}/>
              <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>Notes</h1>
            </div>
            <p style={{ color:'var(--text3)', fontSize:13, paddingLeft:13, fontStyle:'italic' }}>{notes.length} notes</p>
          </div>
          <motion.button className="btn btn-em" onClick={() => { setEditNote(null); setShowModal(true); }} whileTap={{ scale:0.95 }}>
            <Plus size={14}/> New Note
          </motion.button>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}/>
        <input className="inp" placeholder="Search notes…" style={{ paddingLeft:38 }} value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:160, borderRadius:14 }}/>)}
        </div>
      ) : notes.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'80px 20px' }}>
          <motion.div animate={{ rotate:[0,5,-5,0], y:[0,-8,0] }} transition={{ repeat:Infinity, duration:3.5 }}>
            <StickyNote size={52} color="rgba(251,146,60,0.2)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:14 }}>No notes yet</p>
        </motion.div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          <AnimatePresence>
            {notes.map((note, i) => {
              const pal = PALETTES.find(p => p.bg === note.color) || PALETTES[0];
              return (
                <motion.div key={note._id} className="note-card" style={{ background:pal.bg, borderColor:pal.border }}
                  initial={{ opacity:0, y:18, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, scale:0.88 }}
                  transition={{ delay:i*0.05, type:'spring', stiffness:200, damping:20 }} layout>
                  {/* Colored top accent */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,${pal.accent},transparent)` }}/>
                  <h3 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note.title}</h3>
                  <p style={{ fontSize:13, color:'var(--text3)', flex:1, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', lineHeight:1.55 }}>
                    {note.content || '(empty)'}
                  </p>
                  <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${pal.border}` }}>
                    <div style={{ fontSize:10.5, color:'var(--text3)', marginBottom:9, display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:pal.accent, opacity:0.6 }}/>
                      {fmt.ago(note.updatedAt)}
                    </div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      <motion.button className="btn btn-ghost" style={{ padding:'5px 9px', fontSize:12 }}
                        onClick={() => { setEditNote(note); setShowModal(true); }} whileTap={{ scale:0.9 }}>
                        <Edit3 size={11}/> Edit
                      </motion.button>
                      <motion.button className="btn btn-ghost" style={{ padding:'5px 9px', fontSize:12 }}
                        onClick={() => exportNote(note, 'txt')} disabled={expId===note._id} whileTap={{ scale:0.9 }}>
                        {expId===note._id ? <div className="spin" style={{ width:11, height:11 }}/> : <Download size={11}/>} .txt
                      </motion.button>
                      <motion.button className="btn btn-ghost" style={{ padding:'5px 9px', fontSize:12 }}
                        onClick={() => exportNote(note, 'html')} disabled={expId===note._id} whileTap={{ scale:0.9 }}>
                        <Download size={11}/> .html
                      </motion.button>
                      <motion.button style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', padding:'5px 8px', marginLeft:'auto', borderRadius:8 }}
                        onClick={() => del(note._id)} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}>
                        <Trash2 size={13}/>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <NoteModal note={editNote} onSave={save} onClose={() => { setShowModal(false); setEditNote(null); }}/>}
      </AnimatePresence>
    </div>
  );
}
