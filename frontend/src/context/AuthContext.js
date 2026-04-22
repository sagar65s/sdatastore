import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const Ctx = createContext(null);

function applyTheme(isDark) {
  const root = document.documentElement;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
  else        { root.classList.add('light'); root.classList.remove('dark'); }
}

export function AuthProvider({ children }) {
  const [authed,      setAuthed]      = useState(!!localStorage.getItem('mv_token'));
  const [vaultAuthed, setVaultAuthed] = useState(!!localStorage.getItem('mv_vault'));
  const saved = localStorage.getItem('mv_dark');
  const [dark, setDark] = useState(saved === null ? true : saved === '1');

  useEffect(() => { applyTheme(dark); }, [dark]);

  const login      = async (pin) => { const r = await axios.post('/api/auth/verify-pin',   { pin }); localStorage.setItem('mv_token', r.data.token); setAuthed(true);      return r.data; };
  const loginVault = async (pin) => { const r = await axios.post('/api/auth/verify-vault', { pin }); localStorage.setItem('mv_vault', r.data.token); setVaultAuthed(true); return r.data; };
  const logout     = () => { localStorage.removeItem('mv_token'); localStorage.removeItem('mv_vault'); setAuthed(false); setVaultAuthed(false); };
  const toggleDark = () => setDark(prev => { const n = !prev; localStorage.setItem('mv_dark', n?'1':'0'); applyTheme(n); return n; });

  return <Ctx.Provider value={{ authed, vaultAuthed, login, loginVault, logout, dark, toggleDark }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
