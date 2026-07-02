import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'midnight' | 'ocean' | 'graphite' | 'rose' | 'paper';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  swatches: [string, string, string, string];
}

export const THEMES: ThemePreset[] = [
  { id: 'midnight', label: 'Midnight', swatches: ['#0f172a', '#1e293b', '#334155', '#3b82f6'] },
  { id: 'ocean',    label: 'Ocean',    swatches: ['#04212b', '#0b3a4a', '#125a6e', '#2dd4bf'] },
  { id: 'graphite', label: 'Graphite', swatches: ['#101010', '#1c1c1c', '#2a2a2a', '#10b981'] },
  { id: 'rose',     label: 'Rose',     swatches: ['#1a0f14', '#2a1720', '#3f2230', '#f43f5e'] },
  { id: 'paper',    label: 'Paper',    swatches: ['#f7f7f5', '#ffffff', '#e7e5e0', '#4f46e5'] },
];

interface Ctx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeCtx = createContext<Ctx>({ theme: 'midnight', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'midnight';
    return (localStorage.getItem('erp-theme') as ThemeId) || 'midnight';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-erp-theme', theme);
    document.documentElement.setAttribute('data-erp-density', 'compact');
    localStorage.setItem('erp-theme', theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);