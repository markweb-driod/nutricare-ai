import type {
  AdminOverview,
  AuditEntry,
  AuthUser,
  ClinicianPatientDetail,
  GlucoseReading,
  MealLog,
  MlStatus,
  NotificationItem,
  PatientProfile,
  PatientSummary,
  PlanApproval,
  Recipe,
  RecommendationReport,
  Reminder,
  SafetyReport,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const TOKEN_KEY = 'nutricare.token';
const USER_KEY = 'nutricare.user';

export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;
  constructor(status: number, message: string, errors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// ---------------------------------------------------------------- session
export const session = {
  get token(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  get user(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch { return null; }
  },
  save(token: string, user: AuthUser) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* storage unavailable: session lasts for this tab only */ }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
  },
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T = any>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = session.token;
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the NutriCare server. Check your connection and try again.');
  }

  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }

  if (!res.ok) {
    if (res.status === 401 && options.auth !== false) onUnauthorized?.();
    throw new ApiError(res.status, json?.message || `Request failed (${res.status})`, json?.errors || {});
  }
  return json as T;
}

const q = (patientId?: string) => (patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '');

// ---------------------------------------------------------------- endpoints
export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload: unknown) =>
    request<{ token: string; user: AuthUser }>('/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request<{ user: AuthUser }>('/auth/me').then(r => r.user),

  getProfile: (patientId?: string) => request<{ data: PatientProfile }>(`/patient/profile${q(patientId)}`).then(r => r.data),
  updateProfile: (changes: Partial<PatientProfile>) =>
    request<{ data: PatientProfile }>('/patient/profile', { method: 'PATCH', body: changes }).then(r => r.data),

  getRecipes: () => request<{ data: Recipe[] }>('/recipes').then(r => r.data),
  getRecommendations: (patientId?: string) =>
    request<RecommendationReport>(`/recommendations/generate${q(patientId)}`, { method: 'POST' }),

  getGlucose: (patientId?: string) => request<{ data: GlucoseReading[] }>(`/glucose-readings${q(patientId)}`).then(r => r.data),
  logGlucose: (reading_mg_dl: number, context: string) =>
    request<{ data: GlucoseReading }>('/glucose-readings', { method: 'POST', body: { reading_mg_dl, context } }).then(r => r.data),

  getMealLogs: (date?: string) =>
    request<{ data: MealLog[] }>(`/meal-logs${date ? `?date=${date}` : ''}`).then(r => r.data),
  logMeal: (recipe_id: string, meal_type: string, portion_g?: number) =>
    request<{ data: MealLog }>('/meal-logs', { method: 'POST', body: { recipe_id, meal_type, portion_g } }).then(r => r.data),
  deleteMealLog: (id: string) => request(`/meal-logs/${id}`, { method: 'DELETE' }),

  getReminders: () => request<{ data: Reminder[] }>('/reminders').then(r => r.data),
  updateReminder: (id: string, changes: { time?: string; is_enabled?: boolean }) =>
    request<{ data: Reminder }>(`/reminders/${id}`, { method: 'PATCH', body: changes }).then(r => r.data),
  snoozeReminder: (id: string, minutes = 15) =>
    request<{ data: Reminder }>(`/reminders/${id}/snooze`, { method: 'POST', body: { minutes } }).then(r => r.data),

  getNotifications: () => request<{ data: NotificationItem[] }>('/notifications').then(r => r.data),

  getPatients: () => request<{ data: PatientSummary[] }>('/clinician/patients').then(r => r.data),
  getPatientDetail: (id: string) => request<{ data: ClinicianPatientDetail }>(`/clinician/patients/${id}`).then(r => r.data),
  updateTargets: (id: string, changes: { daily_energy_kcal_target?: number; approved_carb_max_per_meal?: number }) =>
    request<{ data: PatientProfile }>(`/clinician/patients/${id}/targets`, { method: 'PATCH', body: changes }).then(r => r.data),
  reviewPlan: (id: string, status: 'APPROVED' | 'CHANGES_REQUESTED', note = '') =>
    request<{ data: PlanApproval }>(`/clinician/patients/${id}/approve`, { method: 'POST', body: { status, note } }).then(r => r.data),

  getAdminOverview: () => request<{ data: AdminOverview }>('/admin/overview').then(r => r.data),
  getMlStatus: () => request<{ data: MlStatus }>('/admin/ml').then(r => r.data),
  getSafety: () => request<{ data: SafetyReport }>('/admin/safety').then(r => r.data),
  getAudit: () => request<{ data: AuditEntry[] }>('/admin/audit').then(r => r.data),
};
