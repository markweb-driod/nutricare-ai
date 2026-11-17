import type { GlucoseStatus } from '../types';

export const ALLERGEN_OPTIONS = ['tree_nuts', 'peanuts', 'fish', 'shellfish', 'dairy', 'eggs', 'gluten', 'soy', 'sesame'];
export const COMORBIDITY_OPTIONS = ['hypertension', 'ckd', 'dyslipidemia', 'obesity'];
export const CATEGORY_OPTIONS = ['West African', 'Continental'];
export const DIABETES_OPTIONS = ['type_1', 'type_2', 'gestational', 'prediabetes'];
export const MEDICATION_OPTIONS = ['low_metformin', 'moderate_sulfonylurea', 'high_insulin'];
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const LABELS: Record<string, string> = {
  tree_nuts: 'Tree nuts',
  peanuts: 'Peanuts',
  fish: 'Fish',
  shellfish: 'Shellfish',
  dairy: 'Dairy',
  eggs: 'Eggs',
  gluten: 'Gluten',
  soy: 'Soy',
  sesame: 'Sesame',
  hypertension: 'Hypertension',
  ckd: 'Chronic kidney disease',
  dyslipidemia: 'Dyslipidemia',
  obesity: 'Obesity',
  type_1: 'Type 1 diabetes',
  type_2: 'Type 2 diabetes',
  gestational: 'Gestational diabetes',
  prediabetes: 'Prediabetes',
  low_metformin: 'Metformin (low hypo risk)',
  moderate_sulfonylurea: 'Sulfonylurea (moderate hypo risk)',
  high_insulin: 'Insulin (high hypo risk)',
  fasting: 'Fasting',
  pre_meal: 'Pre-meal',
  post_meal_2h: '2h post-meal',
  bedtime: 'Bedtime',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  male: 'Male',
  female: 'Female',
  other: 'Other',
  eligible: 'Eligible',
  review_required: 'Review required',
  not_recommended: 'Not recommended',
  APPROVED: 'Approved',
  PENDING_REVIEW: 'Pending review',
  CHANGES_REQUESTED: 'Changes requested',
  IN_TARGET: 'In target',
  HYPOGLYCEMIA: 'Low',
  CRITICAL_HYPOGLYCEMIA: 'Critical low',
  ELEVATED: 'Above target',
  SEVERE_HYPERGLYCEMIA: 'Critical high',
};

export const label = (key: string | null | undefined) =>
  key ? LABELS[key] ?? key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '—';

export function glucoseTone(status: GlucoseStatus): 'good' | 'warn' | 'bad' {
  if (status === 'IN_TARGET') return 'good';
  if (status === 'ELEVATED') return 'warn';
  return 'bad';
}

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

/** Parses the API's "YYYY-MM-DD HH:MM:SS" (server local time) safely across browsers. */
export function parseApiDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(s: string | null | undefined): string {
  const d = parseApiDate(s);
  if (!d) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatTime(s: string | null | undefined): string {
  const d = parseApiDate(s);
  if (!d) return '—';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function relativeFromNow(s: string | null | undefined): string {
  const d = parseApiDate(s);
  if (!d) return '';
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  if (Math.abs(mins) < 1) return 'now';
  const abs = Math.abs(mins);
  const text = abs < 60 ? `${abs} min` : abs < 1440 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  return mins > 0 ? `in ${text}` : `${text} ago`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('');

export const round1 = (n: number) => Math.round(n * 10) / 10;
