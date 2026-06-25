import { LayoutGrid, Grid3x3, List as ListIcon } from 'lucide-react';

export type ViewMode = 'large' | 'small' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const opts: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'large', icon: LayoutGrid, label: 'Ícones grandes' },
    { mode: 'small', icon: Grid3x3, label: 'Ícones pequenos' },
    { mode: 'list', icon: ListIcon, label: 'Lista' },
  ];
  return (
    <div className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
      {opts.map(({ mode, icon: Icon, label }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onChange(mode)}
            className={`p-2 rounded-md transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}