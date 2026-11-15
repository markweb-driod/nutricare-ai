'use client';

import React, { useState } from 'react';
import {
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  UserCheck,
  Stethoscope,
  ShieldAlert,
  CheckCircle,
  Key
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: 'patient' | 'clinician' | 'admin', userEmail: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'wizard'>('login');
  const [email, setEmail] = useState('alex.adeyemi@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [accountType, setAccountType] = useState<'patient' | 'clinician' | 'admin'>('patient');
  const [wizardStep, setWizardStep] = useState(1);

  // Autofill and direct login helpers
  const autofillDemoAccount = (role: 'patient' | 'clinician' | 'admin') => {
    if (role === 'patient') {
      setEmail('alex.adeyemi@example.com');
      setPassword('patient123');
      setAccountType('patient');
      onLoginSuccess('patient', 'alex.adeyemi@example.com');
    } else if (role === 'clinician') {
      setEmail('dr.balogun@nutricare.clinic');
      setPassword('clinician123');
      setAccountType('clinician');
      onLoginSuccess('clinician', 'dr.balogun@nutricare.clinic');
    } else if (role === 'admin') {
      setEmail('admin@nutricare.ai');
      setPassword('admin123');
      setAccountType('admin');
      onLoginSuccess('admin', 'admin@nutricare.ai');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col justify-between">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Hero Pane (Product Messaging & Fresh Visuals) */}
        <div className="bg-gradient-to-br from-[#123F35] via-[#16835D] to-teal-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#16835D] flex items-center justify-center font-bold shadow-lg">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-heading">NutriCare AI</h1>
                <p className="text-xs text-emerald-200">Diabetic Dietary Recommendation & Reminder System</p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg pt-8">
              <span className="px-3.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-xs font-bold uppercase tracking-wider">
                ADA 2026 Standards of Care Aligned
              </span>
              <h2 className="text-4xl font-extrabold font-heading leading-tight">
                Eat thoughtfully. Stay organized.
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Supervised Random Forest Classifier with Isotonic Calibration (95.83% accuracy) combined with a Deterministic Safety Engine for zero-tolerance allergen filtering.
              </p>
            </div>

            {/* Live Meal Card Preview */}
            <div className="pt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl space-y-3 max-w-md">
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" /> Next Scheduled Meal · Lunch
                  </span>
                  <span className="bg-emerald-400/30 px-2 py-0.5 rounded text-[10px] font-bold">96% ML Fit</span>
                </div>
                <h4 className="font-bold text-lg text-white">Steamed Moi Moi with Fresh Spinach & Fish</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold pt-1">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-200 block">Portion</span> 250g
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-200 block">Net Carbs</span> 16.3g
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-200 block">Fiber</span> 8.2g
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-emerald-200 block">Calories</span> 265 kcal
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-emerald-200/70 pt-8">
            Calibrated against FAO/INFOODS 2019 West African Food Composition Tables and USDA FoodData Central.
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="p-8 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* ONE-CLICK DEMO AUTOFILL BUTTONS HEADER */}
            <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 space-y-2.5">
              <span className="text-xs font-bold text-[#123F35] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#16835D]" /> One-Click Demo Account Login:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => autofillDemoAccount('patient')}
                  className="py-2 px-3 rounded-xl bg-[#16835D] text-white text-xs font-bold hover:bg-[#123F35] transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Patient Demo
                </button>
                <button
                  type="button"
                  onClick={() => autofillDemoAccount('clinician')}
                  className="py-2 px-3 rounded-xl bg-[#123F35] text-white text-xs font-bold hover:bg-emerald-900 transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <Stethoscope className="w-3.5 h-3.5" /> Clinician Demo
                </button>
                <button
                  type="button"
                  onClick={() => autofillDemoAccount('admin')}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin Demo
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-emerald-50 p-1 border border-emerald-100">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login' ? 'bg-[#16835D] text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register' ? 'bg-[#16835D] text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setMode('wizard')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'wizard' ? 'bg-[#16835D] text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                6-Step Wizard
              </button>
            </div>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  onLoginSuccess(accountType, email);
                }}
              >
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#123F35] font-heading">Sign In to NutriCare AI</h3>
                  <p className="text-xs text-emerald-900/70">Enter your credentials or click a demo account above</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-emerald-900 uppercase">Email Address</label>
                    <div className="relative mt-1">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-900/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:ring-2 focus:ring-[#16835D] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-900 uppercase">Password</label>
                    <div className="relative mt-1">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-900/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:ring-2 focus:ring-[#16835D] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-900 uppercase">Portal Persona</label>
                    <select
                      value={accountType}
                      onChange={e => setAccountType(e.target.value as any)}
                      className="w-full mt-1 px-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm font-semibold text-[#123F35] bg-white"
                    >
                      <option value="patient">Patient Portal (Alex Adeyemi)</option>
                      <option value="clinician">Clinician Portal (Dr. Kemi Balogun)</option>
                      <option value="admin">Admin / ML Ops Portal</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#16835D] text-white text-sm font-bold hover:bg-[#123F35] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Sign In to Workspace <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  setMode('wizard');
                }}
              >
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#123F35] font-heading">Register Account</h3>
                  <p className="text-xs text-emerald-900/70">Create a personalized diabetic dietary profile</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-emerald-900 uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="Alex Adeyemi"
                      className="w-full mt-1 px-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:ring-2 focus:ring-[#16835D] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-900 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      className="w-full mt-1 px-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm focus:ring-2 focus:ring-[#16835D] focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#16835D] text-white text-sm font-bold hover:bg-[#123F35] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Start 6-Step Clinical Intake <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* 6-STEP INTAKE WIZARD */}
            {mode === 'wizard' && (
              <div className="space-y-4 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
                  <div>
                    <span className="text-xs font-bold text-[#16835D]">Step {wizardStep} of 6</span>
                    <h4 className="font-bold text-[#123F35]">
                      {wizardStep === 1 && '1. Basic Demographics'}
                      {wizardStep === 2 && '2. Diabetes Baseline'}
                      {wizardStep === 3 && '3. Food Allergens'}
                      {wizardStep === 4 && '4. Culture & Staples'}
                      {wizardStep === 5 && '5. Clinician Targets'}
                      {wizardStep === 6 && '6. Reminder Schedule'}
                    </h4>
                  </div>
                </div>

                <div className="text-xs space-y-2 py-2">
                  {wizardStep === 1 && <p>Demographics: Age 52, Gender Male, Timezone Africa/Lagos.</p>}
                  {wizardStep === 2 && <p>Clinical Status: Type 2 Diabetes, Metformin therapy, HbA1c 6.9%.</p>}
                  {wizardStep === 3 && <p className="text-red-700 font-bold">Exclusion Registry: Tree Nuts (Walnuts, Cashews).</p>}
                  {wizardStep >= 4 && <p>Dietary Culture: West African indigenous staples (Moi moi, brown beans, okra soup).</p>}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    disabled={wizardStep === 1}
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40"
                  >
                    Back
                  </button>
                  {wizardStep < 6 ? (
                    <button
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="px-4 py-1.5 rounded-lg bg-[#16835D] text-white text-xs font-bold"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      onClick={() => onLoginSuccess('patient', 'alex.adeyemi@example.com')}
                      className="px-4 py-1.5 rounded-lg bg-[#123F35] text-white text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Complete & Open Portal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
