'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoginPage from '../components/auth/LoginPage';
import FoodDiaryView from '../components/patient/FoodDiaryView';
import {
  Heart,
  Calendar,
  Clock,
  Search,
  Bell,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  User,
  Activity,
  Plus,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Utensils,
  Stethoscope,
  ShieldCheck,
  Info,
  Lock,
  UserCheck,
  BarChart2,
  Users,
  Layers,
  BookOpen,
  FileText,
  Trash2,
  Edit3
} from 'lucide-react';
import { apiService } from '../services/api';
import { PatientProfile, RecommendationItem, GlucoseReading } from '../types';

export default function NutriCareApp() {
  const [role, setRole] = useState<'patient' | 'clinician' | 'admin'>('patient');
  const [userEmail, setUserEmail] = useState('alex.adeyemi@example.com');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Default to login page
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<RecommendationItem | null>(null);
  const [isGlucoseModalOpen, setIsGlucoseModalOpen] = useState(false);
  const [newGlucoseValue, setNewGlucoseValue] = useState('115');
  const [glucoseContext, setGlucoseContext] = useState('pre_meal');
  const [emergencyAlert, setEmergencyAlert] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily tracking state
  const [consumedCarbs, setConsumedCarbs] = useState(24.5);
  const [consumedCalories, setConsumedCalories] = useState(265);
  const [mealsRecorded, setMealsRecorded] = useState(1);

  useEffect(() => {
    async function loadData() {
      const p = await apiService.getProfile();
      setProfile(p);
      const recs = await apiService.getRecommendations();
      setRecommendations(recs);
      if (recs.length > 0) setSelectedMeal(recs[0]);

      setGlucoseReadings([
        {
          id: 'gluc-01',
          reading_mg_dl: 118.0,
          reading_mmol_l: 6.55,
          context: 'fasting',
          status: 'IN_TARGET',
          is_emergency_escalation: false,
          recorded_at: '2026-09-24 07:45',
        },
        {
          id: 'gluc-02',
          reading_mg_dl: 142.0,
          reading_mmol_l: 7.88,
          context: 'post_meal_2h',
          status: 'IN_TARGET',
          is_emergency_escalation: false,
          recorded_at: '2026-09-24 14:10',
        },
      ]);
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (userRole: 'patient' | 'clinician' | 'admin', email: string) => {
    setRole(userRole);
    setUserEmail(email);
    setIsLoggedIn(true);
    if (userRole === 'clinician') {
      setActiveNav('clinician-overview');
    } else if (userRole === 'admin') {
      setActiveNav('admin-ml');
    } else {
      setActiveNav('dashboard');
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setActiveNav('login');
  };

  const handleLogGlucose = async () => {
    const val = parseFloat(newGlucoseValue);
    if (isNaN(val)) return;

    const reading = await apiService.logGlucose(val, glucoseContext);
    setGlucoseReadings([reading, ...glucoseReadings]);
    setIsGlucoseModalOpen(false);

    if (reading.is_emergency_escalation && reading.evaluation) {
      setEmergencyAlert(reading.evaluation);
    } else {
      setEmergencyAlert(null);
    }
  };

  const handleMarkAsEaten = (meal: RecommendationItem) => {
    setConsumedCarbs(prev => Math.round((prev + meal.carbs_g) * 10) / 10);
    setConsumedCalories(prev => prev + Math.round(meal.energy_kcal));
    setMealsRecorded(prev => prev + 1);
    showToast(`Logged "${meal.title}" in your Food Diary!`);
  };

  // If user is not logged in, render the dedicated Login & Demo Account Page
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col md:flex-row w-full overflow-x-hidden">
      {/* 1. Desktop Left Sidebar (260px) */}
      <Sidebar
        currentRole={role}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onSignOut={handleSignOut}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Header / Navbar */}
        <Navbar
          activeNav={activeNav}
          currentRole={role}
          userEmail={userEmail}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSignOut={handleSignOut}
        />

        {/* Emergency Escalation Banner (ADA 2026 Hypoglycemia Alert) */}
        {emergencyAlert && (
          <div className="bg-red-50 border-b-2 border-red-500 text-red-950 px-4 py-3 shadow-md animate-fade-in">
            <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm sm:text-base">{emergencyAlert.alert_title}</h3>
                  <p className="text-xs sm:text-sm text-red-800 mt-0.5">{emergencyAlert.action_instructions}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-900 text-xs font-bold uppercase">
                      Protocol: ADA 2026 Rule of 15
                    </span>
                    <span className="text-xs text-red-700 font-medium">Dietitian notified automatically.</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEmergencyAlert(null)}
                className="text-red-700 hover:text-red-900 text-xs font-bold px-2 py-1 rounded bg-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-[#123F35] text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 border border-emerald-500/30 animate-bounce">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 mb-16 md:mb-8">
          {/* ========================================================================= */}
          {/* PATIENT PORTAL VIEWS */}
          {/* ========================================================================= */}
          {role === 'patient' && (
            <>
              {/* PATIENT VIEW 1: DASHBOARD */}
              {activeNav === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 rounded-3xl border border-emerald-900/10 shadow-xs">
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">Thursday, September 24</span>
                      <h2 className="text-2xl font-bold text-[#123F35] font-heading mt-0.5">
                        Good morning, {profile?.first_name || 'Alex'}
                      </h2>
                      <p className="text-sm text-emerald-900/70">
                        Here is your daily meal overview and upcoming reminder schedule.
                      </p>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#16835D] text-xs font-bold border border-emerald-300 flex items-center gap-1.5 w-fit">
                      <ShieldCheck className="w-4 h-4" /> Clinician Approved Plan Active
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
                      <span className="text-xs font-semibold text-emerald-900/60 uppercase">Meals Recorded</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-[#123F35] font-heading">{mealsRecorded} / 3</span>
                        <span className="text-xs text-emerald-700 font-medium">On Track</span>
                      </div>
                      <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-[#16835D] h-full rounded-full" style={{ width: `${(mealsRecorded / 3) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
                      <span className="text-xs font-semibold text-emerald-900/60 uppercase">Net Carbs Consumed</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-[#123F35] font-heading">{consumedCarbs}g</span>
                        <span className="text-xs text-emerald-900/60 font-medium">/ 130g max</span>
                      </div>
                      <div className="w-full bg-emerald-100 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(consumedCarbs / 130) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
                      <span className="text-xs font-semibold text-emerald-900/60 uppercase">Latest Glucose</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-[#123F35] font-heading">
                          {glucoseReadings[0]?.reading_mg_dl || 118}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700">mg/dL (Fasting)</span>
                      </div>
                      <button
                        onClick={() => setIsGlucoseModalOpen(true)}
                        className="mt-2 text-xs font-bold text-[#16835D] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Glucose Reading
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-900/10 shadow-xs">
                      <span className="text-xs font-semibold text-emerald-900/60 uppercase">Next Reminder</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-[#123F35] font-heading">12:30 PM</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold mt-1">Lunch · In 45 mins</p>
                    </div>
                  </div>

                  {/* Next Scheduled Meal Hero */}
                  {selectedMeal && (
                    <div className="bg-white rounded-3xl border border-emerald-900/10 p-6 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#16835D] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> Next Scheduled Meal · Lunch
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <img
                          src={selectedMeal.image_url}
                          alt={selectedMeal.title}
                          className="w-full md:w-64 h-48 object-cover rounded-2xl border border-emerald-100 shadow-inner"
                        />

                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16835D] text-xs font-bold border border-emerald-200">
                              {selectedMeal.regional_category}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                              Random Forest Fit: {(selectedMeal.confidence_score * 100).toFixed(0)}%
                            </span>
                          </div>

                          <h3 className="text-2xl font-bold text-[#123F35] font-heading">{selectedMeal.title}</h3>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                              <span className="text-[11px] text-emerald-900/60 font-semibold uppercase">Portion</span>
                              <p className="text-sm font-bold text-[#123F35]">{selectedMeal.portion_g}g</p>
                            </div>
                            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                              <span className="text-[11px] text-emerald-900/60 font-semibold uppercase">Net Carbs</span>
                              <p className="text-sm font-bold text-emerald-800">{selectedMeal.net_carbs_g}g</p>
                            </div>
                            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                              <span className="text-[11px] text-emerald-900/60 font-semibold uppercase">Fiber</span>
                              <p className="text-sm font-bold text-[#16835D]">{selectedMeal.fiber_g}g</p>
                            </div>
                            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                              <span className="text-[11px] text-emerald-900/60 font-semibold uppercase">Calories</span>
                              <p className="text-sm font-bold text-[#123F35]">{selectedMeal.energy_kcal} kcal</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                              onClick={() => handleMarkAsEaten(selectedMeal)}
                              className="px-4 py-2 rounded-xl bg-[#16835D] text-white text-sm font-bold hover:bg-[#123F35] transition-all flex items-center gap-2 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" /> Mark as Eaten
                            </button>
                            <button
                              onClick={() => setActiveNav('explore')}
                              className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-[#123F35] text-sm font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" /> Swap Dish
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PATIENT VIEW 2: RECOMMENDATIONS */}
              {activeNav === 'explore' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#123F35] font-heading">Dietary Recommendation Module</h3>
                    <p className="text-xs text-emerald-900/70">
                      Calculated against FAO/INFOODS 2019 and USDA databases, screened via Deterministic Safety Engine.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map(meal => (
                      <div key={meal.recipe_id} className="bg-white rounded-3xl border border-emerald-900/10 p-5 space-y-3 shadow-xs">
                        <img src={meal.image_url} alt={meal.title} className="w-full h-44 object-cover rounded-2xl" />
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#16835D] uppercase">{meal.regional_category}</span>
                          <span className="font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                            {(meal.confidence_score * 100).toFixed(0)}% Fit
                          </span>
                        </div>
                        <h4 className="font-bold text-[#123F35]">{meal.title}</h4>
                        <p className="text-xs text-emerald-900/70">{meal.portion_g}g portion · {meal.carbs_g}g carbs · {meal.fiber_g}g fiber</p>
                        <button
                          onClick={() => {
                            setSelectedMeal(meal);
                            setActiveNav('dashboard');
                            showToast(`Selected "${meal.title}" for your meal plan!`);
                          }}
                          className="w-full py-2 rounded-xl bg-[#16835D] text-white text-xs font-bold"
                        >
                          Select for Plan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PATIENT VIEW 3: WEEKLY MEAL PLANNER */}
              {activeNav === 'plan' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-[#123F35] font-heading">7-Day Weekly Meal Planner</h3>
                  <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b">
                      {['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24 (Today)', 'Fri 25', 'Sat 26', 'Sun 27'].map((d, i) => (
                        <button key={d} className={`px-4 py-2 rounded-xl text-xs font-bold ${i === 3 ? 'bg-[#16835D] text-white' : 'bg-emerald-50 text-emerald-950'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold uppercase text-emerald-800">Breakfast (08:00 AM)</span>
                          <p className="font-bold text-[#123F35] text-sm">Steamed Moi Moi with Fresh Spinach & Fish</p>
                        </div>
                        <span className="font-bold text-emerald-700">24.5g Carbs</span>
                      </div>
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold uppercase text-emerald-800">Lunch (12:30 PM)</span>
                          <p className="font-bold text-[#123F35] text-sm">Brown Beans Porridge with Steamed Pumpkin Greens</p>
                        </div>
                        <span className="font-bold text-emerald-700">37.0g Carbs</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PATIENT VIEW 4: SEEDED FOOD DIARY */}
              {activeNav === 'diary' && (
                <FoodDiaryView onAddMealClick={() => setActiveNav('explore')} />
              )}

              {/* PATIENT VIEW 5: GLUCOSE LOG */}
              {activeNav === 'glucose' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-emerald-900/10">
                    <div>
                      <h3 className="text-2xl font-bold text-[#123F35] font-heading">Glucose Diary & Escalation Log</h3>
                      <p className="text-xs text-emerald-900/70">ADA 2026 Emergency Escalation Protocols (Rule of 15)</p>
                    </div>
                    <button
                      onClick={() => setIsGlucoseModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#16835D] text-white text-xs font-bold hover:bg-[#123F35]"
                    >
                      + Log Glucose
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-emerald-900/10 p-5 space-y-3">
                    {glucoseReadings.map(g => (
                      <div key={g.id} className="p-4 rounded-2xl bg-emerald-50/50 border flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-[#123F35] text-base">{g.reading_mg_dl} mg/dL</span>
                          <span className="text-emerald-800 ml-2">({g.reading_mmol_l} mmol/L)</span>
                          <p className="text-[#16835D] font-semibold mt-0.5">{g.context} · {g.recorded_at}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#16835D] font-bold">
                          {g.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PATIENT VIEW 6: REMINDERS */}
              {activeNav === 'reminders' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-[#123F35] font-heading">Scheduled Reminders & Alarms</h3>
                  <div className="space-y-3">
                    {['Breakfast Alarm (07:30 AM)', 'Lunch Alarm (12:30 PM)', 'Dinner Alarm (07:00 PM)'].map(rem => (
                      <div key={rem} className="bg-white p-5 rounded-2xl border flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-[#123F35] text-sm">{rem}</h4>
                          <p className="text-xs text-emerald-800">Push notification & alarm enabled</p>
                        </div>
                        <button onClick={() => showToast('Reminder snoozed for 15m')} className="px-3 py-1.5 rounded-lg border text-xs font-bold text-[#123F35]">
                          Snooze 15m
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PATIENT VIEW 7: CLINICAL PROFILE */}
              {activeNav === 'profile' && profile && (
                <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 space-y-4">
                  <h3 className="text-xl font-bold text-[#123F35]">Clinical Dietary Profile</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Diabetes Type:</strong> {profile.diabetes_type}</p>
                    <p><strong>Medication Category:</strong> {profile.medication_risk_category}</p>
                    <p><strong>Meal Carb Cap:</strong> {profile.approved_carb_max_per_meal}g</p>
                    <p className="text-red-700"><strong>Registered Allergens:</strong> Tree Nuts (Walnuts, Cashews)</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* CLINICIAN PORTAL VIEWS */}
          {/* ========================================================================= */}
          {role === 'clinician' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-900 to-[#123F35] text-white p-6 rounded-3xl shadow-md">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Clinician Workspace</span>
                  <h2 className="text-2xl font-bold font-heading mt-0.5">Dr. Kemi Balogun, RD, CDE</h2>
                  <p className="text-xs text-emerald-200 mt-1">Metabolic & Endocrine Review Panel · 12 Assigned Patients</p>
                </div>
                <button
                  onClick={() => showToast("7-Day Meal Plan approved and locked with cryptographic timestamp.")}
                  className="px-4 py-2 rounded-xl bg-[#16835D] text-white font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-sm w-fit"
                >
                  <CheckCircle className="w-4 h-4" /> Lock & Approve Alex's Plan
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-emerald-900/10 p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-[#123F35] text-lg font-heading">Assigned Patient Directory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-emerald-50/70 text-emerald-900 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Condition</th>
                        <th className="p-3">HbA1c</th>
                        <th className="p-3">Adherence</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      <tr className="hover:bg-emerald-50/30">
                        <td className="p-3 font-bold text-[#123F35]">Alex Adeyemi (52y)</td>
                        <td className="p-3 text-emerald-900/70">Type 2 Diabetes</td>
                        <td className="p-3 font-semibold text-emerald-700">6.9%</td>
                        <td className="p-3 font-bold text-[#16835D]">92%</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#16835D] text-xs font-bold">
                            Approved Plan Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-emerald-50/30">
                        <td className="p-3 font-bold text-[#123F35]">Grace Okafor (61y)</td>
                        <td className="p-3 text-emerald-900/70">Type 2 Diabetes</td>
                        <td className="p-3 font-semibold text-amber-700">8.2%</td>
                        <td className="p-3 font-bold text-amber-600">68%</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                            Review Required
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ADMIN PORTAL VIEWS */}
          {/* ========================================================================= */}
          {role === 'admin' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">System Administration & ML Ops</span>
                <h2 className="text-2xl font-bold font-heading mt-0.5">NutriCare AI Engine Health</h2>
                <p className="text-xs text-slate-300 mt-1">Supervised Random Forest Classifier · Version rf-v1.0.0-fao-ada2026</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Model Accuracy</span>
                  <p className="text-3xl font-bold text-slate-900 mt-1 font-heading">95.83%</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">GroupShuffleSplit Holdout</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Macro F1 Score</span>
                  <p className="text-3xl font-bold text-slate-900 mt-1 font-heading">0.9388</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">High across all cohorts</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Safety Interceptions</span>
                  <p className="text-3xl font-bold text-slate-900 mt-1 font-heading">100%</p>
                  <p className="text-xs text-slate-600 mt-1">Zero allergen collisions</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 3. Global Minimalistic Footer */}
        <Footer />
      </div>

      {/* Glucose Entry Modal */}
      {isGlucoseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-emerald-900/10">
            <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
              <h3 className="font-bold text-lg text-[#123F35] font-heading flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#16835D]" /> Log Blood Glucose Reading
              </h3>
              <button onClick={() => setIsGlucoseModalOpen(false)} className="text-emerald-900/50 hover:text-emerald-950 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-emerald-900 uppercase">Glucose Reading (mg/dL)</label>
                <input
                  type="number"
                  value={newGlucoseValue}
                  onChange={e => setNewGlucoseValue(e.target.value)}
                  placeholder="e.g. 115"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-emerald-900/20 text-lg font-bold text-[#123F35] focus:ring-2 focus:ring-[#16835D]"
                />
                <p className="text-[11px] text-emerald-900/60 mt-1">
                  Equivalent to {newGlucoseValue ? (parseFloat(newGlucoseValue) / 18.0182).toFixed(2) : '--'} mmol/L
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-900 uppercase">Timing</label>
                <select
                  value={glucoseContext}
                  onChange={e => setGlucoseContext(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-emerald-900/20 text-sm font-semibold text-[#123F35] bg-white"
                >
                  <option value="fasting">Fasting (Morning)</option>
                  <option value="pre_meal">Pre-Meal</option>
                  <option value="post_meal_2h">2h Post-Meal</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button onClick={() => setIsGlucoseModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-emerald-900">
                Cancel
              </button>
              <button onClick={handleLogGlucose} className="flex-1 py-2 rounded-xl bg-[#16835D] text-white text-sm font-bold shadow-sm">
                Save Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
