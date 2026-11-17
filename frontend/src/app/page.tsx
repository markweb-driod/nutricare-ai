'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Sidebar, { DEFAULT_NAV, NAV_ITEMS } from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoginPage from '../components/auth/LoginPage';
import PatientWorkspace from '../components/patient/PatientWorkspace';
import ClinicianWorkspace from '../components/clinician/ClinicianWorkspace';
import AdminWorkspace from '../components/admin/AdminWorkspace';
import { Loading } from '../components/ui';
import { api, session, setUnauthorizedHandler } from '../services/api';
import type { AuthUser } from '../types';

const NAV_KEY = 'nutricare.nav';

export default function NutriCareApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [activeNav, setActiveNavState] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'good' | 'bad' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const setActiveNav = useCallback((nav: string) => {
    setActiveNavState(nav);
    try { sessionStorage.setItem(NAV_KEY, nav); } catch { /* ignore */ }
    window.scrollTo({ top: 0 });
  }, []);

  const signOut = useCallback(() => {
    session.clear();
    setUser(null);
    setSearchQuery('');
    try { sessionStorage.removeItem(NAV_KEY); } catch { /* ignore */ }
  }, []);

  // Restore a saved session and validate the token with the server.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      session.clear();
      setUser(null);
    });
    if (!session.token) {
      setBooting(false);
      return;
    }
    api
      .me()
      .then(u => {
        setUser(u);
        let saved: string | null = null;
        try { saved = sessionStorage.getItem(NAV_KEY); } catch { /* ignore */ }
        const valid = saved && NAV_ITEMS[u.role].some(i => i.id === saved);
        setActiveNavState(valid ? saved! : DEFAULT_NAV[u.role]);
      })
      .catch(() => session.clear())
      .finally(() => setBooting(false));
  }, []);

  const notify = useCallback((msg: string, tone: 'good' | 'bad' = 'good') => {
    setToast({ msg, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogin = (token: string, u: AuthUser) => {
    session.save(token, u);
    setUser(u);
    setActiveNav(DEFAULT_NAV[u.role]);
  };

  const onDataChanged = useCallback(() => setRefreshKey(k => k + 1), []);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading label="Opening NutriCare AI…" />
      </div>
    );
  }

  if (!user) return <LoginPage onLoginSuccess={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col md:flex-row w-full">
      <Sidebar user={user} activeNav={activeNav} setActiveNav={setActiveNav} onSignOut={signOut} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeNav={activeNav}
          user={user}
          refreshKey={refreshKey}
          onMobileMenuToggle={() => setMobileOpen(o => !o)}
          onSignOut={signOut}
          onSearch={
            user.role === 'patient'
              ? q => {
                  setSearchQuery(q);
                  setActiveNav('explore');
                }
              : undefined
          }
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {user.role === 'patient' && (
            <PatientWorkspace
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              notify={notify}
              onDataChanged={onDataChanged}
            />
          )}
          {user.role === 'clinician' && (
            <ClinicianWorkspace user={user} activeNav={activeNav} setActiveNav={setActiveNav} notify={notify} onDataChanged={onDataChanged} />
          )}
          {user.role === 'admin' && <AdminWorkspace activeNav={activeNav} />}
        </main>

        <Footer />
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-4 left-4 sm:left-auto z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2 text-white ${
            toast.tone === 'good' ? 'bg-[#123F35]' : 'bg-red-700'
          }`}
        >
          {toast.tone === 'good' ? <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
