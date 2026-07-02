import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, useTheme } from '../contexts/ThemeContext';

export function ThemeToolbar() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-2 rounded-xl border border-slate-700 bg-slate-800/95 backdrop-blur p-2 shadow-xl min-w-[180px]">
          <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-slate-400">Tema</p>
          <div className="space-y-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700 text-left"
              >
                <span className="flex -space-x-1">
                  {t.swatches.map((c, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-black/30"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="flex-1 text-xs text-slate-200">{t.label}</span>
                {theme === t.id && <Check size={12} className="text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Alterar tema"
        className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 shadow-lg flex items-center justify-center"
      >
        <Palette size={16} />
      </button>
    </div>
  );
}