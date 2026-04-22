import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Plus, Search, Eye, EyeOff, Trash2, Download, Edit3, X, Lock, Copy, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import API, { fmt } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATS = ['General','Social','Email','Banking','Work','Shopping','Other'];

/* ── Vault PIN Gate ── */
function VaultGate({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [locked, setLocked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { loginVault } = useAuth();

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setLocked(p => { if (p <= 1) { clearInterval(t); setErr(''); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const submit = useCallback(async (p) => {
    if (loading || locked) return;
    setLoading(true);
    try { await loginVault(p); onSuccess(); }
    catch (e) {
      const d = e.response?.data;
      setShake(true); setTimeout(() => setShake(false), 500); setPin('');
      if (d?.remaining) { setLocked(d.remaining); setErr(`${d.remaining}s lockout`); }
      else setErr(d?.error || 'Wrong PIN');
    } finally { setLoading(false); }
  }, [loading, locked, loginVault, onSuccess]);

  const press = useCallback(k => {
    if (locked || loading) return;
    if (k === '⌫') { setPin(p => p.slice(0,-1)); setErr(''); return; }
    if (k === 'C') { setPin(''); setErr(''); return; }
    if (pin.length < 4) {
      const np = pin + k;
      setPin(np);
      if (np.length === 4) setTimeout(() => submit(np), 140);
    }
  }, [pin, locked, loading, submit]);

  useEffect(() => {
    const h = e => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Escape') press('C');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [press]);

  const keys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];

  return (
    <motion.div
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'65vh', position:'relative' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }}
    >
      {/* Ambient glow */}
      <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <motion.div
        initial={{ scale:0, rotate:-20 }}
        animate={{ scale:1, rotate:0 }}
        transition={{ type:'spring', stiffness:180, damping:14 }}
        className="vault-glow"
        style={{ width:76, height:76, borderRadius:22, background:'linear-gradient(135deg,#172119,#0f1712)', border:'1px solid rgba(52,211,153,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22, position:'relative', overflow:'hidden' }}
      >
        <motion.div
          animate={{ x:['-200%','200%'] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:3 }}
          style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.2),transparent)', pointerEvents:'none' }}
        />
        <ShieldCheck size={32} color="var(--em)" strokeWidth={1.5}/>
      </motion.div>

      <h2 style={{ fontFamily:'Orbitron,monospace', fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:6, letterSpacing:'-0.3px' }}>
        Vault Lock
      </h2>
      <p style={{ color:'var(--text3)', fontSize:13.5, marginBottom:32, textAlign:'center', fontStyle:'italic' }}>
        Enter your secondary PIN to access passwords
      </p>

      <motion.div
        className="glass"
        style={{ padding:30, width:'100%', maxWidth:340, position:'relative', overflow:'hidden' }}
        animate={shake ? { x:[-10,10,-8,8,-4,4,0] } : {}}
        transition={{ duration:0.4 }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.4),transparent)' }}/>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:18, marginBottom:26 }}>
          {[0,1,2,3].map(i => (
            <motion.div key={i} className={`pin-dot ${i < pin.length ? 'on' : ''}`}
              animate={i < pin.length ? { scale:[1,1.45,1] } : { scale:1 }}
              transition={{ duration:0.18 }}/>
          ))}
        </div>

        <AnimatePresence>
          {err && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'9px 12px', marginBottom:16, color:'#f87171', fontSize:12.5, display:'flex', alignItems:'center', gap:7 }}>
              <Lock size={12}/> {locked ? `Locked — ${locked}s` : err}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
          {keys.map((k, idx) => (
            <motion.button key={k} className="pin-key"
              onClick={() => press(k)} whileTap={{ scale:0.88 }}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.1+idx*0.03 }}
              disabled={!!locked || loading}
              style={{ width:'100%', fontSize:(k==='⌫'||k==='C')?13:20, opacity:(locked||loading)?0.4:1, color:k==='C'?'#f87171':undefined }}>
              {loading && k==='0' ? <div className="spin" style={{ width:14, height:14 }}/> : k}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20 }}>
        <div style={{ width:24, height:'1px', background:'linear-gradient(to right,transparent,var(--text3))' }}/>
        <span style={{ color:'var(--text3)', fontSize:12 }}>5 attempts · 60s lockout</span>
        <div style={{ width:24, height:'1px', background:'linear-gradient(to left,transparent,var(--text3))' }}/>
      </div>

      <style>{`@keyframes vaultGlow{0%,100%{box-shadow:0 0 30px rgba(52,211,153,0.15),0 0 60px rgba(52,211,153,0.06)}50%{box-shadow:0 0 50px rgba(52,211,153,0.28),0 0 100px rgba(52,211,153,0.1)}}.vault-glow{animation:vaultGlow 3s ease-in-out infinite}`}</style>
    </motion.div>
  );
}

/* ── Password Form Modal ── */
function PwdModal({ pwd, onSave, onClose }) {
  const [f, setF] = useState({ title:pwd?.title||'', username:pwd?.username||'', email:pwd?.email||'', password:pwd?.password||'', website:pwd?.website||'', notes:pwd?.notes||'', category:pwd?.category||'General' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const save = async () => {
    if (!f.title || !f.password) { toast.error('Title and password required'); return; }
    setSaving(true);
    try { await onSave(f); } finally { setSaving(false); }
  };

  return (
    <motion.div className="overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <motion.div className="modal" initial={{ scale:0.88, y:24 }} animate={{ scale:1, y:0 }} exit={{ scale:0.88 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:20, color:'var(--text)' }}>
            {pwd?._id ? 'Edit Password' : 'Add Password'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={17}/></button>
        </div>
        <div style={{ display:'grid', gap:10 }}>
          {[['title','Title *'],['username','Username'],['email','Email'],['website','Website URL']].map(([k,ph]) => (
            <input key={k} className="inp" placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)}/>
          ))}
          <div style={{ position:'relative' }}>
            <input className="inp" placeholder="Password *" type={show?'text':'password'} value={f.password}
              onChange={e => set('password', e.target.value)} style={{ paddingRight:44 }}/>
            <button onClick={() => setShow(s => !s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
              {show ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
          <select className="inp" value={f.category} onChange={e => set('category', e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <textarea className="inp" placeholder="Notes (optional)" value={f.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight:72 }}/>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-em" onClick={save} disabled={saving}>
            {saving && <div className="spin" style={{ width:13, height:13 }}/>} Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Passwords() {
  const { vaultAuthed } = useAuth();
  const [unlocked, setUnlocked] = useState(vaultAuthed);
  const [pwds, setPwds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editP, setEditP] = useState(null);
  const [shown, setShown] = useState({});
  const [exp, setExp] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setPwds((await API.get('/passwords', { params:{ search } })).data); }
    catch (e) { if (e.response?.status === 401) setUnlocked(false); else toast.error('Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (unlocked) load(); }, [search, unlocked]);

  if (!unlocked) return <VaultGate onSuccess={() => setUnlocked(true)}/>;

  const save = async (data) => {
    try {
      if (editP?._id) {
        const r = await API.put(`/passwords/${editP._id}`, data);
        setPwds(p => p.map(x => x._id===editP._id ? r.data : x));
        toast.success('Updated');
      } else {
        const r = await API.post('/passwords', data);
        setPwds(p => [r.data, ...p]);
        toast.success('Password saved');
      }
      setModal(false); setEditP(null);
    } catch { toast.error('Save failed'); }
  };

  const del = async (id) => {
    try { await API.delete(`/passwords/${id}`); setPwds(p => p.filter(x => x._id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const exportPwds = async () => {
    setExp(true);
    try {
      const r = await fetch('/api/passwords/export', { headers:{ 'x-auth-token':localStorage.getItem('mv_token')||'', 'x-vault-token':localStorage.getItem('mv_vault')||'' } });
      const blob = await r.blob();
      const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:'vault-passwords.json' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success('Exported');
    } catch { toast.error('Export failed'); }
    finally { setExp(false); }
  };

  const copy = (txt, id) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(id); setTimeout(() => setCopied(null), 1500);
      toast.success('Copied to clipboard');
    });
  };

  const catColors = { General:'var(--em)', Social:'#38bdf8', Email:'#a78bfa', Banking:'var(--gold)', Work:'#fb923c', Shopping:'#f87171', Other:'var(--text3)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:26, background:'linear-gradient(to bottom,var(--em),transparent)', borderRadius:2 }}/>
              <h1 style={{ fontFamily:'Orbitron,monospace', fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'0.05em' }}>Passwords</h1>
              <span className="badge" style={{ fontSize:10, display:'flex', alignItems:'center', gap:4 }}>
                <Lock size={9}/> Vault
              </span>
            </div>
            <p style={{ color:'var(--text3)', fontSize:13, paddingLeft:13, fontStyle:'italic' }}>{pwds.length} entries secured</p>
          </div>
          <div style={{ display:'flex', gap:9 }}>
            <motion.button className="btn btn-ghost" onClick={exportPwds} disabled={exp} whileTap={{ scale:0.95 }}>
              {exp ? <div className="spin" style={{ width:14, height:14 }}/> : <Download size={14}/>} Export
            </motion.button>
            <motion.button className="btn btn-em" onClick={() => { setEditP(null); setModal(true); }} whileTap={{ scale:0.95 }}>
              <Plus size={14}/> Add Password
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={14} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }}/>
        <input className="inp" placeholder="Search passwords…" style={{ paddingLeft:38 }} value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height:80, borderRadius:13 }}/>)}
        </div>
      ) : pwds.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', padding:'70px 20px' }}>
          <motion.div animate={{ rotate:[0,8,-8,0] }} transition={{ repeat:Infinity, duration:3 }}>
            <KeyRound size={52} color="rgba(52,211,153,0.15)"/>
          </motion.div>
          <p style={{ color:'var(--text3)', fontWeight:500, marginTop:14 }}>No passwords saved</p>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {pwds.map((p, i) => (
            <motion.div key={p._id} className="pwd-card"
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:i*0.04 }} layout>
              {/* Left accent bar */}
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', borderRadius:'12px 0 0 12px', background:`linear-gradient(to bottom,${catColors[p.category]||'var(--em)'},transparent)` }}/>
              <div style={{ display:'flex', alignItems:'flex-start', gap:13, paddingLeft:8 }}>
                <motion.div whileHover={{ rotate:[-5,10,-5,0] }} transition={{ duration:0.4 }}
                  style={{ width:42, height:42, borderRadius:12, background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>
                  🔑
                </motion.div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                    <span style={{ fontFamily:'Orbitron,monospace', fontWeight:700, fontSize:14.5, color:'var(--text)' }}>{p.title}</span>
                    <span className="badge" style={{ fontSize:10, background:`${catColors[p.category]||'var(--em)'}18`, color:catColors[p.category]||'var(--em)', borderColor:`${catColors[p.category]||'var(--em)'}30` }}>{p.category}</span>
                  </div>
                  {p.username && <div style={{ fontSize:12.5, color:'var(--text3)' }}>{p.username}</div>}
                  {p.email && <div style={{ fontSize:11.5, color:'var(--text3)', opacity:0.7 }}>{p.email}</div>}
                  {p.website && <div style={{ fontSize:11.5, color:'var(--em)', marginTop:2, opacity:0.8 }}>{p.website}</div>}
                  {/* Password row */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, padding:'6px 10px', borderRadius:8, background:'var(--file-row-bg)', border:'1px solid var(--border)', width:'fit-content' }}>
                    <span style={{ fontFamily:'monospace', fontSize:13, color:'var(--text)', letterSpacing:shown[p._id]?0:4 }}>
                      {shown[p._id] ? p.password : '••••••••'}
                    </span>
                    <button onClick={() => setShown(s => ({ ...s, [p._id]:!s[p._id] }))}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2 }}>
                      {shown[p._id] ? <EyeOff size={13}/> : <Eye size={13}/>}
                    </button>
                    <motion.button
                      onClick={() => copy(p.password, p._id)}
                      whileTap={{ scale:0.8 }}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:2, color: copied===p._id ? 'var(--em)' : 'var(--text3)', transition:'color 0.2s' }}>
                      <Copy size={13}/>
                    </motion.button>
                    {copied===p._id && <motion.span initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} style={{ fontSize:10, color:'var(--em)', fontWeight:600 }}>Copied!</motion.span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <motion.button className="btn btn-ghost" onClick={() => { setEditP(p); setModal(true); }} whileTap={{ scale:0.9 }} style={{ padding:'6px 10px' }}>
                    <Edit3 size={13}/>
                  </motion.button>
                  <motion.button className="btn btn-red" onClick={() => del(p._id)} whileTap={{ scale:0.9 }} style={{ padding:'6px 10px' }}>
                    <Trash2 size={13}/>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && <PwdModal pwd={editP} onSave={save} onClose={() => { setModal(false); setEditP(null); }}/>}
      </AnimatePresence>
    </div>
  );
}
