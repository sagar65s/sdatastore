import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Ctx = createContext(null);

// ✅ RENDER FIX: Use REACT_APP_API_URL for production
const BASE_URL = process.env.REACT_APP_API_URL || '';

function applyTheme(isDark) {
  const root = document.documentElement;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
  else        { root.classList.add('light'); root.classList.remove('dark'); }
}

export function AuthProvider({ children }) {
  const [authed,      setAuthed]      = useState(false);
  const [vaultAuthed, setVaultAuthed] = useState(false);
  const [checking,    setChecking]    = useState(true);
  const saved = localStorage.getItem('mv_dark');
  const [dark, setDark] = useState(saved === null ? true : saved === '1');

  useEffect(() => { applyTheme(dark); }, [dark]);

  // ✅ FIX: Validate token with backend on every app load — prevents PIN bypass
  useEffect(() => {
    const token = localStorage.getItem('mv_token');
    const vtoken = localStorage.getItem('mv_vault');

    if (!token) {
      setChecking(false);
      return;
    }

    axios.get(`${BASE_URL}/api/auth/validate`, {
      headers: { 'x-auth-token': token },
      timeout: 8000
    }).then(r => {
      if (r.data?.valid) {
        setAuthed(true);
        if (vtoken) setVaultAuthed(true);
      } else {
        localStorage.removeItem('mv_token');
        localStorage.removeItem('mv_vault');
      }
    }).catch(() => {
      // If validate endpoint fails (e.g. server restart cleared sessions), force re-login
      localStorage.removeItem('mv_token');
      localStorage.removeItem('mv_vault');
    }).finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (pin) => {
    const r = await axios.post(`${BASE_URL}/api/auth/verify-pin`, { pin });
    localStorage.setItem('mv_token', r.data.token);
    setAuthed(true);
    return r.data;
  }, []);

  const loginVault = useCallback(async (pin) => {
    const r = await axios.post(`${BASE_URL}/api/auth/verify-vault`, { pin });
    localStorage.setItem('mv_vault', r.data.token);
    setVaultAuthed(true);
    return r.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mv_token');
    localStorage.removeItem('mv_vault');
    setAuthed(false);
    setVaultAuthed(false);
  }, []);

  const toggleDark = useCallback(() => setDark(prev => {
    const n = !prev;
    localStorage.setItem('mv_dark', n?'1':'0');
    applyTheme(n);
    return n;
  }), []);

  // Show spinner while validating token (prevents flash of wrong screen)
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: dark ? '#030818' : '#f0f6ff'
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          border: '3px solid rgba(0,245,212,0.15)',
          borderTopColor: dark ? '#00f5d4' : '#0077cc',
          animation: 'spin 0.8s linear infinite'
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ authed, vaultAuthed, login, loginVault, logout, dark, toggleDark }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
