'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  Heart,
  Menu,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeNav: string;
  currentRole: 'patient' | 'clinician' | 'admin';
  userEmail?: string;
  onMobileMenuToggle?: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  activeNav,
  currentRole,
  userEmail,
  onMobileMenuToggle,
  onSignOut,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const formatTitle = (nav: string) => {
    switch (nav) {
      case 'dashboard': return 'Patient Dashboard';
      case 'explore': return 'Dietary Recommendation Engine';
      case 'plan': return '7-Day Weekly Meal Planner';
      case 'diary': return 'Food & Nutrition Diary';
      case 'glucose': return 'Glucose Log & Escalation';
      case 'reminders': return 'Reminders & Schedules';
      case 'profile': return 'Clinical Profile & Restrictions';
      case 'clinician-overview': return 'Clinician Dashboard Overview';
      case 'clinician-directory': return 'Patient Directory';
      case 'clinician-builder': return 'Clinical Meal Plan Builder';
      case 'clinician-queue': return 'Dietitian Review Queue';
      case 'clinician-reports': return 'Clinical Reports & Statistics';
      case 'admin-overview': return 'System Administration Overview';
      case 'admin-ml': return 'ML Model Ops & Metrics';
      case 'admin-safety': return 'Safety Rules Engine';
      case 'admin-audit': return 'Compliance Audit Logs';
      default: return 'NutriCare AI Workspace';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Page Heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl text-[#123F35] hover:bg-emerald-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#123F35] font-heading leading-tight">
              {formatTitle(activeNav)}
            </h2>
            <p className="text-xs text-emerald-800/70 hidden sm:block">
              NutriCare AI · Individualized Nutrition Therapy (ADA 2026 Standards)
            </p>
          </div>
        </div>

        {/* Global Search & Action Center */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden sm:flex items-center relative w-64">
            <Search className="w-4 h-4 absolute left-3 text-emerald-900/40" />
            <input
              type="text"
              placeholder="Search foods, dishes (Ctrl+K)..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-emerald-900/15 text-xs bg-emerald-50/30 focus:bg-white focus:ring-2 focus:ring-[#16835D] focus:outline-hidden"
            />
          </div>

          {/* Notification Tray */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-[#123F35] hover:bg-emerald-50 relative border border-emerald-900/10"
            >
              <Bell className="w-4 h-4 text-emerald-900" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-emerald-900/10 shadow-xl py-3 z-50 animate-scale-up">
                <div className="px-4 pb-2 border-b border-emerald-900/10 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#123F35] uppercase">Notifications</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">2 Unread</span>
                </div>
                <div className="divide-y divide-emerald-50 max-h-64 overflow-y-auto">
                  <div className="p-3 text-xs space-y-1 hover:bg-emerald-50/50">
                    <span className="font-bold text-[#123F35] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#16835D]" /> Lunch Reminder in 45m
                    </span>
                    <p className="text-emerald-900/70">Moi Moi with Spinach & Fish scheduled for 12:30 PM.</p>
                  </div>
                  <div className="p-3 text-xs space-y-1 hover:bg-emerald-50/50">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16835D]" /> Plan Approved
                    </span>
                    <p className="text-emerald-900/70">Dr. Kemi Balogun locked and approved your 7-day meal plan.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Sign Out Button */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-emerald-900/10 hover:bg-emerald-50"
            >
              <div className="w-7 h-7 rounded-full bg-[#16835D] text-white flex items-center justify-center font-bold text-xs">
                {currentRole === 'clinician' ? 'KB' : currentRole === 'admin' ? 'SA' : 'AA'}
              </div>
              <span className="text-xs font-bold text-[#123F35] hidden md:inline">
                {currentRole === 'clinician' ? 'Dr. Kemi' : currentRole === 'admin' ? 'Admin' : 'Alex'}
              </span>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-emerald-900/10 shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-emerald-900/10 text-[11px] text-emerald-900">
                  <p className="font-bold text-[#123F35]">Logged in as:</p>
                  <p className="truncate text-emerald-800 font-medium">{userEmail || 'alex@example.com'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onSignOut();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out to Login Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
