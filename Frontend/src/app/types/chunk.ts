import type { ChunkResponse } from '../api';

// 扩展API返回的类型
export interface Chunk extends ChunkResponse {
  needsReview: boolean;
  mastered: boolean;
}

// 从App.tsx复制的类型
export type ChunkType = Chunk;