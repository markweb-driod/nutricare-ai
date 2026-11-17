'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { ApiError } from '../services/api';

/** Loads async data with loading/error state and a reload() handle. */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fnRef.current());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);

  return { data, setData, error, loading, reload };
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors)[0];
    return first ? `${e.message}: ${first}` : e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white rounded-3xl border border-emerald-900/10 shadow-sm ${className}`}>{children}</div>;
}

const TONES = {
  good: 'bg-emerald-100 text-[#16835D] border-emerald-200',
  warn: 'bg-amber-100 text-amber-900 border-amber-200',
  bad: 'bg-red-100 text-red-800 border-red-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-emerald-900/70" role="status">
      <Loader2 className="w-5 h-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-900" role="alert">
      <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-bold underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-sm text-emerald-900/60 py-10">{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-2xl font-bold text-[#123F35] font-heading">{title}</h3>
        {subtitle && <p className="text-sm text-emerald-900/70 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-[#16835D] text-white hover:bg-[#123F35]',
  secondary: 'bg-white border border-emerald-300 text-[#123F35] hover:bg-emerald-50',
  danger: 'bg-white border border-red-300 text-red-700 hover:bg-red-50',
  ghost: 'text-emerald-900 hover:bg-emerald-50',
};

export function Button({
  variant = 'primary',
  busy = false,
  className = '',
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; busy?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export const inputClass =
  'w-full mt-1 px-3.5 py-2.5 rounded-xl border border-emerald-900/20 text-sm text-[#123F35] bg-white focus:ring-2 focus:ring-[#16835D] focus:outline-none';

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-emerald-900 uppercase">{label}</span>
      {children}
      {hint && !error && <span className="block text-[11px] text-emerald-900/60 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red-700 mt-1">{error}</span>}
    </label>
  );
}

export function ChipToggle({
  options,
  value,
  onChange,
  format,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  format: (s: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter(v => v !== o) : [...value, o])}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              on ? 'bg-[#16835D] text-white border-[#16835D]' : 'bg-white text-emerald-900 border-emerald-900/20 hover:bg-emerald-50'
            }`}
          >
            {format(o)}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-emerald-900/10 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
          <h3 className="font-bold text-lg text-[#123F35] font-heading flex items-center gap-2">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-emerald-900/60 hover:bg-emerald-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, className = 'bg-[#16835D]' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={max}>
      <div className={`h-full rounded-full ${over ? 'bg-red-500' : className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatCard({ label, value, sub, children }: { label: string; value: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-sm">
      <span className="text-xs font-semibold text-emerald-900/60 uppercase">{label}</span>
      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
        <span className="text-2xl font-bold text-[#123F35] font-heading">{value}</span>
        {sub && <span className="text-xs text-emerald-900/60 font-medium">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export function MealImage({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`${className} bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-bold`}>No image</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}
