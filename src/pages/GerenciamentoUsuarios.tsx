import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2, ShieldAlert, RefreshCw, Users as UsersIcon, Circle } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useOnlinePresence } from '../hooks/useOnlinePresence';
import { adminListUsers, adminDeleteUser } from '../lib/admin.functions';

interface Row {
  id: string;
  email: string;
  nome: string;
  last_active: string | null;
  created_at: string;
}

function daysInactive(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

export function GerenciamentoUsuarios() {
  const isAdmin = useIsAdmin();
  const online = useOnlinePresence();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<0 | 30 | 60 | 90>(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListUsers();
      setRows(res.users as Row[]);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (filterDays === 0) return rows;
    return rows.filter((r) => {
      const d = daysInactive(r.last_active);
      return d !== null && d >= filterDays;
    });
  }, [rows, filterDays]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    let ok = 0;
    let fail = 0;
    for (const id of confirmDelete.ids) {
      try {
        await adminDeleteUser({ data: { userId: id } });
        ok++;
      } catch (e: any) {
        fail++;
        toast.error(`Erro ao excluir ${id.slice(0, 8)}: ${e?.message || 'falha'}`);
      }
    }
    setDeleting(false);
    setConfirmDelete(null);
    if (ok) toast.success(`${ok} usuário(s) excluído(s)`);
    if (!fail) await load();
    else await load();
  };

  if (isAdmin === null) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 min-h-screen flex flex-col items-center justify-center text-slate-300">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-3" />
        <h1 className="text-xl font-semibold">Acesso restrito</h1>
        <p className="text-slate-400 mt-1">Somente administradores podem acessar este painel.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gerenciamento de Usuários</h1>
          <p className="text-sm text-slate-400">Painel restrito a administradores.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Online now */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UsersIcon size={18} className="text-emerald-400" />
          <h2 className="text-sm font-medium">
            Usuários online agora
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              {online.length}
            </span>
          </h2>
        </div>
        {online.length === 0 ? (
          <p className="text-sm text-slate-400">Ninguém online no momento.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {online.map((u) => (
              <li key={u.user_id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/60 text-sm">
                <Circle size={8} className="fill-emerald-400 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{u.nome}</p>
                  <p className="truncate text-xs text-slate-400">{u.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Table */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-slate-400">Filtrar inativos:</label>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value) as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100"
            >
              <option value={0}>Todos</option>
              <option value={30}>+30 dias</option>
              <option value={60}>+60 dias</option>
              <option value={90}>+90 dias</option>
            </select>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{filtered.length} conta(s)</span>
          </div>
          <button
            disabled={selected.size === 0}
            onClick={() =>
              setConfirmDelete({
                ids: Array.from(selected),
                label: `${selected.size} conta(s) selecionada(s)`,
              })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <Trash2 size={14} /> Excluir selecionados ({selected.size})
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <th className="px-2 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-2 py-2">Nome</th>
                  <th className="px-2 py-2">E-mail</th>
                  <th className="px-2 py-2">Último acesso</th>
                  <th className="px-2 py-2">Dias inativo</th>
                  <th className="px-2 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const d = daysInactive(r.last_active);
                  return (
                    <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="px-2 py-2">{r.nome}</td>
                      <td className="px-2 py-2 text-slate-300">{r.email}</td>
                      <td className="px-2 py-2 text-slate-400">{formatDate(r.last_active)}</td>
                      <td className="px-2 py-2">
                        {d === null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <span className={d >= 60 ? 'text-red-400' : d >= 30 ? 'text-amber-400' : 'text-slate-300'}>
                            {d}d
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() =>
                            setConfirmDelete({ ids: [r.id], label: `${r.nome} (${r.email})` })
                          }
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-900/30"
                          title="Excluir usuário"
                          aria-label="Excluir usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-5">
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <ShieldAlert size={20} />
              <h3 className="font-semibold">Confirmar exclusão</h3>
            </div>
            <p className="text-sm text-slate-300">
              Você vai excluir <strong>{confirmDelete.label}</strong>. Esta ação é permanente e apaga a conta de autenticação e todos os dados associados. Deseja continuar?
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={deleting}
                onClick={doDelete}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm flex items-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />} Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}