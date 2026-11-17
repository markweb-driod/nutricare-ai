'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, Clock, Info, LogOut, Menu, Search } from 'lucide-react';
import { api } from '../../services/api';
import type { AuthUser, NotificationItem } from '../../types';
import { formatDateTime, initials } from '../../lib/format';
import { NAV_ITEMS } from './Sidebar';

interface NavbarProps {
  activeNav: string;
  user: AuthUser;
  refreshKey: number;
  onMobileMenuToggle: () => void;
  onSignOut: () => void;
  onSearch?: (query: string) => void;
}

function useClickOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

const ICONS = { alert: AlertTriangle, reminder: Clock, info: Info };

export default function Navbar({ activeNav, user, refreshKey, onMobileMenuToggle, onSignOut, onSearch }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifError, setNotifError] = useState(false);
  const [query, setQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(userRef, () => setShowUser(false));

  useEffect(() => {
    let alive = true;
    api
      .getNotifications()
      .then(n => alive && (setNotifications(n), setNotifError(false)))
      .catch(() => alive && setNotifError(true));
    return () => {
      alive = false;
    };
  }, [refreshKey, user.id]);

  const title = NAV_ITEMS[user.role].find(i => i.id === activeNav)?.label ?? 'NutriCare AI';
  const alertCount = notifications.filter(n => n.type === 'alert').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-sm px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onMobileMenuToggle} aria-label="Open menu" className="md:hidden p-2 rounded-xl text-[#123F35] hover:bg-emerald-50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#123F35] font-heading leading-tight truncate">{title}</h2>
            <p className="text-xs text-emerald-800/70 hidden sm:block">NutriCare AI · Individualized nutrition therapy</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onSearch && (
            <form
              className="hidden sm:flex items-center relative w-56 lg:w-64"
              onSubmit={e => {
                e.preventDefault();
                onSearch(query.trim());
              }}
            >
              <Search className="w-4 h-4 absolute left-3 text-emerald-900/40" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search meals…"
                aria-label="Search meals"
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-emerald-900/15 text-sm bg-emerald-50/30 focus:bg-white focus:ring-2 focus:ring-[#16835D] focus:outline-none"
              />
            </form>
          )}

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              aria-label={`Notifications${alertCount ? ` (${alertCount} alerts)` : ''}`}
              className="p-2 rounded-xl text-[#123F35] hover:bg-emerald-50 relative border border-emerald-900/10"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-emerald-900/10 shadow-xl py-3 z-50">
                <div className="px-4 pb-2 border-b border-emerald-900/10 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#123F35] uppercase">Notifications</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{notifications.length}</span>
                </div>
                <div className="divide-y divide-emerald-50 max-h-72 overflow-y-auto">
                  {notifError && <p className="p-3 text-xs text-red-700">Could not load notifications.</p>}
                  {!notifError && notifications.length === 0 && <p className="p-3 text-xs text-emerald-900/60">You are all caught up.</p>}
                  {notifications.map((n, i) => {
                    const Icon = ICONS[n.type];
                    return (
                      <div key={i} className="p-3 text-xs space-y-1">
                        <span className={`font-bold flex items-center gap-1.5 ${n.type === 'alert' ? 'text-red-700' : 'text-[#123F35]'}`}>
                          <Icon className="w-3.5 h-3.5" /> {n.title}
                        </span>
                        <p className="text-emerald-900/70">{n.body}</p>
                        {n.at && <p className="text-[10px] text-emerald-900/50">{formatDateTime(n.at)}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUser(v => !v)}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-emerald-900/10 hover:bg-emerald-50"
              aria-label="Account menu"
            >
              <span className="w-7 h-7 rounded-full bg-[#16835D] text-white flex items-center justify-center font-bold text-xs">{initials(user.name)}</span>
              <span className="text-xs font-bold text-[#123F35] hidden md:inline">{user.name.split(' ')[0] === 'Dr.' ? user.name : user.name.split(' ')[0]}</span>
            </button>
            {showUser && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-emerald-900/10 shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-emerald-900/10 text-[11px]">
                  <p className="font-bold text-[#123F35]">{user.name}</p>
                  <p className="truncate text-emerald-800">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUser(false);
                    onSignOut();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
