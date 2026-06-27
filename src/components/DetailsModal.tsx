import { Modal } from './Modals';

export interface DetailEntry {
  label: string;
  value?: React.ReactNode;
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entries: DetailEntry[];
}

export function DetailsModal({ isOpen, onClose, title, entries }: DetailsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries
          .filter((e) => e.value !== undefined && e.value !== null && e.value !== '')
          .map((e) => (
            <div key={e.label} className="bg-slate-700/40 rounded-lg p-3 border border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{e.label}</p>
              <p className="text-sm text-white break-words">{e.value}</p>
            </div>
          ))}
      </div>
      <div className="flex justify-end pt-4 mt-4 border-t border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}