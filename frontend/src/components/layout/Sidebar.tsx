'use client';

import React from 'react';
import {
  Heart,
  Sparkles,
  Calendar,
  Clock,
  User,
  Activity,
  ShieldAlert,
  LogOut,
  BookOpen,
  Users,
  CheckCircle,
  BarChart2,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentRole: 'patient' | 'clinician' | 'admin';
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({
  currentRole,
  activeNav,
  setActiveNav,
  onSignOut,
}: SidebarProps) {
  const patientNavItems = [
    { id: 'dashboard', label: 'Patient Dashboard', icon: Heart },
    { id: 'explore', label: 'Recommendations', icon: Sparkles },
    { id: 'plan', label: 'Weekly Meal Planner', icon: Calendar },
    { id: 'diary', label: 'Food Diary', icon: BookOpen },
    { id: 'glucose', label: 'Glucose Log', icon: Activity },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'profile', label: 'Clinical Profile', icon: User },
  ];

  const clinicianNavItems = [
    { id: 'clinician-overview', label: 'Clinician Overview', icon: BarChart2 },
    { id: 'clinician-directory', label: 'Patient Directory', icon: Users },
    { id: 'clinician-builder', label: 'Meal Plan Builder', icon: Calendar },
    { id: 'clinician-queue', label: 'Review Queue', icon: CheckCircle },
    { id: 'clinician-reports', label: 'Clinical Reports', icon: FileText },
  ];

  const adminNavItems = [
    { id: 'admin-overview', label: 'System Overview', icon: BarChart2 },
    { id: 'admin-ml', label: 'ML Dashboard (Ops)', icon: Sparkles },
    { id: 'admin-safety', label: 'Safety Rules Engine', icon: ShieldAlert },
    { id: 'admin-audit', label: 'Compliance Audit Logs', icon: CheckCircle },
  ];

  const currentNavItems =
    currentRole === 'clinician'
      ? clinicianNavItems
      : currentRole === 'admin'
      ? adminNavItems
      : patientNavItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#123F35] text-white min-h-screen sticky top-0 shrink-0 border-r border-emerald-800/40 shadow-xl z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-emerald-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#16835D] text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/40">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white font-heading">NutriCare AI</h1>
          <p className="text-[11px] text-emerald-200/80 font-medium">Diabetic Dietary Platform</p>
        </div>
      </div>

      {/* Persona Badge */}
      <div className="p-4 border-b border-emerald-800/40 bg-emerald-950/40">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block mb-1">
          Active Workspace
        </span>
        <div className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
          <ShieldCheck className="w-4 h-4 text-[#16835D]" />
          <span>
            {currentRole === 'clinician'
              ? 'Clinician Portal'
              : currentRole === 'admin'
              ? 'Admin / ML Ops Portal'
              : 'Patient Portal'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60 block mb-1">
          Workspace Navigation
        </span>
        {currentNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#16835D] text-white shadow-sm'
                  : 'text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-300/70'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
            </button>
          );
        })}
      </div>

      {/* System Status & ML Badge */}
      <div className="p-4 border-t border-emerald-800/40 bg-emerald-950/40 text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Random Forest ML Active</span>
        </div>
        <p className="text-[11px] text-emerald-400/80 mt-0.5">95.83% Accuracy · ADA 2026 Aligned</p>
      </div>

      {/* User Login & Sign Out Footer */}
      <div className="p-4 border-t border-emerald-800/60 bg-emerald-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#16835D] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentRole === 'clinician' ? 'KB' : currentRole === 'admin' ? 'SA' : 'AA'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">
              {currentRole === 'clinician' ? 'Dr. Kemi Balogun' : currentRole === 'admin' ? 'System Admin' : 'Alex Adeyemi'}
            </p>
            <p className="text-[10px] text-emerald-300/80 truncate">
              {currentRole === 'clinician' ? 'RD, CDE' : currentRole === 'admin' ? 'Superuser' : 'Type 2 Diabetic'}
            </p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="p-2 rounded-xl bg-emerald-900/60 text-emerald-200 hover:bg-red-900/80 hover:text-white transition-all flex items-center gap-1 text-xs font-bold border border-emerald-700/50"
          title="Sign Out to Login Page"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
