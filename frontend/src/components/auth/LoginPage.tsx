'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Heart, Key, Lock, Mail, ShieldAlert, Stethoscope, UserCheck } from 'lucide-react';
import { api, ApiError } from '../../services/api';
import type { AuthUser } from '../../types';
import {
  ALLERGEN_OPTIONS,
  CATEGORY_OPTIONS,
  COMORBIDITY_OPTIONS,
  DIABETES_OPTIONS,
  MEDICATION_OPTIONS,
  label,
} from '../../lib/format';
import { Button, ChipToggle, ErrorState, Field, inputClass } from '../ui';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
}

const DEMO_ACCOUNTS = [
  { role: 'Patient', email: 'alex.adeyemi@example.com', password: 'patient123', icon: UserCheck, cls: 'bg-[#16835D] hover:bg-[#123F35]' },
  { role: 'Clinician', email: 'dr.balogun@nutricare.clinic', password: 'clinician123', icon: Stethoscope, cls: 'bg-[#123F35] hover:bg-emerald-900' },
  { role: 'Admin', email: 'admin@nutricare.ai', password: 'admin123', icon: ShieldAlert, cls: 'bg-slate-800 hover:bg-slate-900' },
];

const STEPS = ['Account', 'About you', 'Diabetes baseline', 'Allergens & conditions', 'Food preferences', 'Meal reminders'];

interface RegisterForm {
  email: string;
  password: string;
  confirm: string;
  first_name: string;
  last_name: string;
  age: string;
  gender: string;
  diabetes_type: string;
  hba1c_latest: string;
  medication_risk_category: string;
  allergens: string[];
  comorbidities: string[];
  favorite_categories: string[];
  breakfast: string;
  lunch: string;
  dinner: string;
}

const EMPTY_FORM: RegisterForm = {
  email: '',
  password: '',
  confirm: '',
  first_name: '',
  last_name: '',
  age: '',
  gender: '',
  diabetes_type: 'type_2',
  hba1c_latest: '',
  medication_risk_category: 'low_metformin',
  allergens: [],
  comorbidities: [],
  favorite_categories: ['West African'],
  breakfast: '07:30',
  lunch: '12:30',
  dinner: '19:00',
};

/** Client-side checks per wizard step (server re-validates everything). */
function validateStep(step: number, f: RegisterForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
    if (f.password.length < 8) e.password = 'At least 8 characters';
    if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
  }
  if (step === 1) {
    if (!f.first_name.trim()) e.first_name = 'Required';
    if (!f.last_name.trim()) e.last_name = 'Required';
    const age = Number(f.age);
    if (!f.age || !Number.isInteger(age) || age < 18 || age > 120) e.age = 'Enter an age between 18 and 120';
    if (!f.gender) e.gender = 'Required';
  }
  if (step === 2) {
    const h = Number(f.hba1c_latest);
    if (!f.hba1c_latest || isNaN(h) || h < 3 || h > 20) e.hba1c_latest = 'Enter a value between 3 and 20';
  }
  return e;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof RegisterForm>(k: K, v: RegisterForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const doLogin = async (e: string, p: string, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await api.login(e, p);
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setBusy(null);
    }
  };

  const nextStep = () => {
    const errs = validateStep(step, form);
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) setStep(s => s + 1);
  };

  const submitRegistration = async () => {
    setBusy('register');
    setError(null);
    try {
      const res = await api.register({
        email: form.email.trim(),
        password: form.password,
        profile: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          age: Number(form.age),
          gender: form.gender,
          diabetes_type: form.diabetes_type,
          hba1c_latest: Number(form.hba1c_latest),
          medication_risk_category: form.medication_risk_category,
          allergens: form.allergens,
          comorbidities: form.comorbidities,
          favorite_categories: form.favorite_categories,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: { breakfast: form.breakfast, lunch: form.lunch, dinner: form.dinner },
      });
      onLoginSuccess(res.token, res.user);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setFieldErrors(err.errors);
        const accountFields = ['email', 'password'];
        if (Object.keys(err.errors).some(k => accountFields.includes(k))) setStep(0);
      }
      setError(err instanceof Error ? err.message : 'Registration failed');
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] grid grid-cols-1 lg:grid-cols-2">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#123F35] via-[#16835D] to-teal-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#16835D] flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">NutriCare AI</h1>
              <p className="text-xs text-emerald-200">Diabetic Dietary Recommendation & Reminder System</p>
            </div>
          </div>
          <div className="space-y-4 max-w-lg pt-4 lg:pt-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold font-heading leading-tight">Eat thoughtfully. Stay organized.</h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Meal suggestions ranked by a Random Forest model, screened first by a deterministic safety engine that removes allergens and
              meals over your clinician-approved carbohydrate and sodium limits.
            </p>
          </div>
        </div>
        <p className="relative z-10 text-xs text-emerald-200/70 pt-8">
          Nutrient data from FAO/INFOODS 2019 West African Food Composition Tables and USDA FoodData Central. Not a substitute for medical advice.
        </p>
      </div>

      {/* Form pane */}
      <div className="p-6 sm:p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {mode === 'login' && (
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 space-y-2.5">
              <span className="text-xs font-bold text-[#123F35] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#16835D]" /> Demo accounts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(d => {
                  const Icon = d.icon;
                  return (
                    <Button
                      key={d.role}
                      type="button"
                      busy={busy === d.role}
                      disabled={!!busy}
                      onClick={() => doLogin(d.email, d.password, d.role)}
                      className={`text-xs text-white ${d.cls}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {d.role}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex rounded-2xl bg-emerald-50 p-1 border border-emerald-100" role="tablist">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setFieldErrors({});
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === m ? 'bg-[#16835D] text-white shadow-sm' : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create patient account'}
              </button>
            ))}
          </div>

          {error && <ErrorState message={error} />}

          {mode === 'login' && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                doLogin(email.trim(), password, 'form');
              }}
            >
              <div>
                <h3 className="text-2xl font-bold text-[#123F35] font-heading">Sign in</h3>
                <p className="text-xs text-emerald-900/70">Your workspace opens based on your account role.</p>
              </div>
              <Field label="Email address">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-4 text-emerald-900/40" />
                  <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-4 text-emerald-900/40" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
              <Button type="submit" busy={busy === 'form'} disabled={!!busy} className="w-full py-3">
                Sign in <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {mode === 'register' && (
            <div className="space-y-4 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm">
              <div className="border-b border-emerald-900/10 pb-3">
                <span className="text-xs font-bold text-[#16835D]">
                  Step {step + 1} of {STEPS.length}
                </span>
                <h4 className="font-bold text-[#123F35]">{STEPS[step]}</h4>
                <div className="flex gap-1 mt-2">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#16835D]' : 'bg-emerald-100'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {step === 0 && (
                  <>
                    <Field label="Email address" error={fieldErrors.email}>
                      <input type="email" autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Password" error={fieldErrors.password} hint="At least 8 characters">
                      <input type="password" autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Confirm password" error={fieldErrors.confirm}>
                      <input type="password" autoComplete="new-password" value={form.confirm} onChange={e => set('confirm', e.target.value)} className={inputClass} />
                    </Field>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="First name" error={fieldErrors.first_name}>
                        <input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Last name" error={fieldErrors.last_name}>
                        <input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Age" error={fieldErrors.age}>
                        <input type="number" min={18} max={120} value={form.age} onChange={e => set('age', e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Gender" error={fieldErrors.gender}>
                        <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputClass}>
                          <option value="">Select…</option>
                          {['female', 'male', 'other'].map(g => (
                            <option key={g} value={g}>
                              {label(g)}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field label="Diabetes type" error={fieldErrors.diabetes_type}>
                      <select value={form.diabetes_type} onChange={e => set('diabetes_type', e.target.value)} className={inputClass}>
                        {DIABETES_OPTIONS.map(o => (
                          <option key={o} value={o}>
                            {label(o)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Latest HbA1c (%)" error={fieldErrors.hba1c_latest}>
                      <input type="number" step="0.1" value={form.hba1c_latest} onChange={e => set('hba1c_latest', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Main glucose-lowering medication" error={fieldErrors.medication_risk_category}>
                      <select value={form.medication_risk_category} onChange={e => set('medication_risk_category', e.target.value)} className={inputClass}>
                        {MEDICATION_OPTIONS.map(o => (
                          <option key={o} value={o}>
                            {label(o)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Field label="Food allergens" hint="Meals containing these are always excluded.">
                      <ChipToggle options={ALLERGEN_OPTIONS} value={form.allergens} onChange={v => set('allergens', v)} format={label} />
                    </Field>
                    <Field label="Other conditions" hint="Hypertension or kidney disease lowers your sodium limit.">
                      <ChipToggle options={COMORBIDITY_OPTIONS} value={form.comorbidities} onChange={v => set('comorbidities', v)} format={label} />
                    </Field>
                  </>
                )}
                {step === 4 && (
                  <Field label="Preferred cuisines" hint="Preferred cuisines rank higher in your recommendations.">
                    <ChipToggle options={CATEGORY_OPTIONS} value={form.favorite_categories} onChange={v => set('favorite_categories', v)} format={s => s} />
                  </Field>
                )}
                {step === 5 && (
                  <>
                    <p className="text-xs text-emerald-900/70">
                      Your calorie and carbohydrate targets start at standard defaults (1800 kcal, 45 g carbs per meal) until your clinician reviews them.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {(['breakfast', 'lunch', 'dinner'] as const).map(m => (
                        <Field key={m} label={label(m)} error={fieldErrors[m]}>
                          <input type="time" value={form[m]} onChange={e => set(m, e.target.value)} className={inputClass} />
                        </Field>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" disabled={step === 0 || !!busy} onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={nextStep}>
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button busy={busy === 'register'} onClick={submitRegistration}>
                    <CheckCircle className="w-4 h-4" /> Create account
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
