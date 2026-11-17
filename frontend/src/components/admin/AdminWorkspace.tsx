'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { formatDateTime, label } from '../../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageHeader, StatCard, useAsync } from '../ui';

const SERVICE_TONE = { healthy: 'good', degraded: 'warn', offline: 'bad' } as const;

export default function AdminWorkspace({ activeNav }: { activeNav: string }) {
  return (
    <div className="space-y-6">
      {activeNav === 'admin-overview' && <Overview />}
      {activeNav === 'admin-ml' && <MlOps />}
      {activeNav === 'admin-safety' && <Safety />}
      {activeNav === 'admin-audit' && <Audit />}
    </div>
  );
}

function Overview() {
  const o = useAsync(() => api.getAdminOverview());
  if (o.error) return <ErrorState message={o.error} onRetry={o.reload} />;
  if (!o.data) return <Loading />;
  const d = o.data;
  return (
    <>
      <PageHeader
        title="System overview"
        action={
          <Button variant="secondary" onClick={o.reload} busy={o.loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="REST API" value={<Badge tone="good">{d.services.api}</Badge>} />
        <StatCard label="ML inference service" value={<Badge tone={SERVICE_TONE[d.services.ml]}>{d.services.ml}</Badge>}>
          {d.services.ml !== 'healthy' && <p className="text-xs text-amber-800 mt-2">Recommendations are using the heuristic fallback scorer.</p>}
        </StatCard>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Patients" value={d.patients} />
        <StatCard label="Clinicians" value={d.users_by_role.clinician ?? 0} />
        <StatCard label="Recipes" value={d.recipes} />
        <StatCard label="Glucose readings" value={d.glucose_readings} />
        <StatCard label="Glucose escalations" value={d.glucose_escalations} />
        <StatCard label="Meal logs" value={d.meal_logs} />
      </div>
    </>
  );
}

function MlOps() {
  const s = useAsync(() => api.getMlStatus());
  if (s.error) return <ErrorState message={s.error} onRetry={s.reload} />;
  if (!s.data) return <Loading />;
  const { online, model, health } = s.data;
  const m = model?.metrics;
  return (
    <>
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400">ML model operations</span>
        <h2 className="text-2xl font-bold font-heading mt-0.5">{model?.model_name ?? 'ML service'}</h2>
        <p className="text-sm text-slate-300 mt-1">
          {online ? `Version ${model?.version} · ${health?.model_loaded ? 'model loaded' : 'heuristic mode (model file missing)'}` : 'Service offline: recommendations use the PHP fallback scorer'}
        </p>
      </div>
      {!online && <ErrorState message="The ML service at ML_SERVICE_URL is not responding." onRetry={s.reload} />}
      {online && !m && <EmptyState>No metrics recorded. Run ml-service/training/train.py to generate models/metrics.json.</EmptyState>}
      {m && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Accuracy" value={`${(m.accuracy * 100).toFixed(2)}%`} sub="holdout" />
            <StatCard label="Macro F1" value={m.macro_f1.toFixed(4)} />
            <StatCard label="Train / test" value={`${m.train_samples} / ${m.test_samples}`} />
            <StatCard label="Trained" value={<span className="text-base">{new Date(m.trained_at).toLocaleDateString()}</span>} sub={m.validation} />
          </div>
          <Card className="p-5 overflow-x-auto">
            <h4 className="font-bold text-[#123F35] mb-3">Per-class performance</h4>
            <table className="w-full text-sm text-left min-w-[480px]">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-2">Class</th>
                  <th className="p-2">Precision</th>
                  <th className="p-2">Recall</th>
                  <th className="p-2">F1</th>
                  <th className="p-2">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {m.classes.map(c => (
                  <tr key={c}>
                    <td className="p-2 font-bold">{label(c)}</td>
                    <td className="p-2">{m.per_class[c].precision.toFixed(3)}</td>
                    <td className="p-2">{m.per_class[c].recall.toFixed(3)}</td>
                    <td className="p-2">{m.per_class[c]['f1-score'].toFixed(3)}</td>
                    <td className="p-2">{m.per_class[c].support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-5 overflow-x-auto">
            <h4 className="font-bold text-[#123F35] mb-3">Confusion matrix (rows = actual, columns = predicted)</h4>
            <table className="text-sm min-w-[420px]">
              <thead>
                <tr>
                  <th className="p-2" />
                  {m.classes.map(c => (
                    <th key={c} className="p-2 text-xs uppercase text-slate-500">
                      {label(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <th className="p-2 text-xs uppercase text-slate-500 text-left">{label(m.classes[i])}</th>
                    {row.map((v, j) => (
                      <td key={j} className={`p-2 text-center font-bold rounded ${i === j ? 'bg-emerald-100 text-emerald-900' : v ? 'bg-red-50 text-red-800' : 'text-slate-400'}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      {model && (
        <Card className="p-5">
          <h4 className="font-bold text-[#123F35] mb-2">Input features</h4>
          <div className="flex flex-wrap gap-2">
            {model.input_features.map(f => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Safety() {
  const s = useAsync(() => api.getSafety());
  const [pid, setPid] = useState<string | null>(null);
  if (s.error) return <ErrorState message={s.error} onRetry={s.reload} />;
  if (!s.data) return <Loading />;
  const row = s.data.matrix.find(r => r.patient_id === pid) ?? s.data.matrix[0];
  return (
    <>
      <PageHeader title="Safety rules engine" subtitle="Deterministic rules run before ML scoring. The model can never override them." />
      <Card className="p-5 space-y-3">
        {s.data.rules.map(r => (
          <div key={r.code} className="text-sm">
            <code className="text-xs font-bold text-[#123F35] bg-emerald-50 px-2 py-0.5 rounded">{r.code}</code>
            <p className="text-emerald-900/80 mt-1">{r.description}</p>
          </div>
        ))}
      </Card>
      {row && (
        <Card className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-bold text-[#123F35]">Live evaluation per patient</h4>
            <select value={row.patient_id} onChange={e => setPid(e.target.value)} className="px-3 py-2 rounded-xl border border-emerald-900/20 text-sm" aria-label="Patient">
              {s.data.matrix.map(r => (
                <option key={r.patient_id} value={r.patient_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {row.results.map(r => (
            <div key={r.recipe_id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 py-2 border-b border-emerald-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-[#123F35]">{r.title}</p>
                {r.violations.map((v, i) => (
                  <p key={i} className="text-xs text-red-700">
                    {v.code}: {v.message}
                  </p>
                ))}
              </div>
              <Badge tone={r.is_safe ? 'good' : 'bad'}>{r.is_safe ? 'Passes' : 'Blocked'}</Badge>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function Audit() {
  const a = useAsync(() => api.getAudit());
  if (a.error) return <ErrorState message={a.error} onRetry={a.reload} />;
  if (!a.data) return <Loading />;
  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Sign-ins, profile and target changes, plan reviews and glucose escalations (latest 200)."
        action={
          <Button variant="secondary" onClick={a.reload} busy={a.loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />
      <Card className="p-5 overflow-x-auto">
        {a.data.length === 0 && <EmptyState>No audit entries.</EmptyState>}
        <table className="w-full text-sm text-left min-w-[640px]">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Actor</th>
              <th className="p-2">Action</th>
              <th className="p-2">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {a.data.map(e => (
              <tr key={e.id}>
                <td className="p-2 whitespace-nowrap">{formatDateTime(e.at)}</td>
                <td className="p-2">{e.actor}</td>
                <td className="p-2">
                  <Badge tone={e.action.includes('FAILED') || e.action.includes('ESCALATION') ? 'bad' : 'neutral'}>{e.action}</Badge>
                </td>
                <td className="p-2 text-slate-600">{e.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
