import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Trash2, Search, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt, fileIcon, dlFile } from '../utils/api';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dlState, setDlState] = useState({});
  const inputRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try { setFiles((await API.get('/files', { params:{ search } })).data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const upload = async (list) => {
    if (!list?.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(list)) {
      try { const fd = new FormData(); fd.append('file', f); const r = await API.post('/files/upload', fd); setFiles(p=>[r.data,...p]); ok++; }
      catch { toast.error(`Failed: ${f.name}`); }
    }
    if (ok) toast.success(`${ok} file${ok>1?'s':''} uploaded 🛸`);
    setUploading(false);
  };

  const download = async (f) => {
    setDlState(s=>({...s,[f._id]:0}));
    try { await dlFile(`/api/files/download/${f._id}`, f.originalName, p=>setDlState(s=>({...s,[f._id]:p}))); toast.success(`Downloaded: ${f.originalName}`); }
    catch { toast.error('Download failed'); }
    finally { setDlState(s=>{const n={...s};delete n[f._id];return n;}); }
  };

  const remove = async (id) => {
    try { await API.delete(`/files/${id}`); setFiles(p=>p.filter(f=>f._id!==id)); toast.success('Moved to trash'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:26, background:'linear-gradient(to bottom,var(--em),transparent)', borderRadius:2 }}/>
              <h1 className="orbitron" style={{ fontSize:22, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>FILES</h1>
            </div>
            <p style={{ color:'var(--text3)', fontSize:13, paddingLeft:13 }}>Standalone files · {files.length} items</p>
          </div>
          <div style={{ display:'flex', gap:9 }}>
            <motion.button className="btn btn-ghost" onClick={load} whileTap={{ scale:0.93 }} style={{ padding:'9px 12px' }}>
              <motion.div animate={loading?{ rotate:360 }:{}} transition={{ repeat:loading?Infinity:0, duration:0.7, ease:'linear' }}>
                <RefreshCw size={14}/>
              </motion.div>
            </motion.button>
            <motion.button className="btn btn-em" onClick={()=>inputRef.current?.click()} disabled={uploading} whileTap={{ scale:0.95 }}>
              {uploading?<div className="spin" style={{ width:14, height:14 }}/>:<Upload size={14}/>}
              {uploading?'Uploading…':'Upload File'}
            </motion.button>
            <input ref={inputRef} type="file" multiple hidden onChange={e=>upload(e.target.files)}/>
          </div>
        </div>
      </div>

      <div style={{ position:'relative', marginBottom:18 }}>
        <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}/>
        <input className="inp" placeholder="Search files…" style={{ paddingLeft:38 }} value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <motion.div className={`drop-zone ${dragging?'active':''}`} style={{ marginBottom:22 }}
        onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);upload(Array.from(e.dataTransfer.files));}}
        whileHover={{ scale:1.003 }}>
        <motion.div animate={dragging?{ scale:1.2, rotate:[0,-8,8,0] }:{ scale:1 }} transition={{ duration:0.3 }}>
          <Upload size={28} color="var(--em)" style={{ marginBottom:10 }}/>
        </motion.div>
        <p style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>Drop files here or click to upload</p>
        <p style={{ fontSize:12.5, color:'var(--text3)' }}>All file types · max 100MB · <em style={{ color:'var(--em)' }}>For folders → Folders section</em></p>
      </motion.div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[1,2,3,4].map(i=><div key={i} className="shimmer" style={{ height:62, borderRadius:12 }}/>)}
        </div>
      ) : files.length===0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'64px 20px' }}>
          <motion.div animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:3 }}>
            <FileText size={52} color="rgba(0,255,224,0.15)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:14 }}>No files yet</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div key={f._id} className="file-row"
                initial={{ opacity:0, x:-16, scale:0.97 }} animate={{ opacity:1, x:0, scale:1 }}
                exit={{ opacity:0, x:20, scale:0.94 }}
                transition={{ delay:i*0.04, type:'spring', stiffness:250, damping:22 }} layout>
                <motion.div whileHover={{ rotate:[0,-8,8,0], scale:1.1 }} transition={{ duration:0.4 }}
                  style={{ width:40, height:40, borderRadius:11, background:'var(--em-soft)', border:'1px solid rgba(0,255,224,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {fileIcon(f.mimeType, f.originalName)}
                </motion.div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.originalName}</div>
                  <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>{fmt.size(f.size)} · {fmt.ago(f.createdAt)}</div>
                  {dlState[f._id]!==undefined && (
                    <div className="prog-track" style={{ marginTop:6 }}>
                      <motion.div className="prog-bar" animate={{ width:`${dlState[f._id]}%` }}/>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                  <motion.button className="btn btn-ghost" onClick={()=>download(f)} disabled={dlState[f._id]!==undefined} whileTap={{ scale:0.9 }} style={{ padding:'7px 11px' }}>
                    {dlState[f._id]!==undefined?<div className="spin" style={{ width:14, height:14 }}/>:<Download size={14}/>}
                  </motion.button>
                  <motion.button className="btn btn-red" onClick={()=>remove(f._id)} whileTap={{ scale:0.9 }} style={{ padding:'7px 11px' }}>
                    <Trash2 size={14}/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
