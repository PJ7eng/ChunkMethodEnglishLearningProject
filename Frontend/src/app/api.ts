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
  pinyin: string;
  category: string;
  options: string[];
  answer: string;
  examples: string[];
  blank: string;
  needsReview: boolean;
  mastered: boolean;
}

// export interface ChunkResponse {
//   id: string;
//   phrase: string;
//   translation: string;
//   pinyin?: string;
//   category: string;
//   difficulty: string;
//   blank: string;
//   answer: string;
//   options: string[];
//   examples: string[];
// }

// export async function registerUser(email: string, password: string, name?: string) {
//   return request<AuthResponse>('/auth/register', {
//     method: 'POST',
//     body: JSON.stringify({ email, password, name }),
//   });
// }

// export async function loginUser(email: string, password: string) {
//   return request<AuthResponse>('/auth/login', {
//     method: 'POST',
//     body: JSON.stringify({ email, password }),
//   });
// }

// export async function getCurrentUser(token: string) {
//   return request<AuthResponse>('/auth/me', {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// }

// Frontend/src/app/api.ts

// export const authApi = {
//   // 1. 註冊接口預留
//   register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
//     await delay(800); // 模擬後端處理時間
    
//     if (!email || !password) {
//       throw new Error('請填寫所有必填欄位');
//     }

//     return {
//       success: true,
//       message: 'registration successful',
//       token: `mock-jwt-token-${crypto.randomUUID()}`,
//       user: {
//         id: crypto.randomUUID(),
//         email,
//         name: name || email.split('@')[0],
//       },
//     };
//   },

//   // 2. 登入接口預留
//   login: async (email: string, password: string): Promise<AuthResponse> => {
//     await delay(800);
    
//     if (!email || !password) {
//       throw new Error('請填寫電子郵件與密碼');
//     }

//     // 模擬成功登入
//     return {
//       user: {
//         id: 'mock-user-id-12345',
//         email,
//         name: email.split('@')[0],
//       },
//       token: `mock-jwt-token-authenticated-xyz`,
//     };
//   }
// };


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// need to plugin real backend API for registerUser function
export async function registerUser(email: string, password: string, name?: string) {
  await delay(800);
  if (!email || !password) {
      throw new Error('Please fill in all required fields.');
    }
  
  return {
      success: true,
      message: 'registration successful',
      token: `mock-jwt-token-${crypto.randomUUID()}`,
      user: {
        id: crypto.randomUUID(),
        email,
        name: name || email.split('@')[0],
      },
    };
}


// need to plugin real backend API for loginUser function
export async function loginUser(email: string, password: string) {
  await delay(800);

  if (!email || !password) {
    throw new Error('Please enter your email address and password.');
  }

  if (email === 'test@example.com' && password === 'password123') {
    return {
      success: true,
      message: 'login successful',
      token: `mock-jwt-token-authenticated-xyz`,
      user: { id: 'mock-user-id-12345', email, name: email.split('@')[0] },
    };
  } else {
    throw new Error('Invalid email or password.');
  }
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
