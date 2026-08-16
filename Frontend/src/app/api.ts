const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("chunk_auth_token");
}

async function request<T>(
  path: string,
  init?: RequestInit,
  allowRefresh = true,
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (response.status === 401 && allowRefresh && path !== "/auth/refresh") {
    const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (refreshed.ok) {
      const auth = (await refreshed.json()) as AuthResponse;
      if (auth.token) localStorage.setItem("chunk_auth_token", auth.token);
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || body.error || message;
      if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(typeof message === "string" ? message : "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: "learner" | "content_reviewer" | "content_admin" | "super_admin";
  emailVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface ChunkResponse {
  id: string;
  phrase: string;
  translation: string;
  pinyin: string;
  category: string;
  options: string[];
  answer: string;
  examples: string[];
  blank: string;
  needsReview: boolean;
  mastered: boolean;
}

export interface ProgressResponse {
  mastered: boolean;
  answerCount: number;
  reviewCount: number;
  needsReview?: boolean;
}

export interface DailyProgressResponse {
  completedCount: number;
  goal: number;
  streak: number;
  date: string;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  totalPracticedDays: number;
  weekData: { day: string; done: boolean; count: number; date: string }[];
}

export interface PreferencesResponse {
  dailyGoal: number;
  soundEnabled: boolean;
  reminderEnabled: boolean;
  hapticEnabled: boolean;
  autoNextEnabled: boolean;
}

export interface NoteItemResponse {
  id: string;
  english: string;
  translation: string;
  category: string;
  chunkId?: string | null;
  createdAt: number;
}

export interface CategoryStatsResponse {
  learned: { id: string; value: number }[];
  mastered: { id: string; value: number }[];
  needsReview: { id: string; value: number }[];
  totals: { learned: number; mastered: number; needsReview: number };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Please enter your email.";
  if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Please enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export async function registerUser(email: string, password: string, name?: string) {
  const emailErr = validateEmail(email);
  if (emailErr) throw new Error(emailErr);
  const passErr = validatePassword(password);
  if (passErr) throw new Error(passErr);

  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, name }),
  });
}

export async function loginUser(email: string, password: string) {
  const emailErr = validateEmail(email);
  if (emailErr) throw new Error(emailErr);
  if (!password) throw new Error("Please enter your password.");

  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
}

export async function getCurrentUser() {
  return request<AuthResponse>("/auth/me");
}

export async function logoutUser() {
  return request<{ success: boolean }>("/auth/logout", {
    method: "POST",
    body: "{}",
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token: string) {
  return request<{ success: boolean; message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function exportAccount() {
  return request<{ exportedAt: string; user: unknown }>("/auth/account/export");
}

export async function deleteAccount(password: string) {
  return request<{ success: boolean }>("/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export async function getChunks(category?: string) {
  const query =
    category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
  return request<ChunkResponse[]>(`/chunks${query}`);
}

export async function getRandomChunk(category?: string) {
  const query =
    category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
  return request<ChunkResponse>(`/chunks/random${query}`);
}

export async function recordProgressAnswer(
  chunkId: string,
  isCorrect: boolean,
  date?: string,
  responseMs?: number,
) {
  return request<ProgressResponse>("/progress/answer", {
    method: "POST",
    body: JSON.stringify({ chunkId, isCorrect, date, responseMs }),
  });
}

export interface AdminContentItem {
  id: string;
  category: string;
  difficulty: string;
  status: string;
  qualityScore: number;
  updatedAt: string;
  chunks: Array<{
    id: string;
    phrase: string;
    translation: string;
    blank: string;
    answer: string;
    options: string[];
    examples: Array<{ id: string; sentence: string }>;
  }>;
}

export function getAdminDashboard() {
  return request<{
    users: number;
    pending: number;
    published: number;
    retired: number;
    failedJobs: number;
  }>("/admin/dashboard");
}

export function getAdminContent(status = "pending_review") {
  return request<AdminContentItem[]>(
    `/admin/content?status=${encodeURIComponent(status)}`,
  );
}

export function transitionAdminContent(
  id: string,
  action: "approve" | "reject" | "retire" | "restore",
  reason?: string,
) {
  return request<AdminContentItem>(`/admin/content/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function editAdminChunk(
  itemId: string,
  chunkId: string,
  patch: {
    phrase?: string;
    translation?: string;
    blank?: string;
    answer?: string;
    options?: string[];
    examples?: string[];
  },
) {
  return request<AdminContentItem>(
    `/admin/content/${itemId}/chunks/${chunkId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export function createGenerationJob(data: {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}) {
  return request<{ id: string; status: string }>("/admin/generation/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTodayProgress() {
  return request<DailyProgressResponse>("/progress/today");
}

export async function getStreakStats() {
  return request<StreakResponse>("/progress/streak");
}

export async function getProgressCalendar(year: number, month: number) {
  return request<{
    year: number;
    month: number;
    days: { date: string; completedCount: number }[];
  }>(`/progress/calendar?year=${year}&month=${month}`);
}

export async function getLearningProgress() {
  return request<
    {
      chunkId: string;
      mastered: boolean;
      needsReview: boolean;
      answerCount: number;
      reviewCount: number;
      masteryScore: number;
      chunk: ChunkResponse;
    }[]
  >("/progress/learning");
}

export async function getReviewQueue() {
  return request<ChunkResponse[]>("/progress/review");
}

export async function getCategoryStats() {
  return request<CategoryStatsResponse>("/progress/stats/categories");
}

export async function getPreferences() {
  return request<PreferencesResponse>("/preferences");
}

export async function updatePreferences(patch: Partial<PreferencesResponse>) {
  return request<PreferencesResponse>("/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function getNotes() {
  return request<NoteItemResponse[]>("/notes");
}

export async function createNote(data: {
  english: string;
  translation: string;
  category: string;
  chunkId?: string;
}) {
  return request<NoteItemResponse>("/notes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  id: string,
  data: Partial<{ english: string; translation: string; category: string }>,
) {
  return request<NoteItemResponse>(`/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteNotes(ids: string[]) {
  return request<{ success: boolean }>("/notes", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export async function getNoteCategoryStats() {
  return request<{ id: string; value: number }[]>("/notes/stats/categories");
}
