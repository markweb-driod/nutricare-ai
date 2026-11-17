'use client';

import React, { useState } from 'react';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import type { PatientProfile } from '../../types';
import { addDays, formatTime, isoDate, label, round1 } from '../../lib/format';
import { Button, Card, EmptyState, ErrorState, Loading, MealImage, ProgressBar, StatCard, errorMessage, useAsync } from '../ui';

interface FoodDiaryViewProps {
  profile: PatientProfile | null;
  onAddMealClick: () => void;
  onChanged: () => void;
  notify: (msg: string, tone?: 'good' | 'bad') => void;
}

export default function FoodDiaryView({ profile, onAddMealClick, onChanged, notify }: FoodDiaryViewProps) {
  const [date, setDate] = useState(() => new Date());
  const day = isoDate(date);
  const isToday = day === isoDate(new Date());
  const logs = useAsync(() => api.getMealLogs(day), [day]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const items = logs.data ?? [];
  const sum = (k: 'energy_kcal' | 'carbs_g' | 'fiber_g' | 'net_carbs_g' | 'protein_g' | 'sodium_mg') => round1(items.reduce((a, l) => a + l[k], 0));
  const kcalTarget = profile?.daily_energy_kcal_target ?? 1800;
  const carbBudget = (profile?.approved_carb_max_per_meal ?? 45) * 3;
  const sodiumLimit = profile && (profile.comorbidities.includes('hypertension') || profile.has_renal_restriction) ? 1500 : 2300;

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from your diary?`)) return;
    setDeleting(id);
    try {
      await api.deleteMealLog(id);
      logs.setData(prev => (prev ?? []).filter(l => l.id !== id));
      notify('Entry removed');
      onChanged();
    } catch (e) {
      notify(errorMessage(e), 'bad');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#16835D] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Food diary
          </span>
          <h2 className="text-2xl font-bold text-[#123F35] font-heading mt-0.5">Daily meals and nutrient totals</h2>
        </div>
        <Button onClick={onAddMealClick}>
          <Plus className="w-4 h-4" /> Log food
        </Button>
      </Card>

      <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
        <button onClick={() => setDate(d => addDays(d, -1))} aria-label="Previous day" className="p-2 rounded-xl bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-[#123F35]">
          <Calendar className="w-4 h-4 text-[#16835D]" />
          <span>
            {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            {isToday ? ' (today)' : ''}
          </span>
        </div>
        <button
          onClick={() => setDate(d => addDays(d, 1))}
          disabled={isToday}
          aria-label="Next day"
          className="p-2 rounded-xl bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Calories" value={Math.round(sum('energy_kcal'))} sub={`/ ${kcalTarget} kcal`}>
          <ProgressBar value={sum('energy_kcal')} max={kcalTarget} />
        </StatCard>
        <StatCard label="Net carbs" value={`${sum('net_carbs_g')} g`} sub={`/ ${carbBudget} g`}>
          <ProgressBar value={sum('net_carbs_g')} max={carbBudget} className="bg-teal-600" />
        </StatCard>
        <StatCard label="Fiber" value={`${sum('fiber_g')} g`} sub="/ 25–35 g goal">
          <ProgressBar value={sum('fiber_g')} max={30} />
        </StatCard>
        <StatCard label="Sodium" value={`${Math.round(sum('sodium_mg'))} mg`} sub={`/ ${sodiumLimit} mg`}>
          <ProgressBar value={sum('sodium_mg')} max={sodiumLimit} className="bg-amber-500" />
        </StatCard>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-4">
          <h3 className="text-lg font-bold text-[#123F35] font-heading flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#16835D]" /> Logged foods ({items.length})
          </h3>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Carbs {sum('carbs_g')} g · Protein {sum('protein_g')} g
          </span>
        </div>
        {logs.error && <ErrorState message={logs.error} onRetry={logs.reload} />}
        {logs.loading && !logs.data && <Loading />}
        {logs.data && items.length === 0 && <EmptyState>Nothing logged for this day.</EmptyState>}
        {items.map(log => (
          <div key={log.id} className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MealImage src={log.image_url} alt={log.title} className="w-16 h-16 rounded-xl object-cover border border-emerald-200 shrink-0" />
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#16835D] text-[10px] font-bold uppercase">
                  {label(log.meal_type)} · {formatTime(log.logged_at)}
                </span>
                <h4 className="font-bold text-[#123F35]">{log.title}</h4>
                <p className="text-xs text-emerald-900/80">
                  {log.portion_g} g · {Math.round(log.energy_kcal)} kcal · {log.net_carbs_g} g net carbs · {log.fiber_g} g fiber
                </p>
              </div>
            </div>
            <Button variant="danger" className="px-2.5" busy={deleting === log.id} onClick={() => remove(log.id, log.title)} aria-label={`Remove ${log.title}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
