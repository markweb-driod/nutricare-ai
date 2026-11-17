'use client';

import React from 'react';
import {
  Activity,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import type { AuthUser, UserRole } from '../../types';
import { initials } from '../../lib/format';

export const NAV_ITEMS: Record<UserRole, { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  patient: [
    { id: 'dashboard', label: 'Dashboard', icon: Heart },
    { id: 'explore', label: 'Recommendations', icon: Sparkles },
    { id: 'plan', label: 'Weekly Meal Planner', icon: Calendar },
    { id: 'diary', label: 'Food Diary', icon: BookOpen },
    { id: 'glucose', label: 'Glucose Log', icon: Activity },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'profile', label: 'Clinical Profile', icon: User },
  ],
  clinician: [
    { id: 'clinician-overview', label: 'Overview', icon: BarChart2 },
    { id: 'clinician-directory', label: 'Patient Directory', icon: Users },
    { id: 'clinician-builder', label: 'Meal Plan Targets', icon: Calendar },
    { id: 'clinician-queue', label: 'Review Queue', icon: CheckCircle },
    { id: 'clinician-reports', label: 'Clinical Reports', icon: FileText },
  ],
  admin: [
    { id: 'admin-overview', label: 'System Overview', icon: BarChart2 },
    { id: 'admin-ml', label: 'ML Model Ops', icon: Sparkles },
    { id: 'admin-safety', label: 'Safety Rules Engine', icon: ShieldAlert },
    { id: 'admin-audit', label: 'Audit Log', icon: CheckCircle },
  ],
};

export const DEFAULT_NAV: Record<UserRole, string> = {
  patient: 'dashboard',
  clinician: 'clinician-overview',
  admin: 'admin-overview',
};

interface SidebarProps {
  user: AuthUser;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const PORTAL_LABEL: Record<UserRole, string> = {
  patient: 'Patient Portal',
  clinician: 'Clinician Portal',
  admin: 'Admin / ML Ops Portal',
};

function SidebarBody({ user, activeNav, setActiveNav, onSignOut, onMobileClose, isMobile }: SidebarProps & { isMobile: boolean }) {
  const items = NAV_ITEMS[user.role];
  return (
    <>
      <div className="p-5 border-b border-emerald-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#16835D] text-white flex items-center justify-center shadow-md">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight text-white font-heading">NutriCare AI</h1>
          <p className="text-[11px] text-emerald-200/80 font-medium">Diabetic Dietary Platform</p>
        </div>
        {isMobile && (
          <button onClick={onMobileClose} aria-label="Close menu" className="p-2 rounded-lg text-emerald-100 hover:bg-emerald-800/60">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-emerald-800/40 bg-emerald-950/40">
        <div className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>{PORTAL_LABEL[user.role]}</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                onMobileClose();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'bg-[#16835D] text-white shadow-sm' : 'text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-300/70'}`} />
                {item.label}
              </span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#16835D] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {initials(user.name)}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-emerald-300/80 truncate">{user.title || user.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="p-2 rounded-xl bg-emerald-900/60 text-emerald-200 hover:bg-red-900/80 hover:text-white transition-all border border-emerald-700/50"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-[#123F35] text-white h-screen sticky top-0 shrink-0 border-r border-emerald-800/40 shadow-xl z-30">
        <SidebarBody {...props} isMobile={false} />
      </aside>
      {props.mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={props.onMobileClose} />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-[#123F35] text-white h-full shadow-2xl">
            <SidebarBody {...props} isMobile />
          </aside>
        </div>
      )}
    </>
  );
}
