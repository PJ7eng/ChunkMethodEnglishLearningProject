const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export interface ChunkResponse {
  id: string;
  phrase: string;
  translation: string;
  pinyin?: string;
  category: string;
  difficulty: string;
  blank: string;
  answer: string;
  options: string[];
  examples: string[];
}

export async function registerUser(email: string, password: string, name?: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginUser(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(token: string) {
  return request<AuthResponse>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getChunks(category?: string) {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  console.log('Fetching chunks with category: %s', category);
  return request<ChunkResponse[]>(`/chunks${query}`);
}

export async function getRandomChunk(category?: string) {
  const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  console.log('Fetching random chunk with category: %s', category);
  return request<ChunkResponse>(`/chunks/random${query}`);
}

export interface ProgressResponse {
  mastered: boolean;
  answerCount: number;
  reviewCount: number;
}

export async function recordProgressAnswer(userId: string, chunkId: string, isCorrect: boolean, date?: string) {
  return request<ProgressResponse>('/progress/answer', {
    method: 'POST',
    body: JSON.stringify({ userId, chunkId, isCorrect, date }),
  });
}
