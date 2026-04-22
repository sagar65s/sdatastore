// ═══════════════════════════════════════════════════════
//  Folders.js
// ═══════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Upload, Archive, Download, Trash2, ArrowLeft, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt, fileIcon, dlFile } from '../utils/api';

export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dlId, setDlId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const folderRef = useRef();

  const loadFolders = async () => {
    setLoading(true);
    try { setFolders((await API.get('/folders')).data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadFolders(); }, []);

  const openView = async (folder) => {
    setOpenFolder(folder); setLoadingFiles(true);
    try { setFolderFiles((await API.get(`/folders/${folder._id}/files`)).data); }
    catch { toast.error('Failed'); }
    finally { setLoadingFiles(false); }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      const paths = files.map(f => f.webkitRelativePath || f.name);
      fd.append('folderName', paths[0]?.split('/')[0] || 'Folder');
      files.forEach(f => fd.append('files', f));
      paths.forEach(p => fd.append('relativePaths', p));
      const r = await API.post('/folders/upload', fd);
      toast.success(`"${r.data.folder.name}" uploaded · ${r.data.count} files`);
      loadFolders();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const createFolder = async () => {
    if (!newName.trim()) return;
    try {
      const r = await API.post('/folders', { name: newName });
      setFolders(p => [{ ...r.data, fileCount:0 }, ...p]);
      toast.success('Folder created'); setShowNew(false); setNewName('');
    } catch { toast.error('Failed'); }
  };

  const dlFileInFolder = async (file) => {
    setDlId(file._id);
    try { await dlFile(`/api/folders/file-download/${file._id}`, file.originalName); toast.success('Downloaded'); }
    catch { toast.error('Failed'); } finally { setDlId(null); }
  };

  const dlZip = async (folder) => {
    setDlId(folder._id);
    try { await dlFile(`/api/folders/${folder._id}/download-zip`, `${folder.name}.zip`); toast.success(`${folder.name}.zip`); }
    catch { toast.error('ZIP failed'); } finally { setDlId(null); }
  };

  const deleteFolder = async (id) => {
    try { await API.delete(`/folders/${id}`); setFolders(p => p.filter(f => f._id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const pageTitle = (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <div style={{ width:3, height:26, background:'linear-gradient(to bottom,var(--gold),transparent)', borderRadius:2 }}/>
        <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>Folders</h1>
      </div>
      <p style={{ color:'var(--text3)', fontSize:13, paddingLeft:13, fontStyle:'italic' }}>Uploaded folder collections</p>
    </div>
  );

  if (openFolder) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:26, flexWrap:'wrap' }}>
        <motion.button className="btn btn-ghost" onClick={() => setOpenFolder(null)} whileTap={{ scale:0.93 }} style={{ padding:'8px 12px' }}>
          <ArrowLeft size={15}/>
        </motion.button>
        <motion.div animate={{ rotate:[0,-6,6,0] }} transition={{ duration:0.5, delay:0.1 }}>
          <FolderOpen size={22} color="var(--gold)"/>
        </motion.div>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:22, fontWeight:700, color:'var(--text)' }}>{openFolder.name}</h1>
          <p style={{ fontSize:12, color:'var(--text3)' }}>{folderFiles.length} files</p>
        </div>
        <motion.button className="btn btn-gold" onClick={() => dlZip(openFolder)} disabled={dlId===openFolder._id} whileTap={{ scale:0.95 }}>
          {dlId===openFolder._id ? <div className="spin" style={{ width:14, height:14 }}/> : <Archive size={14}/>}
          Download ZIP
        </motion.button>
      </div>
      {loadingFiles ? [1,2,3].map(i => <div key={i} className="shimmer" style={{ height:60, borderRadius:12, marginBottom:8 }}/>) :
       folderFiles.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <motion.div animate={{ y:[0,-7,0] }} transition={{ repeat:Infinity, duration:2.5 }}>
            <FileText size={44} color="rgba(52,211,153,0.15)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', marginTop:12 }}>Empty folder</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {folderFiles.map((f, i) => (
            <motion.div key={f._id} className="file-row"
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(240,192,96,0.07)', border:'1px solid rgba(240,192,96,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {fileIcon(f.mimeType, f.originalName)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.originalName}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{fmt.size(f.size)}</div>
              </div>
              <motion.button className="btn btn-ghost" onClick={() => dlFileInFolder(f)} disabled={dlId===f._id} whileTap={{ scale:0.9 }} style={{ padding:'7px 11px' }}>
                {dlId===f._id ? <div className="spin" style={{ width:13, height:13 }}/> : <Download size={13}/>}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {pageTitle}
      <div style={{ display:'flex', gap:9, marginBottom:22 }}>
        <motion.button className="btn btn-ghost" onClick={() => setShowNew(true)} whileTap={{ scale:0.95 }}>
          <Plus size={14}/> New
        </motion.button>
        <motion.button className="btn btn-em" onClick={() => folderRef.current?.click()} disabled={uploading} whileTap={{ scale:0.95 }}>
          {uploading ? <div className="spin" style={{ width:14, height:14 }}/> : <Upload size={14}/>}
          {uploading ? 'Uploading…' : 'Upload Folder'}
        </motion.button>
        <input ref={folderRef} type="file" multiple hidden webkitdirectory="" directory="" onChange={handleUpload}/>
      </div>
      {loading ? (
        <div className="grid-cards">{[1,2,3].map(i => <div key={i} className="shimmer" style={{ height:140, borderRadius:16 }}/>)}</div>
      ) : folders.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <motion.div animate={{ y:[0,-10,0], rotate:[0,-3,3,0] }} transition={{ repeat:Infinity, duration:3.5 }}>
            <FolderOpen size={56} color="rgba(240,192,96,0.2)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:16 }}>No folders yet</p>
        </div>
      ) : (
        <div className="grid-cards">
          <AnimatePresence>
            {folders.map((f, i) => (
              <motion.div key={f._id} className="card"
                initial={{ opacity:0, scale:0.9, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.85 }} transition={{ delay:i*0.06, type:'spring', stiffness:200, damping:20 }}
                style={{ padding:20 }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(240,192,96,0.25),transparent)' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:18 }}>
                  <motion.div whileHover={{ rotate:[-5,10,-5,0], scale:1.1 }} transition={{ duration:0.5 }}
                    style={{ width:48, height:48, borderRadius:14, background:'rgba(240,192,96,0.07)', border:'1px solid rgba(240,192,96,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FolderOpen size={25} color="var(--gold)"/>
                  </motion.div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:15, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{f.fileCount||0} files · {fmt.date(f.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <motion.button className="btn btn-em" onClick={() => openView(f)} whileTap={{ scale:0.93 }} style={{ flex:1, justifyContent:'center', fontSize:12.5, padding:'8px 10px' }}>
                    Open
                  </motion.button>
                  <motion.button className="btn btn-ghost" onClick={() => dlZip(f)} disabled={dlId===f._id} whileTap={{ scale:0.9 }} style={{ padding:'8px 11px' }}>
                    {dlId===f._id ? <div className="spin" style={{ width:13, height:13 }}/> : <Archive size={13}/>}
                  </motion.button>
                  <motion.button className="btn btn-red" onClick={() => deleteFolder(f._id)} whileTap={{ scale:0.9 }} style={{ padding:'8px 11px' }}>
                    <Trash2 size={13}/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <AnimatePresence>
        {showNew && (
          <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="modal" initial={{ scale:0.88, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.88 }}>
              <h2 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:20, color:'var(--text)', marginBottom:20 }}>New Folder</h2>
              <input className="inp" placeholder="Folder name" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && createFolder()} autoFocus style={{ marginBottom:20 }}/>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn btn-em" onClick={createFolder}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
