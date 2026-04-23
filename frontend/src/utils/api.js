import axios from 'axios';

// ✅ RENDER FIX: In production, React's proxy doesn't work.
// Set REACT_APP_API_URL in Render frontend env vars to your backend URL.
// Example: https://myvault-backend.onrender.com
const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api'; // fallback for local dev (proxy works locally)

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mv_token');
  const v = localStorage.getItem('mv_vault');
  if (t) cfg.headers['x-auth-token'] = t;
  if (v) cfg.headers['x-vault-token'] = v;
  return cfg;
});

// ✅ Auto-logout on 401 (token expired/invalid)
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mv_token');
      localStorage.removeItem('mv_vault');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

export const fmt = {
  size: (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
  },
  date: (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  ago: (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }
};

export const fileIcon = (mime, name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (mime?.startsWith('image/')) return '🖼️';
  if (mime?.startsWith('video/')) return '🎬';
  if (mime?.startsWith('audio/')) return '🎵';
  if (mime?.includes('pdf') || ext === 'pdf') return '📕';
  if (['doc','docx'].includes(ext) || mime?.includes('word')) return '📘';
  if (['xls','xlsx'].includes(ext) || mime?.includes('sheet')) return '📗';
  if (['ppt','pptx'].includes(ext)) return '📙';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '📦';
  if (['js','ts','py','java','cpp','html','css','json','php'].includes(ext)) return '💻';
  if (['txt','md'].includes(ext)) return '📄';
  return '📎';
};

export const dlFile = async (url, filename, onProg) => {
  const fullUrl = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}${url}`
    : url;
  const res = await fetch(fullUrl, {
    headers: {
      'x-auth-token': localStorage.getItem('mv_token') || '',
      'x-vault-token': localStorage.getItem('mv_vault') || ''
    }
  });
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const total = +res.headers.get('Content-Length') || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (onProg && total) onProg(Math.round((loaded / total) * 100));
  }
  const blob = new Blob(chunks);
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: filename
  });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(a.href);
};
