import { authStorage, type AuthSession } from "./authStorage";
import { isNativePlatform } from "./platform";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const FETCH_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly kind: "offline" | "network" | "http" = "http",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function networkError(error: unknown): ApiError {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return new ApiError("目前離線。請檢查網路連線後再試一次。", undefined, "offline");
  }
  if (error instanceof ApiError) return error;
  return new ApiError("無法連線至服務。請稍後再試。", undefined, "network");
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("<") || /^<!doctype/i.test(trimmed);
}

function isInternalParseMessage(message: string): boolean {
  return /unexpected token|not valid json|json\.parse|syntaxerror|<!doctype/i.test(
    message,
  );
}

/** Maps thrown API / parse errors to copy a learner can act on. */
export function userFacingError(
  error: unknown,
  fallback = "無法連線至服務。請稍後再試。",
): string {
  if (error instanceof ApiError) return error.message;
  const message = error instanceof Error ? error.message : "";
  if (!message || isInternalParseMessage(message) || message.includes("<")) {
    return fallback;
  }
  return message;
}

async function readJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    if (response.status === 204) return undefined as T;
    throw networkError(undefined);
  }
  if (looksLikeHtml(text)) {
    throw networkError(undefined);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw networkError(undefined);
  }
}

async function readHttpErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text || looksLikeHtml(text)) {
    return "無法連線至服務。請稍後再試。";
  }
  try {
    const body = JSON.parse(text) as { message?: unknown; error?: unknown };
    let message = body.message || body.error || "Request failed";
    if (Array.isArray(message)) message = message.join(", ");
    return typeof message === "string" ? message : "Request failed";
  } catch {
    return "無法連線至服務。請稍後再試。";
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    throw networkError(error);
  } finally {
    clearTimeout(timer);
  }
}

export async function saveAuthSession(response: AuthResponse): Promise<AuthSession> {
  if (!response.token || !response.user) {
    throw new ApiError(response.message || "Authentication failed");
  }
  const session: AuthSession = {
    accessToken: response.token,
    refreshToken: response.refreshToken,
    user: response.user,
  };
  await authStorage.setSession(session);
  return session;
}

export function clearAuthSession() {
  return authStorage.clear();
}

/**
 * Native: rebuilds an access session from the Keystore refresh token.
 * Web: no-op (refresh lives in the HttpOnly cookie; /auth/me still works).
 * Network failures do not wipe stored credentials.
 */
export async function restoreSessionWithRefresh(): Promise<boolean> {
  if (await authStorage.getAccessToken()) return true;
  const refreshToken = await authStorage.getRefreshToken();
  if (!refreshToken) return false;

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: isNativePlatform ? "omit" : "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNativePlatform ? { refreshToken } : {}),
    });
  } catch (error) {
    throw networkError(error);
  }

  if (!response.ok) {
    await authStorage.clear();
    return false;
  }

  const auth = await readJsonBody<AuthResponse>(response);
  if (!auth.token || !auth.user) {
    await authStorage.clear();
    return false;
  }
  await saveAuthSession(auth);
  return true;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  allowRefresh = true,
): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw networkError(undefined);
  }

  const token = await authStorage.getAccessToken();
  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: isNativePlatform ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    throw networkError(error);
  }

  if (response.status === 401 && allowRefresh && path !== "/auth/refresh") {
    const refreshToken = await authStorage.getRefreshToken();
    let refreshed: Response;
    try {
      refreshed = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: isNativePlatform ? "omit" : "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNativePlatform ? { refreshToken } : {}),
      });
    } catch (error) {
      throw networkError(error);
    }
    if (refreshed.ok) {
      const auth = await readJsonBody<AuthResponse>(refreshed);
      if (auth.token) {
        if (isNativePlatform && auth.user) {
          await saveAuthSession(auth);
        } else {
          await authStorage.setAccessToken(auth.token);
          if (isNativePlatform && auth.refreshToken) {
            await authStorage.setRefreshToken(auth.refreshToken);
          }
        }
      }
      return request<T>(path, init, false);
    }
    await authStorage.clear();
  }

  if (!response.ok) {
    const message = await readHttpErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return readJsonBody<T>(response);
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
  refreshToken?: string;
  user?: AuthUser;
}

export interface ChunkResponse {
  id: string;
  phrase: string;
  translation: string;
  pinyin: string;
  usage?: string;
  register?: string;
  cefr?: string;
  category: string;
  options: string[];
  answer: string;
  examples: string[];
  exampleDetails?: Array<{ sentence: string; translation?: string }>;
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
  const refreshToken = await authStorage.getRefreshToken();
  try {
    return await request<{ success: boolean }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify(isNativePlatform ? { refreshToken } : {}),
    });
  } finally {
    await authStorage.clear();
  }
}

export async function requestPasswordReset(email: string) {
  return request<{ success: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  const result = await request<{ success: boolean; message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  await authStorage.clear();
  return result;
}

export async function verifyEmail(token: string) {
  return request<{ success: boolean; message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationEmail(email: string) {
  return request<{ success: boolean; message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function exportAccount() {
  return request<{ exportedAt: string; user: unknown }>("/auth/account/export");
}

export async function deleteAccount(password: string) {
  const result = await request<{ success: boolean }>("/auth/account", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  await authStorage.clear();
  return result;
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
  generationJob?: {
    provider?: string | null;
    model?: string | null;
    promptVersion?: string | null;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    retryCount: number;
  } | null;
  chunks: Array<{
    id: string;
    phrase: string;
    translation: string;
    pinyin?: string | null;
    usage?: string | null;
    register?: string | null;
    cefr?: string | null;
    blank: string;
    answer: string;
    options: string[];
    examples: Array<{
      id: string;
      sentence: string;
      translation?: string | null;
      orderIndex: number;
    }>;
  }>;
}

export function getAdminDashboard() {
  return request<{
    users: number;
    pending: number;
    published: number;
    rejected: number;
    retired: number;
    failedJobs: number;
    recentJobs: Array<{
      id: string;
      status: string;
      model?: string | null;
      inputTokens: number;
      outputTokens: number;
      estimatedCost: number;
    }>;
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
    pinyin?: string | null;
    usage?: string;
    register?: string;
    cefr?: string;
    blank?: string;
    answer?: string;
    options?: string[];
    examples?: Array<string | { sentence: string; translation?: string | null }>;
  },
) {
  return request<AdminContentItem>(
    `/admin/content/${itemId}/chunks/${chunkId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export interface GenerationJob {
  id: string;
  status: string;
  errorMessage?: string | null;
  category?: string | null;
  difficulty?: string | null;
  batchSize: number;
}

export function createGenerationJob(data: {
  category: string;
  difficulty: string;
  batchSize: number;
  triggerReason: string;
}) {
  return request<GenerationJob>("/admin/generation/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getGenerationJobs() {
  return request<GenerationJob[]>("/admin/generation/jobs");
}

export function getGenerationJob(id: string) {
  return request<GenerationJob>(`/admin/generation/jobs/${encodeURIComponent(id)}`);
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
