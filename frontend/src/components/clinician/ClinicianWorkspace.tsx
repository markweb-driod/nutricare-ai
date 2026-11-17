'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ChevronRight, MessageSquare, Users } from 'lucide-react';
import { api } from '../../services/api';
import type { AuthUser, PatientSummary } from '../../types';
import { formatDateTime, glucoseTone, label } from '../../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Modal, PageHeader, StatCard, errorMessage, inputClass, useAsync } from '../ui';

interface Props {
  user: AuthUser;
  activeNav: string;
  setActiveNav: (n: string) => void;
  notify: (msg: string, tone?: 'good' | 'bad') => void;
  onDataChanged: () => void;
}

const APPROVAL_TONE = { APPROVED: 'good', PENDING_REVIEW: 'warn', CHANGES_REQUESTED: 'bad' } as const;

export default function ClinicianWorkspace({ user, activeNav, setActiveNav, notify, onDataChanged }: Props) {
  const patients = useAsync(() => api.getPatients());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<PatientSummary | null>(null);
  const list = patients.data ?? [];
  const isStaffReadOnly = user.role !== 'clinician';

  const changed = () => {
    patients.reload();
    onDataChanged();
  };

  const openPatient = (id: string) => {
    setSelectedId(id);
    setActiveNav('clinician-directory');
  };

  if (patients.error) return <ErrorState message={patients.error} onRetry={patients.reload} />;
  if (!patients.data) return <Loading />;

  const queue = list.filter(p => p.needs_review);

  return (
    <div className="space-y-6">
      {activeNav === 'clinician-overview' && (
        <>
          <div className="bg-gradient-to-r from-teal-900 to-[#123F35] text-white p-6 rounded-3xl shadow-md">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Clinician workspace</span>
            <h2 className="text-2xl font-bold font-heading mt-0.5">
              {user.name}
              {user.title ? `, ${user.title}` : ''}
            </h2>
            <p className="text-sm text-emerald-200 mt-1">{list.length} assigned patients</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Patients" value={list.length} />
            <StatCard label="Needs review" value={queue.length} />
            <StatCard label="Escalations (7d)" value={list.reduce((a, p) => a + p.escalations_7d, 0)} />
            <StatCard
              label="Avg adherence (7d)"
              value={`${list.length ? Math.round(list.reduce((a, p) => a + p.adherence_pct, 0) / list.length) : 0}%`}
            />
          </div>
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#123F35] text-lg font-heading">Needs attention</h3>
              <Button variant="ghost" className="text-xs" onClick={() => setActiveNav('clinician-queue')}>
                Open review queue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {queue.length === 0 && <EmptyState>Nothing needs review right now.</EmptyState>}
            {queue.map(p => (
              <button
                key={p.id}
                onClick={() => openPatient(p.id)}
                className="w-full text-left p-3 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 hover:border-emerald-300 flex items-center justify-between gap-3"
              >
                <span className="font-bold text-[#123F35]">{p.name}</span>
                <span className="flex flex-wrap gap-2 justify-end">
                  {p.escalations_7d > 0 && <Badge tone="bad"><AlertTriangle className="w-3 h-3" /> {p.escalations_7d} escalation(s)</Badge>}
                  <Badge tone={APPROVAL_TONE[p.approval_status]}>{label(p.approval_status)}</Badge>
                </span>
              </button>
            ))}
          </Card>
        </>
      )}

      {activeNav === 'clinician-directory' &&
        (selectedId ? (
          <PatientDetail id={selectedId} onBack={() => setSelectedId(null)} canEdit={!isStaffReadOnly} notify={notify} onChanged={changed} onReview={setReview} />
        ) : (
          <>
            <PageHeader title="Patient directory" subtitle="Select a patient to see their readings, meals and targets." />
            <PatientTable patients={list} onOpen={openPatient} />
          </>
        ))}

      {activeNav === 'clinician-builder' && (
        <>
          <PageHeader title="Meal plan targets" subtitle="Set the energy and carbohydrate limits the safety engine and recommendations use for each patient." />
          {list.map(p => (
            <TargetsEditor key={p.id} patientId={p.id} name={p.name} canEdit={!isStaffReadOnly} notify={notify} onChanged={changed} />
          ))}
        </>
      )}

      {activeNav === 'clinician-queue' && (
        <>
          <PageHeader title="Review queue" subtitle="Plans awaiting approval and patients with recent glucose escalations." />
          {queue.length === 0 && (
            <Card className="p-6">
              <EmptyState>The review queue is empty.</EmptyState>
            </Card>
          )}
          {queue.map(p => (
            <Card key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#123F35]">{p.name}</h4>
                <p className="text-xs text-emerald-900/70">
                  {label(p.diabetes_type)} · HbA1c {p.hba1c_latest}% · {label(p.medication_risk_category)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge tone={APPROVAL_TONE[p.approval_status]}>{label(p.approval_status)}</Badge>
                  {p.escalations_7d > 0 && <Badge tone="bad">{p.escalations_7d} escalation(s) in 7 days</Badge>}
                  {p.latest_glucose && (
                    <Badge tone={glucoseTone(p.latest_glucose.status)}>
                      Latest {p.latest_glucose.reading_mg_dl} mg/dL
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openPatient(p.id)}>
                  View patient
                </Button>
                {!isStaffReadOnly && <Button onClick={() => setReview(p)}>Review plan</Button>}
              </div>
            </Card>
          ))}
        </>
      )}

      {activeNav === 'clinician-reports' && (
        <>
          <PageHeader title="Clinical reports" subtitle="Seven-day adherence and glycemic summary across your patients." />
          <Card className="p-5 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-emerald-50/70 text-emerald-900 text-xs uppercase font-bold">
                <tr>
                  <th className="p-3">Patient</th>
                  <th className="p-3">HbA1c</th>
                  <th className="p-3">Meals logged (7d)</th>
                  <th className="p-3">Adherence</th>
                  <th className="p-3">Escalations (7d)</th>
                  <th className="p-3">Latest glucose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {list.map(p => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-[#123F35]">{p.name}</td>
                    <td className="p-3">{p.hba1c_latest}%</td>
                    <td className="p-3">{p.meals_logged_7d} / 21</td>
                    <td className="p-3 font-bold">{p.adherence_pct}%</td>
                    <td className={`p-3 font-bold ${p.escalations_7d ? 'text-red-700' : ''}`}>{p.escalations_7d}</td>
                    <td className="p-3">
                      {p.latest_glucose ? `${p.latest_glucose.reading_mg_dl} mg/dL (${label(p.latest_glucose.status)})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {review && (
        <ReviewModal
          patient={review}
          onClose={() => setReview(null)}
          onDone={msg => {
            setReview(null);
            notify(msg);
            changed();
          }}
        />
      )}
    </div>
  );
}

function PatientTable({ patients, onOpen }: { patients: PatientSummary[]; onOpen: (id: string) => void }) {
  if (patients.length === 0) return <EmptyState>No patients assigned.</EmptyState>;
  return (
    <Card className="p-5 overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[640px]">
        <thead className="bg-emerald-50/70 text-emerald-900 text-xs uppercase font-bold">
          <tr>
            <th className="p-3">Patient</th>
            <th className="p-3">Condition</th>
            <th className="p-3">HbA1c</th>
            <th className="p-3">Adherence</th>
            <th className="p-3">Plan</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-50">
          {patients.map(p => (
            <tr key={p.id} className="hover:bg-emerald-50/30 cursor-pointer" onClick={() => onOpen(p.id)}>
              <td className="p-3 font-bold text-[#123F35]">
                {p.name} ({p.age}y)
              </td>
              <td className="p-3 text-emerald-900/70">{label(p.diabetes_type)}</td>
              <td className={`p-3 font-semibold ${p.hba1c_latest >= 8 ? 'text-amber-700' : 'text-emerald-700'}`}>{p.hba1c_latest}%</td>
              <td className="p-3 font-bold">{p.adherence_pct}%</td>
              <td className="p-3">
                <Badge tone={APPROVAL_TONE[p.approval_status]}>{label(p.approval_status)}</Badge>
              </td>
              <td className="p-3 text-right">
                <ChevronRight className="w-4 h-4 inline text-emerald-700" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PatientDetail({
  id,
  onBack,
  canEdit,
  notify,
  onChanged,
  onReview,
}: {
  id: string;
  onBack: () => void;
  canEdit: boolean;
  notify: Props['notify'];
  onChanged: () => void;
  onReview: (p: PatientSummary) => void;
}) {
  const detail = useAsync(() => api.getPatientDetail(id), [id]);
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  if (!detail.data) return <Loading />;
  const { summary, profile, plan_approval, glucose_readings, meal_logs } = detail.data;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-bold text-[#16835D] hover:underline">
        ← All patients
      </button>
      <PageHeader
        title={summary.name}
        subtitle={`${profile.age}y · ${label(profile.gender)} · ${label(profile.diabetes_type)} · HbA1c ${profile.hba1c_latest}% · ${label(profile.medication_risk_category)}`}
        action={canEdit && <Button onClick={() => onReview(summary)}>Review plan</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Plan status" value={<Badge tone={APPROVAL_TONE[plan_approval.status]}>{label(plan_approval.status)}</Badge>} />
        <StatCard label="Adherence (7d)" value={`${summary.adherence_pct}%`} />
        <StatCard label="Escalations (7d)" value={summary.escalations_7d} />
        <StatCard label="Allergens" value={<span className="text-base">{profile.allergens.length ? profile.allergens.map(label).join(', ') : 'None'}</span>} />
      </div>
      {plan_approval.note && <p className="text-sm text-emerald-900/80">Last review note: {plan_approval.note}</p>}
      <TargetsEditor patientId={id} name="Targets" canEdit={canEdit} notify={notify} onChanged={() => (detail.reload(), onChanged())} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-2">
          <h4 className="font-bold text-[#123F35]">Recent glucose readings</h4>
          {glucose_readings.length === 0 && <EmptyState>No readings.</EmptyState>}
          {glucose_readings.map(g => (
            <div key={g.id} className="flex items-center justify-between text-sm py-1.5 border-b border-emerald-50 last:border-0">
              <span>
                <strong>{g.reading_mg_dl}</strong> mg/dL · {label(g.context)}
                <span className="block text-xs text-emerald-900/60">{formatDateTime(g.recorded_at)}</span>
              </span>
              <Badge tone={glucoseTone(g.status)}>{label(g.status)}</Badge>
            </div>
          ))}
        </Card>
        <Card className="p-5 space-y-2">
          <h4 className="font-bold text-[#123F35]">Recent meals</h4>
          {meal_logs.length === 0 && <EmptyState>No meals logged.</EmptyState>}
          {meal_logs.map(m => (
            <div key={m.id} className="text-sm py-1.5 border-b border-emerald-50 last:border-0">
              <strong>{m.title}</strong>
              <span className="block text-xs text-emerald-900/60">
                {label(m.meal_type)} · {formatDateTime(m.logged_at)} · {m.carbs_g} g carbs · {Math.round(m.energy_kcal)} kcal
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function TargetsEditor({
  patientId,
  name,
  canEdit,
  notify,
  onChanged,
}: {
  patientId: string;
  name: string;
  canEdit: boolean;
  notify: Props['notify'];
  onChanged: () => void;
}) {
  const profile = useAsync(() => api.getProfile(patientId), [patientId]);
  const [kcal, setKcal] = useState('');
  const [carbs, setCarbs] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setKcal(String(profile.data.daily_energy_kcal_target));
      setCarbs(String(profile.data.approved_carb_max_per_meal));
    }
  }, [profile.data]);

  if (profile.error) return <ErrorState message={profile.error} onRetry={profile.reload} />;
  if (!profile.data) return <Loading />;
  const dirty = kcal !== String(profile.data.daily_energy_kcal_target) || carbs !== String(profile.data.approved_carb_max_per_meal);

  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      const updated = await api.updateTargets(patientId, { daily_energy_kcal_target: Number(kcal), approved_carb_max_per_meal: Number(carbs) });
      profile.setData(prev => (prev ? { ...prev, ...updated } : prev));
      notify(`Targets saved for ${updated.first_name} ${updated.last_name}`);
      onChanged();
    } catch (e: any) {
      setErrors(e?.errors ?? {});
      notify(errorMessage(e), 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <form
        className="flex flex-col md:flex-row md:items-end gap-4"
        onSubmit={e => {
          e.preventDefault();
          save();
        }}
      >
        <div className="md:w-48">
          <h4 className="font-bold text-[#123F35]">{name}</h4>
          <p className="text-xs text-emerald-900/60">
            {profile.data.first_name} {profile.data.last_name}
          </p>
        </div>
        <Field label="Daily energy (kcal)" error={errors.daily_energy_kcal_target} hint="1000–4000">
          <input type="number" min={1000} max={4000} disabled={!canEdit} value={kcal} onChange={e => setKcal(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Max carbs per meal (g)" error={errors.approved_carb_max_per_meal} hint="10–150">
          <input type="number" min={10} max={150} disabled={!canEdit} value={carbs} onChange={e => setCarbs(e.target.value)} className={inputClass} />
        </Field>
        {canEdit && (
          <Button type="submit" busy={busy} disabled={!dirty} className="md:mb-5">
            Save targets
          </Button>
        )}
      </form>
    </Card>
  );
}

function ReviewModal({ patient, onClose, onDone }: { patient: PatientSummary; onClose: () => void; onDone: (msg: string) => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: 'APPROVED' | 'CHANGES_REQUESTED') => {
    if (status === 'CHANGES_REQUESTED' && !note.trim()) {
      setError('Add a note explaining the requested changes.');
      return;
    }
    setBusy(status);
    setError(null);
    try {
      await api.reviewPlan(patient.id, status, note.trim());
      onDone(status === 'APPROVED' ? `Plan approved for ${patient.name}` : `Changes requested for ${patient.name}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  };

  return (
    <Modal
      title={
        <>
          <Users className="w-5 h-5 text-[#16835D]" /> Review plan: {patient.name}
        </>
      }
      onClose={onClose}
    >
      <Field label="Note to patient" hint="Required when requesting changes.">
        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={inputClass} maxLength={500} />
      </Field>
      {error && <ErrorState message={error} />}
      <div className="flex gap-3">
        <Button variant="danger" className="flex-1" busy={busy === 'CHANGES_REQUESTED'} disabled={!!busy} onClick={() => submit('CHANGES_REQUESTED')}>
          <MessageSquare className="w-4 h-4" /> Request changes
        </Button>
        <Button className="flex-1" busy={busy === 'APPROVED'} disabled={!!busy} onClick={() => submit('APPROVED')}>
          <CheckCircle className="w-4 h-4" /> Approve
        </Button>
      </div>
    </Modal>
  );
}
