import { useEffect, useState } from 'react';
import type { ViewMode } from '../components/ViewToggle';

export function useViewMode(key: string, initial: ViewMode = 'large') {
  const storageKey = `erp:viewMode:${key}`;
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initial;
    const v = window.localStorage.getItem(storageKey);
    return v === 'large' || v === 'small' || v === 'list' ? v : initial;
  });
  useEffect(() => {
    try { window.localStorage.setItem(storageKey, mode); } catch {}
  }, [storageKey, mode]);
  return [mode, setMode] as const;
}