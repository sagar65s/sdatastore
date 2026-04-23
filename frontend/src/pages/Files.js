import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Trash2, Search, FileText, RefreshCw, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt, fileIcon, dlFile } from '../utils/api';

// ✅ Always use the authenticated download endpoint for previewing
// Direct /uploads/... paths fail on Render (cross-origin or missing auth)
const previewURL = (fileId) => {
  const base = process.env.REACT_APP_API_URL || '';
  const token = localStorage.getItem('mv_token') || '';
  // Append token as query param so iframe/img/video can load with auth
  return `${base}/api/files/download/${fileId}?token=${token}`;
};

// Determine if a file can be previewed inline
const canPreview = (mime, name) => {
  if (!mime && !name) return false;
  const ext = name?.split('.').pop()?.toLowerCase();
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('audio/')) return 'audio';
  if (['txt','md','js','ts','py','json','html','css','csv'].includes(ext)) return 'text';
  return false;
};

function FilePreviewModal({ file, onClose }) {
  const [textContent, setTextContent] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const type = canPreview(file.mimeType, file.originalName);

  // ✅ Fetch file as blob using auth headers — works for ALL file types
  useEffect(() => {
    if (!type || type === 'text') return;
    const base = process.env.REACT_APP_API_URL || '';
    fetch(`${base}/api/files/download/${file._id}`, {
      headers: {
        'x-auth-token': localStorage.getItem('mv_token') || '',
        'x-vault-token': localStorage.getItem('mv_vault') || ''
      }
    })
      .then(r => r.blob())
      .then(blob => setBlobUrl(URL.createObjectURL(blob)))
      .catch(() => setBlobUrl(null));
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [file._id, type]);

  useEffect(() => {
    if (type === 'text') {
      const base = process.env.REACT_APP_API_URL || '';
      fetch(`${base}/api/files/download/${file._id}`, {
        headers: {
          'x-auth-token': localStorage.getItem('mv_token') || '',
          'x-vault-token': localStorage.getItem('mv_vault') || ''
        }
      })
        .then(r => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Could not load file content.'));
    }
  }, [file._id, type]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const url = blobUrl; // use blob URL for all media types

  useEffect(() => {
    if (type === 'text' && url) {
      fetch(url, {
        headers: {
          'x-auth-token': localStorage.getItem('mv_token') || '',
          'x-vault-token': localStorage.getItem('mv_vault') || ''
        }
      })
        .then(r => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Could not load file content.'));
    }
  }, [url, type]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 24, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw', maxWidth: 900,
          maxHeight: '90vh',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--glass)', backdropFilter: 'blur(20px)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: 22 }}>{fileIcon(file.mimeType, file.originalName)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.originalName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt.size(file.size)} · {fmt.ago(file.createdAt)}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '6px 10px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
          >
            <X size={15}/>
          </button>
        </div>

        {/* Preview body */}
        <div style={{ flex: 1, overflow: 'auto', background: type === 'image' ? '#000' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {type === 'image' && (
            <img
              src={url}
              alt={file.originalName}
              style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }}
            />
          )}
          {type === 'pdf' && (
            <iframe
              src={url}
              title={file.originalName}
              style={{ width: '100%', height: '72vh', border: 'none', background: '#fff' }}
            />
          )}
          {type === 'video' && (
            <video
              src={url}
              controls
              style={{ maxWidth: '100%', maxHeight: '72vh', outline: 'none' }}
            />
          )}
          {type === 'audio' && (
            <div style={{ padding: 40, textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎵</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 16 }}>{file.originalName}</div>
              <audio src={url} controls style={{ width: '100%', maxWidth: 420 }} />
            </div>
          )}
          {type === 'text' && (
            <div style={{ width: '100%', height: '72vh', overflow: 'auto', padding: 24 }}>
              {textContent === null ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--em)', borderRadius: '50%' }}/>
                </div>
              ) : (
                <pre style={{
                  color: 'var(--text)',
                  fontSize: 13,
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  lineHeight: 1.7
                }}>{textContent}</pre>
              )}
            </div>
          )}
          {!type && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>{fileIcon(file.mimeType, file.originalName)}</div>
              <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{file.originalName}</p>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Preview not available for this file type</p>
              <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Download to open it</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dlState, setDlState] = useState({});
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try { setFiles((await API.get('/files', { params:{ search } })).data); }
    catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const upload = async (list) => {
    if (!list?.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(list)) {
      try {
        const fd = new FormData();
        fd.append('file', f);
        const r = await API.post('/files/upload', fd);
        setFiles(p => [r.data, ...p]);
        ok++;
      } catch { toast.error(`Failed: ${f.name}`); }
    }
    if (ok) toast.success(`${ok} file${ok>1?'s':''} uploaded 🛸`);
    setUploading(false);
  };

  const download = async (f) => {
    setDlState(s => ({ ...s, [f._id]: 0 }));
    try {
      await dlFile(`/api/files/download/${f._id}`, f.originalName, p => setDlState(s => ({ ...s, [f._id]: p })));
      toast.success(`Downloaded: ${f.originalName} ✅`);
    } catch { toast.error('Download failed'); }
    finally { setDlState(s => { const n={...s}; delete n[f._id]; return n; }); }
  };

  const remove = async (id) => {
    try { await API.delete(`/files/${id}`); setFiles(p => p.filter(f => f._id!==id)); toast.success('Moved to trash 🗑️'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
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

      <motion.div
        className={`drop-zone ${dragging?'active':''}`}
        style={{ marginBottom:22 }}
        onClick={()=>inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);upload(Array.from(e.dataTransfer.files));}}
        whileHover={{ scale:1.003 }}
      >
        <motion.div animate={dragging?{ scale:1.2, rotate:[0,-8,8,0] }:{ scale:1 }} transition={{ duration:0.3 }}>
          <Upload size={28} color="var(--em)" style={{ marginBottom:10 }}/>
        </motion.div>
        <p style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>Drop files here or click to upload</p>
        <p style={{ fontSize:12.5, color:'var(--text3)' }}>All file types · max 100MB · <em style={{ color:'var(--em)' }}>Click any file row to preview</em></p>
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
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:14 }}>No files yet — upload one above</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div key={f._id} className="file-row"
                initial={{ opacity:0, x:-16, scale:0.97 }} animate={{ opacity:1, x:0, scale:1 }}
                exit={{ opacity:0, x:20, scale:0.94 }}
                transition={{ delay:i*0.04, type:'spring', stiffness:250, damping:22 }}
                layout
                style={{ cursor: 'pointer' }}
                onClick={() => setPreview(f)}
              >
                <motion.div
                  whileHover={{ rotate:[0,-8,8,0], scale:1.1 }} transition={{ duration:0.4 }}
                  style={{ width:40, height:40, borderRadius:11, background:'var(--em-soft)', border:'1px solid rgba(0,255,224,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}
                >
                  {fileIcon(f.mimeType, f.originalName)}
                </motion.div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.originalName}</div>
                  <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
                    <span>{fmt.size(f.size)}</span>
                    <span>·</span>
                    <span>{fmt.ago(f.createdAt)}</span>
                    {canPreview(f.mimeType, f.originalName) && (
                      <span style={{ color:'var(--em)', fontSize:10.5, display:'flex', alignItems:'center', gap:3 }}>
                        <Eye size={10}/> Preview
                      </span>
                    )}
                  </div>
                  {dlState[f._id] !== undefined && (
                    <div className="prog-track" style={{ marginTop:6 }}>
                      <motion.div className="prog-bar" animate={{ width:`${dlState[f._id]}%` }}/>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:7, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <motion.button
                    className="btn btn-ghost"
                    onClick={() => download(f)}
                    disabled={dlState[f._id] !== undefined}
                    whileTap={{ scale:0.9 }}
                    style={{ padding:'7px 11px' }}
                    title="Download"
                  >
                    {dlState[f._id] !== undefined ? <div className="spin" style={{ width:14, height:14 }}/> : <Download size={14}/>}
                  </motion.button>
                  <motion.button
                    className="btn btn-red"
                    onClick={() => remove(f._id)}
                    whileTap={{ scale:0.9 }}
                    style={{ padding:'7px 11px' }}
                    title="Delete"
                  >
                    <Trash2 size={14}/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* File Preview Modal */}
      <AnimatePresence>
        {preview && (
          <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}