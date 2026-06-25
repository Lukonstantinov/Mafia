import { en, type Dict } from './en';
import { ru } from './ru';
import { lt } from './lt';
import type { Lang } from '../types';

export const dicts: Record<Lang, Dict> = { EN: en, RU: ru, LT: lt };

export type TKey = keyof Dict;

export function makeT(lang: Lang) {
  const d = dicts[lang] ?? en;
  return (key: TKey): string => d[key] ?? en[key] ?? String(key);
}
