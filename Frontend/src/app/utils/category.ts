import { CATEGORIES } from '../constants/categories';

export function getCategoryMeta(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
}