'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  FileText,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Info,
  Download
} from 'lucide-react';
import { RecommendationItem } from '../../types';

interface FoodDiaryViewProps {
  onAddMealClick: () => void;
}

export default function FoodDiaryView({ onAddMealClick }: FoodDiaryViewProps) {
  const [selectedDate, setSelectedDate] = useState('Thursday, Sept 24');

  // Seeded Food Diary Logs (FAO/INFOODS & USDA Calibrated)
  const [diaryLogs, setDiaryLogs] = useState([
    {
      id: 'log-01',
      meal_type: 'Breakfast',
      time: '08:00 AM',
      title: 'Steamed Moi Moi with Fresh Spinach & Fish',
      regional_category: 'West African',
      portion_g: 250,
      energy_kcal: 265,
      carbs_g: 24.5,
      fiber_g: 8.2,
      net_carbs_g: 16.3,
      protein_g: 22.0,
      fat_g: 7.8,
      sodium_mg: 340,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      data_source: 'FAO_INFOODS_2019_WAFCT'
    },
    {
      id: 'log-02',
      meal_type: 'Lunch',
      time: '12:30 PM',
      title: 'Brown Beans Porridge with Steamed Pumpkin Greens',
      regional_category: 'West African',
      portion_g: 280,
      energy_kcal: 290,
      carbs_g: 37.0,
      fiber_g: 9.8,
      net_carbs_g: 27.2,
      protein_g: 17.5,
      fat_g: 5.5,
      sodium_mg: 380,
      image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      data_source: 'FAO_INFOODS_2019_WAFCT'
    },
    {
      id: 'log-03',
      meal_type: 'Dinner',
      time: '07:00 PM',
      title: 'Edikang Ikong (Waterleaf & Pumpkin) with Tender Beef',
      regional_category: 'West African',
      portion_g: 260,
      energy_kcal: 280,
      carbs_g: 12.0,
      fiber_g: 6.5,
      net_carbs_g: 5.5,
      protein_g: 31.0,
      fat_g: 11.0,
      sodium_mg: 420,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      data_source: 'FAO_INFOODS_2019_WAFCT'
    },
    {
      id: 'log-04',
      meal_type: 'Snack',
      time: '04:15 PM',
      title: 'Rolled Oats with Roasted Walnuts & Blueberries',
      regional_category: 'Continental',
      portion_g: 120,
      energy_kcal: 122.5,
      carbs_g: 14.0,
      fiber_g: 3.75,
      net_carbs_g: 10.25,
      protein_g: 5.25,
      fat_g: 4.1,
      sodium_mg: 47.5,
      image_url: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80',
      data_source: 'USDA_FDC'
    }
  ]);

  // Aggregate totals
  const totalCalories = diaryLogs.reduce((acc, item) => acc + item.energy_kcal, 0);
  const totalCarbs = diaryLogs.reduce((acc, item) => acc + item.carbs_g, 0);
  const totalFiber = diaryLogs.reduce((acc, item) => acc + item.fiber_g, 0);
  const totalNetCarbs = Math.max(0, totalCarbs - totalFiber);
  const totalProtein = diaryLogs.reduce((acc, item) => acc + item.protein_g, 0);
  const totalFat = diaryLogs.reduce((acc, item) => acc + item.fat_g, 0);
  const totalSodium = diaryLogs.reduce((acc, item) => acc + item.sodium_mg, 0);

  const handleDeleteLog = (id: string) => {
    setDiaryLogs(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#16835D] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Food & Nutrition Diary
          </span>
          <h2 className="text-2xl font-bold text-[#123F35] font-heading mt-0.5">
            Daily Meal Logs & Nutrient Totals
          </h2>
          <p className="text-xs text-emerald-900/70">
            Track exact consumed quantities, net carbohydrates, and dietary fiber ratios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddMealClick}
            className="px-4 py-2.5 rounded-xl bg-[#16835D] text-white text-xs font-bold hover:bg-[#123F35] transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Log New Food Item
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
        <button className="p-2 rounded-xl bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-[#123F35]">
          <Calendar className="w-4 h-4 text-[#16835D]" />
          <span>{selectedDate} (Today)</span>
        </div>
        <button className="p-2 rounded-xl bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Daily Nutrient Progress Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
          <span className="text-xs font-semibold text-emerald-900/60 uppercase">Total Calories</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#123F35] font-heading">{Math.round(totalCalories)}</span>
            <span className="text-xs text-emerald-900/60 font-medium">/ 1800 kcal</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#16835D] h-full rounded-full"
              style={{ width: `${Math.min(100, (totalCalories / 1800) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Net Carbs Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
          <span className="text-xs font-semibold text-emerald-900/60 uppercase">Net Carbohydrates</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-emerald-800 font-heading">{totalNetCarbs.toFixed(1)}g</span>
            <span className="text-xs text-emerald-900/60 font-medium">/ 130g max</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalNetCarbs / 130) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Dietary Fiber Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
          <span className="text-xs font-semibold text-emerald-900/60 uppercase">Dietary Fiber</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#16835D] font-heading">{totalFiber.toFixed(1)}g</span>
            <span className="text-xs text-emerald-700 font-bold">/ 35g goal</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#16835D] h-full rounded-full"
              style={{ width: `${Math.min(100, (totalFiber / 35) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Sodium Card */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
          <span className="text-xs font-semibold text-emerald-900/60 uppercase">Sodium Intakes</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#123F35] font-heading">{Math.round(totalSodium)}mg</span>
            <span className="text-xs text-emerald-700 font-medium">Heart Healthy</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (totalSodium / 2000) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Logged Meals List Section */}
      <div className="bg-white rounded-3xl border border-emerald-900/10 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
          <h3 className="text-lg font-bold text-[#123F35] font-heading flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#16835D]" /> Logged Foods ({diaryLogs.length} Entries)
          </h3>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Total Carbs: {totalCarbs.toFixed(1)}g · Total Protein: {totalProtein.toFixed(1)}g
          </span>
        </div>

        {/* Meals Loop */}
        <div className="space-y-4">
          {diaryLogs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-900/10 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={log.image_url}
                  alt={log.title}
                  className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#16835D] text-[10px] font-bold uppercase">
                      {log.meal_type} · {log.time}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800/80">
                      Source: {log.data_source}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#123F35] text-base font-heading">{log.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-900/80">
                    <span>Portion: <strong>{log.portion_g}g</strong></span>
                    <span>•</span>
                    <span>Energy: <strong>{log.energy_kcal} kcal</strong></span>
                    <span>•</span>
                    <span>Net Carbs: <strong className="text-emerald-800">{log.net_carbs_g}g</strong></span>
                    <span>•</span>
                    <span>Fiber: <strong className="text-[#16835D]">{log.fiber_g}g</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-900/10">
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all border border-red-200/60"
                  title="Remove entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
