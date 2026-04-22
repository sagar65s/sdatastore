import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PinEntry from './pages/PinEntry';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Folders from './pages/Folders';
import Images from './pages/Images';
import Notes from './pages/Notes';
import Passwords from './pages/Passwords';
import Trash from './pages/Trash';

function Guard({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { authed } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <PinEntry />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="files" element={<Files />} />
        <Route path="folders" element={<Folders />} />
        <Route path="images" element={<Images />} />
        <Route path="notes" element={<Notes />} />
        <Route path="passwords" element={<Passwords />} />
        <Route path="trash" element={<Trash />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--em-border)',
            color: 'var(--text)',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            borderRadius: '13px',
            boxShadow: 'var(--shadow)',
          },
          success: { iconTheme: { primary: 'var(--em,#00f5d4)', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
