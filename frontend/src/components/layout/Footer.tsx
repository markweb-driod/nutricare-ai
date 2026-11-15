'use client';

import React from 'react';
import { Heart, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-emerald-900/10 py-4 px-4 mt-auto text-xs text-emerald-900/70">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#16835D] text-white flex items-center justify-center font-bold text-xs">
            <Heart className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="font-bold text-[#123F35]">NutriCare AI</span>
          <span className="text-emerald-900/40">|</span>
          <span className="text-[11px]">Diabetic Dietary Management System (ADA 2026 Aligned)</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <Info className="w-3 h-3 text-[#16835D]" /> FAO/INFOODS & USDA Calibrated
          </span>
          <span className="text-emerald-900/30">•</span>
          <a href="#" className="hover:text-[#16835D]">Privacy & Consent</a>
          <span className="text-emerald-900/30">•</span>
          <a href="#" className="hover:text-[#16835D]">Terms</a>
          <span className="text-emerald-900/30">•</span>
          <span>© 2026 NutriCare AI</span>
        </div>
      </div>
    </footer>
  );
}
