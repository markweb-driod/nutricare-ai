'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BellOff,
  CheckCircle,
  Clock,
  Edit3,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { api } from '../../services/api';
import type { GlucoseReading, MealType, PatientProfile, RecommendationItem, Reminder } from '../../types';
import {
  ALLERGEN_OPTIONS,
  CATEGORY_OPTIONS,
  COMORBIDITY_OPTIONS,
  DIABETES_OPTIONS,
  MEAL_TYPES,
  MEDICATION_OPTIONS,
  addDays,
  formatClock,
  formatDateTime,
  formatTime,
  glucoseTone,
  greeting,
  isoDate,
  label,
  relativeFromNow,
  round1,
} from '../../lib/format';
import {
  Badge,
  Button,
  Card,
  ChipToggle,
  EmptyState,
  ErrorState,
  Field,
  Loading,
  MealImage,
  Modal,
  PageHeader,
  ProgressBar,
  StatCard,
  errorMessage,
  inputClass,
  useAsync,
} from '../ui';
import FoodDiaryView from './FoodDiaryView';

interface Props {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notify: (msg: string, tone?: 'good' | 'bad') => void;
  onDataChanged: () => void;
}

const SUITABILITY_TONE = { eligible: 'good', review_required: 'warn', not_recommended: 'bad' } as const;

function approvalBadge(profile: PatientProfile | null) {
  const s = profile?.plan_approval?.status;
  if (s === 'APPROVED') return <Badge tone="good"><ShieldCheck className="w-3.5 h-3.5" /> Clinician-approved plan</Badge>;
  if (s === 'CHANGES_REQUESTED') return <Badge tone="bad"><AlertTriangle className="w-3.5 h-3.5" /> Clinician requested changes</Badge>;
  return <Badge tone="warn"><Clock className="w-3.5 h-3.5" /> Plan awaiting clinician review</Badge>;
}

function nextReminder(reminders: Reminder[] | null): Reminder | null {
  if (!reminders) return null;
  return [...reminders].filter(r => r.next_trigger_at).sort((a, b) => a.next_trigger_at!.localeCompare(b.next_trigger_at!))[0] ?? null;
}

export default function PatientWorkspace({ activeNav, setActiveNav, searchQuery, setSearchQuery, notify, onDataChanged }: Props) {
  const today = isoDate(new Date());
  const profile = useAsync(() => api.getProfile());
  const recs = useAsync(() => api.getRecommendations());
  const glucose = useAsync(() => api.getGlucose());
  const todayLogs = useAsync(() => api.getMealLogs(today), [today]);
  const reminders = useAsync(() => api.getReminders());

  const [selected, setSelected] = useState<RecommendationItem | null>(null);
  const [logTarget, setLogTarget] = useState<RecommendationItem | null>(null);
  const [glucoseOpen, setGlucoseOpen] = useState(false);
  const [emergency, setEmergency] = useState<GlucoseReading['evaluation'] | null>(null);
  const [diaryKey, setDiaryKey] = useState(0);

  const recommendations = recs.data?.recommendations ?? [];
  const hero = selected ?? recommendations[0] ?? null;
  const upcoming = nextReminder(reminders.data);

  const afterMealLogged = () => {
    todayLogs.reload();
    recs.reload(); // variety score changes after logging
    setDiaryKey(k => k + 1);
    onDataChanged();
  };

  return (
    <>
      {emergency && (
        <div className="bg-red-50 border-2 border-red-500 text-red-950 px-4 py-3 rounded-2xl mb-6" role="alert">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">{emergency.alert_title}</h3>
                <p className="text-sm text-red-800 mt-0.5">{emergency.action_instructions}</p>
                <p className="text-xs text-red-700 font-medium mt-1">Your care team has been notified.</p>
              </div>
            </div>
            <button onClick={() => setEmergency(null)} className="text-red-800 text-xs font-bold px-2 py-1 rounded bg-red-100 hover:bg-red-200">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeNav === 'dashboard' && (
        <Dashboard
          profile={profile.data}
          profileError={profile.error}
          logs={todayLogs.data}
          glucose={glucose.data}
          upcoming={upcoming}
          hero={hero}
          heroLoading={recs.loading}
          heroError={recs.error}
          onRetry={() => (profile.reload(), recs.reload(), todayLogs.reload())}
          onLog={setLogTarget}
          onLogGlucose={() => setGlucoseOpen(true)}
          onSwap={() => setActiveNav('explore')}
        />
      )}

      {activeNav === 'explore' && (
        <Recommendations
          report={recs}
          query={searchQuery}
          setQuery={setSearchQuery}
          onSelect={r => {
            setSelected(r);
            setActiveNav('dashboard');
            notify(`"${r.title}" set as your next meal`);
          }}
          onLog={setLogTarget}
        />
      )}

      {activeNav === 'plan' && <MealPlanner recommendations={recommendations} loading={recs.loading} error={recs.error} profile={profile.data} />}

      {activeNav === 'diary' && (
        <FoodDiaryView
          key={diaryKey}
          profile={profile.data}
          onAddMealClick={() => setActiveNav('explore')}
          onChanged={() => (todayLogs.reload(), recs.reload(), onDataChanged())}
          notify={notify}
        />
      )}

      {activeNav === 'glucose' && <GlucoseLog state={glucose} onAdd={() => setGlucoseOpen(true)} />}

      {activeNav === 'reminders' && <Reminders state={reminders} notify={notify} onChanged={onDataChanged} />}

      {activeNav === 'profile' && (
        <ProfileView
          state={profile}
          notify={notify}
          onSaved={() => {
            recs.reload();
            onDataChanged();
          }}
        />
      )}

      {logTarget && (
        <LogMealModal
          meal={logTarget}
          defaultMealType={(upcoming?.meal_type as MealType) ?? 'lunch'}
          onClose={() => setLogTarget(null)}
          onLogged={title => {
            setLogTarget(null);
            notify(`Logged "${title}" in your food diary`);
            afterMealLogged();
          }}
        />
      )}

      {glucoseOpen && (
        <GlucoseModal
          onClose={() => setGlucoseOpen(false)}
          onSaved={reading => {
            setGlucoseOpen(false);
            glucose.reload();
            onDataChanged();
            if (reading.is_emergency_escalation && reading.evaluation) {
              setEmergency(reading.evaluation);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              notify(`Reading saved: ${reading.reading_mg_dl} mg/dL (${label(reading.status)})`, reading.status === 'IN_TARGET' ? 'good' : 'bad');
            }
          }}
        />
      )}
    </>
  );
}

// ======================================================================= Dashboard
function Dashboard(props: {
  profile: PatientProfile | null;
  profileError: string | null;
  logs: import('../../types').MealLog[] | null;
  glucose: GlucoseReading[] | null;
  upcoming: Reminder | null;
  hero: RecommendationItem | null;
  heroLoading: boolean;
  heroError: string | null;
  onRetry: () => void;
  onLog: (r: RecommendationItem) => void;
  onLogGlucose: () => void;
  onSwap: () => void;
}) {
  const { profile, logs, glucose, upcoming, hero } = props;
  const now = new Date();
  const mainMeals = new Set((logs ?? []).filter(l => l.meal_type !== 'snack').map(l => l.meal_type)).size;
  const netCarbs = round1((logs ?? []).reduce((a, l) => a + l.net_carbs_g, 0));
  const kcal = Math.round((logs ?? []).reduce((a, l) => a + l.energy_kcal, 0));
  const carbBudget = (profile?.approved_carb_max_per_meal ?? 45) * 3;
  const kcalTarget = profile?.daily_energy_kcal_target ?? 1800;
  const latest = glucose?.[0];

  return (
    <div className="space-y-6">
      {props.profileError && <ErrorState message={props.profileError} onRetry={props.onRetry} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 rounded-3xl border border-emerald-900/10">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h2 className="text-2xl font-bold text-[#123F35] font-heading mt-0.5">
            {greeting(now)}
            {profile ? `, ${profile.first_name}` : ''}
          </h2>
          <p className="text-sm text-emerald-900/70">Here is today&apos;s meal progress and your next reminder.</p>
        </div>
        {profile && approvalBadge(profile)}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Main meals logged" value={`${mainMeals} / 3`}>
          <ProgressBar value={mainMeals} max={3} />
        </StatCard>
        <StatCard label="Net carbs today" value={`${netCarbs} g`} sub={`/ ${carbBudget} g`}>
          <ProgressBar value={netCarbs} max={carbBudget} className="bg-teal-600" />
        </StatCard>
        <StatCard label="Latest glucose" value={latest ? latest.reading_mg_dl : '—'} sub={latest ? `mg/dL · ${label(latest.context)}` : 'No readings yet'}>
          <div className="flex items-center justify-between mt-2 gap-2">
            {latest && <Badge tone={glucoseTone(latest.status)}>{label(latest.status)}</Badge>}
            <button onClick={props.onLogGlucose} className="text-xs font-bold text-[#16835D] hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </div>
        </StatCard>
        <StatCard
          label="Next reminder"
          value={upcoming ? formatTime(upcoming.next_trigger_at) : '—'}
          sub={upcoming ? `${label(upcoming.meal_type)} · ${relativeFromNow(upcoming.next_trigger_at)}` : 'All reminders off'}
        />
      </div>

      <StatCard label="Calories today" value={`${kcal} kcal`} sub={`/ ${kcalTarget} kcal target`}>
        <ProgressBar value={kcal} max={kcalTarget} />
      </StatCard>

      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#16835D] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Suggested {upcoming ? label(upcoming.meal_type) : 'meal'}
        </div>
        {props.heroLoading && !hero && <Loading label="Finding a suitable meal…" />}
        {props.heroError && <ErrorState message={props.heroError} onRetry={props.onRetry} />}
        {!props.heroLoading && !props.heroError && !hero && <EmptyState>No meals currently pass your safety filters. Ask your clinician to review your plan.</EmptyState>}
        {hero && (
          <div className="flex flex-col md:flex-row gap-6 items-center pt-6 md:pt-0">
            <MealImage src={hero.image_url} alt={hero.title} className="w-full md:w-64 h-48 object-cover rounded-2xl border border-emerald-100" />
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="good">{hero.regional_category}</Badge>
                <Badge tone={SUITABILITY_TONE[hero.suitability]}>
                  {label(hero.suitability)} · {(hero.confidence_score * 100).toFixed(0)}% model confidence
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-[#123F35] font-heading">{hero.title}</h3>
              <Macros meal={hero} />
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={() => props.onLog(hero)}>
                  <CheckCircle className="w-4 h-4" /> Mark as eaten
                </Button>
                <Button variant="secondary" onClick={props.onSwap}>
                  <RefreshCw className="w-4 h-4" /> Choose another
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Macros({ meal }: { meal: { portion_g: number; net_carbs_g: number; fiber_g: number; energy_kcal: number } }) {
  const items = [
    ['Portion', `${meal.portion_g} g`],
    ['Net carbs', `${meal.net_carbs_g} g`],
    ['Fiber', `${meal.fiber_g} g`],
    ['Calories', `${Math.round(meal.energy_kcal)} kcal`],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
          <span className="text-[11px] text-emerald-900/60 font-semibold uppercase">{k}</span>
          <p className="text-sm font-bold text-[#123F35]">{v}</p>
        </div>
      ))}
    </div>
  );
}

// ======================================================================= Recommendations
function Recommendations({
  report,
  query,
  setQuery,
  onSelect,
  onLog,
}: {
  report: ReturnType<typeof useAsync<import('../../types').RecommendationReport>>;
  query: string;
  setQuery: (q: string) => void;
  onSelect: (r: RecommendationItem) => void;
  onLog: (r: RecommendationItem) => void;
}) {
  const all = report.data?.recommendations ?? [];
  const q = query.toLowerCase();
  const list = q ? all.filter(r => `${r.title} ${r.regional_category} ${r.preparation_method}`.toLowerCase().includes(q)) : all;
  const rejected = report.data?.safety_rejected ?? report.data?.rejected_count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended meals"
        subtitle="Screened by the safety engine against your allergens and limits, then ranked by the ML model, your preferences, and variety."
        action={
          <Button variant="secondary" onClick={report.reload} busy={report.loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by name, cuisine or cooking method…"
          aria-label="Filter recommendations"
          className={`${inputClass} sm:max-w-sm mt-0`}
        />
        {report.data && (
          <p className="text-xs text-emerald-900/70">
            {report.data.total_evaluated ?? all.length} meals evaluated · {rejected} removed by safety rules · {all.length} shown
          </p>
        )}
      </div>

      {report.error && <ErrorState message={report.error} onRetry={report.reload} />}
      {report.loading && !report.data && <Loading label="Running safety checks and ML ranking…" />}
      {report.data && list.length === 0 && (
        <EmptyState>{q ? `No recommended meals match "${query}".` : report.data.message || 'No meals passed your safety filters.'}</EmptyState>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {list.map(meal => (
          <Card key={meal.recipe_id} className="p-5 flex flex-col gap-3">
            <MealImage src={meal.image_url} alt={meal.title} className="w-full h-44 object-cover rounded-2xl" />
            <div className="flex justify-between items-center gap-2 text-xs">
              <span className="font-bold text-[#16835D] uppercase">{meal.regional_category}</span>
              <Badge tone={SUITABILITY_TONE[meal.suitability]}>
                {label(meal.suitability)} · {(meal.confidence_score * 100).toFixed(0)}%
              </Badge>
            </div>
            <h4 className="font-bold text-[#123F35]">{meal.title}</h4>
            <p className="text-xs text-emerald-900/70">
              {meal.portion_g} g · {meal.carbs_g} g carbs ({meal.net_carbs_g} g net) · {meal.fiber_g} g fiber · {Math.round(meal.energy_kcal)} kcal · {meal.sodium_mg} mg sodium
            </p>
            {meal.clinical_rationale.length > 0 && (
              <ul className="text-xs text-emerald-900/80 space-y-1 list-disc pl-4">
                {meal.clinical_rationale.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {!meal.is_auto_recommended && <p className="text-xs text-amber-800 font-semibold">Check with your clinician before choosing this meal.</p>}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
              <Button variant="secondary" className="text-xs" onClick={() => onSelect(meal)}>
                Set as next meal
              </Button>
              <Button className="text-xs" onClick={() => onLog(meal)}>
                Log as eaten
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ======================================================================= Meal planner
function MealPlanner({
  recommendations,
  loading,
  error,
  profile,
}: {
  recommendations: RecommendationItem[];
  loading: boolean;
  error: string | null;
  profile: PatientProfile | null;
}) {
  const todayDate = new Date();
  const monday = addDays(todayDate, -((todayDate.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const [dayIdx, setDayIdx] = useState((todayDate.getDay() + 6) % 7);

  const pool = recommendations.filter(r => r.is_auto_recommended);
  const plan = useMemo(() => {
    if (pool.length === 0) return [];
    // Deterministic rotation so each day differs and no meal repeats within a day when possible.
    return days.map((_, d) => (['breakfast', 'lunch', 'dinner'] as const).map((m, j) => ({ meal_type: m, meal: pool[(d * 3 + j) % pool.length] })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.map(p => p.recipe_id).join()]);

  const dayPlan = plan[dayIdx] ?? [];
  const dayCarbs = round1(dayPlan.reduce((a, p) => a + p.meal.carbs_g, 0));
  const dayKcal = Math.round(dayPlan.reduce((a, p) => a + p.meal.energy_kcal, 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly meal planner"
        subtitle={`Week of ${monday.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}. Built from your auto-approved recommendations.`}
        action={profile && approvalBadge(profile)}
      />
      {error && <ErrorState message={error} />}
      {loading && plan.length === 0 && <Loading />}
      {!loading && !error && plan.length === 0 && <EmptyState>No auto-approved meals are available to build a plan yet.</EmptyState>}
      {plan.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-emerald-900/10">
            {days.map((d, i) => {
              const isToday = isoDate(d) === isoDate(todayDate);
              return (
                <button
                  key={i}
                  onClick={() => setDayIdx(i)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${i === dayIdx ? 'bg-[#16835D] text-white' : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'}`}
                >
                  {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  {isToday ? ' (today)' : ''}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-emerald-900/70">
            Day total: {dayCarbs} g carbs · {dayKcal} kcal
            {profile ? ` (target ${profile.daily_energy_kcal_target} kcal, max ${profile.approved_carb_max_per_meal} g carbs per meal)` : ''}
          </p>
          <div className="space-y-3">
            {dayPlan.map(({ meal_type, meal }) => (
              <div key={meal_type} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-900/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-3">
                  <MealImage src={meal.image_url} alt={meal.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800">{label(meal_type)}</span>
                    <p className="font-bold text-[#123F35] text-sm">{meal.title}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {meal.carbs_g} g carbs · {Math.round(meal.energy_kcal)} kcal
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ======================================================================= Glucose
function GlucoseLog({ state, onAdd }: { state: ReturnType<typeof useAsync<GlucoseReading[]>>; onAdd: () => void }) {
  const readings = state.data ?? [];
  const inRange = readings.filter(r => r.status === 'IN_TARGET').length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Glucose log"
        subtitle="Low readings (< 70 mg/dL) and very high readings (> 300 mg/dL) alert your care team automatically."
        action={
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4" /> Log glucose
          </Button>
        }
      />
      {readings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Readings" value={readings.length} />
          <StatCard label="In target" value={`${Math.round((inRange / readings.length) * 100)}%`} />
          <StatCard label="Average" value={Math.round(readings.reduce((a, r) => a + r.reading_mg_dl, 0) / readings.length)} sub="mg/dL" />
        </div>
      )}
      <Card className="p-5 space-y-3">
        {state.error && <ErrorState message={state.error} onRetry={state.reload} />}
        {state.loading && !state.data && <Loading />}
        {state.data && readings.length === 0 && <EmptyState>No readings yet. Log your first reading to start tracking.</EmptyState>}
        {readings.map(g => (
          <div key={g.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex justify-between items-center gap-3">
            <div>
              <span className="font-bold text-[#123F35] text-base">{g.reading_mg_dl} mg/dL</span>
              <span className="text-xs text-emerald-800 ml-2">({g.reading_mmol_l} mmol/L)</span>
              <p className="text-xs text-[#16835D] font-semibold mt-0.5">
                {label(g.context)} · {formatDateTime(g.recorded_at)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={glucoseTone(g.status)}>{label(g.status)}</Badge>
              {g.is_emergency_escalation && <span className="text-[10px] font-bold text-red-700">Care team notified</span>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function GlucoseModal({ onClose, onSaved }: { onClose: () => void; onSaved: (r: GlucoseReading) => void }) {
  const [value, setValue] = useState('');
  const [context, setContext] = useState('pre_meal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = parseFloat(value);
  const valid = !isNaN(num) && num >= 10 && num <= 1000;

  const save = async () => {
    if (!valid) {
      setError('Enter a reading between 10 and 1000 mg/dL');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.logGlucose(num, context));
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        <>
          <Activity className="w-5 h-5 text-[#16835D]" /> Log blood glucose
        </>
      }
      onClose={onClose}
    >
      <form
        className="space-y-3"
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Reading (mg/dL)" hint={valid ? `≈ ${(num / 18.0182).toFixed(2)} mmol/L` : 'Between 10 and 1000'}>
          <input type="number" inputMode="decimal" autoFocus value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 115" className={`${inputClass} text-lg font-bold`} />
        </Field>
        <Field label="Timing">
          <select value={context} onChange={e => setContext(e.target.value)} className={inputClass}>
            {['fasting', 'pre_meal', 'post_meal_2h', 'bedtime'].map(c => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
        </Field>
        {error && <ErrorState message={error} />}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" busy={busy}>
            Save reading
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ======================================================================= Log meal
function LogMealModal({
  meal,
  defaultMealType,
  onClose,
  onLogged,
}: {
  meal: RecommendationItem;
  defaultMealType: MealType;
  onClose: () => void;
  onLogged: (title: string) => void;
}) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [portion, setPortion] = useState(String(meal.portion_g));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p = parseFloat(portion);
  const ratio = !isNaN(p) && p > 0 ? p / meal.portion_g : 1;

  const save = async () => {
    if (isNaN(p) || p < 20 || p > 1500) {
      setError('Portion must be between 20 and 1500 g');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.logMeal(meal.recipe_id, mealType, p);
      onLogged(meal.title);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        <>
          <Utensils className="w-5 h-5 text-[#16835D]" /> Log meal
        </>
      }
      onClose={onClose}
    >
      <p className="font-bold text-[#123F35]">{meal.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meal">
          <select value={mealType} onChange={e => setMealType(e.target.value as MealType)} className={inputClass}>
            {MEAL_TYPES.map(m => (
              <option key={m} value={m}>
                {label(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Portion (g)">
          <input type="number" value={portion} onChange={e => setPortion(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <p className="text-xs text-emerald-900/70">
        This portion: {round1(meal.carbs_g * ratio)} g carbs · {Math.round(meal.energy_kcal * ratio)} kcal
      </p>
      {error && <ErrorState message={error} />}
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" busy={busy} onClick={save}>
          Log meal
        </Button>
      </div>
    </Modal>
  );
}

// ======================================================================= Reminders
function Reminders({
  state,
  notify,
  onChanged,
}: {
  state: ReturnType<typeof useAsync<Reminder[]>>;
  notify: Props['notify'];
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; time: string } | null>(null);

  const update = async (id: string, fn: () => Promise<Reminder>, msg: string) => {
    setBusyId(id);
    try {
      const updated = await fn();
      state.setData(prev => (prev ?? []).map(r => (r.id === id ? updated : r)));
      notify(msg);
      onChanged();
    } catch (e) {
      notify(errorMessage(e), 'bad');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Meal reminders" subtitle="Set when you want to be reminded to eat. Times use your profile's timezone." />
      {state.error && <ErrorState message={state.error} onRetry={state.reload} />}
      {state.loading && !state.data && <Loading />}
      <div className="space-y-3">
        {(state.data ?? []).map(r => (
          <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-[#123F35]">
                {label(r.meal_type)} · {formatClock(r.time)}
              </h4>
              <p className="text-xs text-emerald-800">
                {r.is_enabled
                  ? `Next: ${formatDateTime(r.next_trigger_at)} (${relativeFromNow(r.next_trigger_at)})${r.snoozed_until ? ' · snoozed' : ''}`
                  : 'Reminder off'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editing?.id === r.id ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    update(r.id, () => api.updateReminder(r.id, { time: editing.time }), `${label(r.meal_type)} reminder moved to ${formatClock(editing.time)}`).then(() =>
                      setEditing(null),
                    );
                  }}
                >
                  <input type="time" required value={editing.time} onChange={e => setEditing({ id: r.id, time: e.target.value })} className={`${inputClass} mt-0 py-1.5`} />
                  <Button type="submit" busy={busyId === r.id} className="text-xs">
                    Save
                  </Button>
                  <Button type="button" variant="ghost" className="text-xs" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <Button variant="secondary" className="text-xs" onClick={() => setEditing({ id: r.id, time: r.time })}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit time
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    disabled={!r.is_enabled || busyId === r.id}
                    onClick={() => update(r.id, () => api.snoozeReminder(r.id, 15), `${label(r.meal_type)} reminder snoozed 15 minutes`)}
                  >
                    <BellOff className="w-3.5 h-3.5" /> Snooze 15m
                  </Button>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#123F35] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#16835D]"
                      checked={r.is_enabled}
                      disabled={busyId === r.id}
                      onChange={e =>
                        update(r.id, () => api.updateReminder(r.id, { is_enabled: e.target.checked }), `${label(r.meal_type)} reminder ${e.target.checked ? 'on' : 'off'}`)
                      }
                    />
                    On
                  </label>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ======================================================================= Profile
function ProfileView({
  state,
  notify,
  onSaved,
}: {
  state: ReturnType<typeof useAsync<PatientProfile>>;
  notify: Props['notify'];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PatientProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const p = state.data;

  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!p) return <Loading />;

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setErrors({});
    try {
      const updated = await api.updateProfile({
        first_name: draft.first_name,
        last_name: draft.last_name,
        age: Number(draft.age),
        gender: draft.gender,
        diabetes_type: draft.diabetes_type,
        hba1c_latest: Number(draft.hba1c_latest),
        medication_risk_category: draft.medication_risk_category,
        allergens: draft.allergens,
        comorbidities: draft.comorbidities,
        favorite_categories: draft.favorite_categories,
      });
      state.setData(updated);
      setEditing(false);
      notify(updated.plan_approval?.status === 'APPROVED' ? 'Profile saved' : 'Profile saved. Your clinician will review the clinical changes.');
      onSaved();
    } catch (e: any) {
      setErrors(e?.errors ?? {});
      notify(errorMessage(e), 'bad');
    } finally {
      setBusy(false);
    }
  };

  const d = draft ?? p;
  const set = <K extends keyof PatientProfile>(k: K, v: PatientProfile[K]) => setDraft(prev => ({ ...(prev ?? p), [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical profile"
        subtitle="Your profile drives the safety filters applied to every recommendation."
        action={
          !editing && (
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(p);
                setEditing(true);
              }}
            >
              <Edit3 className="w-4 h-4" /> Edit profile
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          {!editing ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Name', `${p.first_name} ${p.last_name}`],
                ['Age / gender', `${p.age} · ${label(p.gender)}`],
                ['Diabetes type', label(p.diabetes_type)],
                ['Latest HbA1c', `${p.hba1c_latest}%`],
                ['Medication', label(p.medication_risk_category)],
                ['Timezone', p.timezone],
                ['Allergens', p.allergens.length ? p.allergens.map(label).join(', ') : 'None declared'],
                ['Other conditions', p.comorbidities.length ? p.comorbidities.map(label).join(', ') : 'None'],
                ['Preferred cuisines', p.favorite_categories.length ? p.favorite_categories.join(', ') : 'No preference'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase text-emerald-900/60">{k}</dt>
                  <dd className={`font-semibold text-[#123F35] ${k === 'Allergens' && p.allergens.length ? 'text-red-700' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                save();
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First name" error={errors.first_name}>
                  <input required value={d.first_name} onChange={e => set('first_name', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Last name" error={errors.last_name}>
                  <input required value={d.last_name} onChange={e => set('last_name', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Age" error={errors.age}>
                  <input type="number" min={18} max={120} required value={d.age} onChange={e => set('age', e.target.value as any)} className={inputClass} />
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <select value={d.gender} onChange={e => set('gender', e.target.value as any)} className={inputClass}>
                    {['female', 'male', 'other'].map(g => (
                      <option key={g} value={g}>
                        {label(g)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Diabetes type" error={errors.diabetes_type}>
                  <select value={d.diabetes_type} onChange={e => set('diabetes_type', e.target.value)} className={inputClass}>
                    {DIABETES_OPTIONS.map(o => (
                      <option key={o} value={o}>
                        {label(o)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Latest HbA1c (%)" error={errors.hba1c_latest}>
                  <input type="number" step="0.1" min={3} max={20} required value={d.hba1c_latest} onChange={e => set('hba1c_latest', e.target.value as any)} className={inputClass} />
                </Field>
              </div>
              <Field label="Medication" error={errors.medication_risk_category}>
                <select value={d.medication_risk_category} onChange={e => set('medication_risk_category', e.target.value)} className={inputClass}>
                  {MEDICATION_OPTIONS.map(o => (
                    <option key={o} value={o}>
                      {label(o)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Allergens" error={errors.allergens}>
                <ChipToggle options={ALLERGEN_OPTIONS} value={d.allergens} onChange={v => set('allergens', v)} format={label} />
              </Field>
              <Field label="Other conditions" error={errors.comorbidities}>
                <ChipToggle options={COMORBIDITY_OPTIONS} value={d.comorbidities} onChange={v => set('comorbidities', v)} format={label} />
              </Field>
              <Field label="Preferred cuisines" error={errors.favorite_categories}>
                <ChipToggle options={CATEGORY_OPTIONS} value={d.favorite_categories} onChange={v => set('favorite_categories', v)} format={s => s} />
              </Field>
              <p className="text-xs text-amber-800">Changing diabetes type, HbA1c, medication, allergens or conditions sends your plan back to your clinician for review.</p>
              <div className="flex gap-3">
                <Button type="submit" busy={busy}>
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
        <Card className="p-6 space-y-3 h-fit">
          <h4 className="font-bold text-[#123F35]">Clinician-set targets</h4>
          <p className="text-sm">
            <strong>{p.daily_energy_kcal_target}</strong> kcal per day
          </p>
          <p className="text-sm">
            <strong>{p.approved_carb_max_per_meal} g</strong> carbohydrate maximum per meal
          </p>
          <p className="text-sm">Sodium limit: {p.comorbidities.includes('hypertension') || p.has_renal_restriction ? '650' : '950'} mg per meal</p>
          <div className="pt-2 border-t border-emerald-900/10 space-y-1">
            <p className="text-xs text-emerald-900/70">{p.assigned_clinician.name}</p>
            {approvalBadge(p)}
            {p.plan_approval?.note && <p className="text-xs text-emerald-900/70">Note: {p.plan_approval.note}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
