import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Plus, Upload, Download, Trash2, ArrowLeft, X, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt, dlFile } from '../utils/api';

export default function Images() {
  const [albums, setAlbums] = useState([]);
  const [openAlbum, setOpenAlbum] = useState(null);
  const [albumImgs, setAlbumImgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dlId, setDlId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [lbIdx, setLbIdx] = useState(0);
  const imgRef = useRef();

  const loadAlbums = async () => {
    setLoading(true);
    try { setAlbums((await API.get('/images/albums')).data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAlbums(); }, []);

  const openView = async (album) => {
    setOpenAlbum(album);
    try { setAlbumImgs((await API.get('/images', { params:{ albumId:album._id } })).data); }
    catch { toast.error('Failed'); }
  };

  const createAlbum = async () => {
    if (!newName.trim()) return;
    try {
      const r = await API.post('/images/albums', { name:newName });
      setAlbums(p => [{ ...r.data, imageCount:0 }, ...p]);
      toast.success('Album created'); setShowNew(false); setNewName('');
    } catch { toast.error('Failed'); }
  };

  const uploadImages = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('images', f));
      if (openAlbum) fd.append('albumId', openAlbum._id);
      const r = await API.post('/images/upload', fd);
      setAlbumImgs(p => [...r.data, ...p]);
      toast.success(`${r.data.length} image${r.data.length>1?'s':''} uploaded`);
    } catch { toast.error('Failed'); }
    finally { setUploading(false); }
  };

  const download = async (img) => {
    setDlId(img._id);
    try { await dlFile(`/api/images/download/${img._id}`, img.originalName); toast.success('Downloaded'); }
    catch { toast.error('Failed'); } finally { setDlId(null); }
  };

  const deleteImg = async (id) => {
    try {
      await API.delete(`/images/${id}`);
      setAlbumImgs(p => p.filter(i => i._id!==id));
      if (lightbox?._id===id) setLightbox(null);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const deleteAlbum = async (id) => {
    try { await API.delete(`/images/albums/${id}`); setAlbums(p => p.filter(a => a._id!==id)); toast.success('Album deleted'); }
    catch { toast.error('Failed'); }
  };

  const lbPrev = () => { const i=(lbIdx-1+albumImgs.length)%albumImgs.length; setLightbox(albumImgs[i]); setLbIdx(i); };
  const lbNext = () => { const i=(lbIdx+1)%albumImgs.length; setLightbox(albumImgs[i]); setLbIdx(i); };

  if (openAlbum) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <motion.button className="btn btn-ghost" onClick={() => setOpenAlbum(null)} whileTap={{ scale:0.93 }} style={{ padding:'8px 12px' }}>
          <ArrowLeft size={15}/>
        </motion.button>
        <ImageIcon size={20} color="var(--em)"/>
        <div style={{ flex:1 }}>
          <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:22, fontWeight:700, color:'var(--text)' }}>{openAlbum.name}</h1>
          <p style={{ fontSize:12, color:'var(--text3)' }}>{albumImgs.length} photos</p>
        </div>
        <motion.button className="btn btn-em" onClick={() => imgRef.current?.click()} disabled={uploading} whileTap={{ scale:0.95 }}>
          {uploading ? <div className="spin" style={{ width:14, height:14 }}/> : <Upload size={14}/>}
          Add Images
        </motion.button>
        <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={e => uploadImages(e.target.files)}/>
      </div>

      {albumImgs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <motion.div animate={{ scale:[1,1.08,1] }} transition={{ repeat:Infinity, duration:2.5 }}>
            <ImageIcon size={48} color="rgba(52,211,153,0.15)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', marginTop:14 }}>No images yet</p>
        </div>
      ) : (
        <div className="grid-images">
          <AnimatePresence>
            {albumImgs.map((img, i) => (
              <motion.div key={img._id} className="card"
                initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }} transition={{ delay:i*0.04, type:'spring', stiffness:220 }}>
                <div style={{ position:'relative', paddingTop:'72%', background:'var(--bg3)', overflow:'hidden', cursor:'pointer' }}
                  onClick={() => { setLightbox(img); setLbIdx(i); }}>
                  <img src={img.fileURL} alt={img.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.35s' }}
                    onMouseEnter={e => e.target.style.transform='scale(1.08)'}
                    onMouseLeave={e => e.target.style.transform='scale(1)'}/>
                  <div className="img-ov">
                    <ZoomIn size={22} color="#fff" className="zic"/>
                  </div>
                </div>
                <div style={{ padding:'9px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }} onClick={e => e.stopPropagation()}>
                  <div style={{ minWidth:0, flex:1, marginRight:8 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{img.originalName}</div>
                    <div style={{ fontSize:10.5, color:'var(--text3)' }}>{fmt.size(img.size)}</div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => download(img)} disabled={dlId===img._id} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--em)', padding:4 }}>
                      {dlId===img._id ? <div className="spin" style={{ width:12, height:12 }}/> : <Download size={12}/>}
                    </button>
                    <button onClick={() => deleteImg(img._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', padding:4 }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setLightbox(null)}>
            <motion.div initial={{ scale:0.82, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.82, opacity:0 }}
              style={{ maxWidth:'92vw', maxHeight:'92vh', borderRadius:18, overflow:'hidden', background:'var(--bg-3)', border:'1px solid rgba(52,211,153,0.15)', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ position:'relative' }}>
                <motion.img key={lightbox._id} src={lightbox.fileURL} alt={lightbox.title}
                  initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                  style={{ maxWidth:'90vw', maxHeight:'76vh', display:'block', objectFit:'contain' }}/>
                {albumImgs.length > 1 && (
                  <>
                    <button onClick={lbPrev} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:9, padding:'10px 14px', cursor:'pointer', fontSize:20, backdropFilter:'blur(8px)' }}>‹</button>
                    <button onClick={lbNext} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,0.5)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:9, padding:'10px 14px', cursor:'pointer', fontSize:20, backdropFilter:'blur(8px)' }}>›</button>
                  </>
                )}
              </div>
              <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(8,13,11,0.95)', borderTop:'1px solid var(--border)' }}>
                <div>
                  <div style={{ color:'var(--text)', fontSize:13, fontWeight:500 }}>{lightbox.originalName}</div>
                  <div style={{ color:'var(--text3)', fontSize:11 }}>{lbIdx+1} of {albumImgs.length} · {fmt.size(lightbox.size)}</div>
                </div>
                <div style={{ display:'flex', gap:9 }}>
                  <button className="btn btn-em" onClick={() => download(lightbox)} style={{ padding:'7px 14px', fontSize:12 }}>
                    <Download size={13}/> Save
                  </button>
                  <button className="btn btn-ghost" onClick={() => setLightbox(null)} style={{ padding:'7px 12px' }}>
                    <X size={14}/>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ width:3, height:26, background:'linear-gradient(to bottom,#a78bfa,transparent)', borderRadius:2 }}/>
          <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>Images</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4, paddingLeft:13 }}>
          <p style={{ color:'var(--text3)', fontSize:13, fontStyle:'italic' }}>Photo albums · {albums.length} collections</p>
          <motion.button className="btn btn-em" onClick={() => setShowNew(true)} whileTap={{ scale:0.95 }}>
            <Plus size={14}/> New Album
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height:200, borderRadius:16 }}/>)}
        </div>
      ) : albums.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <motion.div animate={{ scale:[1,1.08,1], rotate:[0,3,-3,0] }} transition={{ repeat:Infinity, duration:3.5 }}>
            <ImageIcon size={56} color="rgba(167,139,250,0.2)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:16 }}>No albums yet</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {albums.map((a, i) => (
            <motion.div key={a._id} className="card"
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
              <div style={{ height:150, position:'relative', background:a.coverURL?'var(--bg3)':'linear-gradient(135deg,var(--bg3),var(--space-mid))', cursor:'pointer', overflow:'hidden' }}
                onClick={() => openView(a)}>
                {a.coverURL
                  ? <img src={a.coverURL} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' }}
                      onMouseEnter={e => e.target.style.transform='scale(1.1)'}
                      onMouseLeave={e => e.target.style.transform='scale(1)'}/>
                  : <ImageIcon size={36} color="rgba(167,139,250,0.3)" style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
                }
                <div style={{ position:'absolute', bottom:8, right:8 }}>
                  <span className="badge" style={{ background:'rgba(0,0,0,0.5)', color:'var(--text)', borderColor:'rgba(255,255,255,0.15)' }}>{a.imageCount} photos</span>
                </div>
              </div>
              <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:14, color:'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{fmt.date(a.createdAt)}</div>
                </div>
                <button onClick={() => deleteAlbum(a._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', padding:6 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNew && (
          <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="modal" initial={{ scale:0.88, y:20 }} animate={{ scale:1, y:0 }}>
              <h2 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:20, color:'var(--text)', marginBottom:20 }}>New Album</h2>
              <input className="inp" placeholder="Album name" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && createAlbum()} autoFocus style={{ marginBottom:20 }}/>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn btn-em" onClick={createAlbum}>Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
