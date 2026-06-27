import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Servico } from '../types';
import { Modal, ConfirmModal } from '../components/Modals';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Hash,
  FileText,
} from 'lucide-react';
import { formatarMoeda, gerarCodigoServico } from '../lib/utils';
import { ViewToggle, ViewMode } from '../components/ViewToggle';
import { DetailsModal } from '../components/DetailsModal';

export function Servicos() {
  const { usuario } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [erro, setErro] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('large');

  const [formData, setFormData] = useState({
    nome: '',
    codigo_municipal: '',
    preco: 0,
    descricao: '',
  });

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setServicos(data);
    }
    setLoading(false);
  };

  const servicosFiltrados = servicos.filter(
    (s) =>
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (s.codigo_municipal ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome || !formData.codigo_municipal) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    const dadosParaSalvar = {
      nome: formData.nome,
      codigo_municipal: formData.codigo_municipal,
      preco: Number(formData.preco),
      descricao: formData.descricao,
      user_id: usuario?.id,
    };

    if (servicoSelecionado) {
      const { error } = await supabase
        .from('servicos')
        .update(dadosParaSalvar)
        .eq('id', servicoSelecionado.id);
      if (error) {
        setErro('Erro ao atualizar serviço: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('servicos').insert([dadosParaSalvar]);
      if (error) {
        setErro('Erro ao criar serviço: ' + error.message);
        return;
      }
    }

    setModalAberto(false);
    carregarServicos();
    limparForm();
  };

  const handleEdit = (servico: Servico) => {
    setServicoSelecionado(servico);
    setFormData({
      nome: servico.nome,
      codigo_municipal: servico.codigo_municipal ?? '',
      preco: servico.preco,
      descricao: servico.descricao || '',
    });
    setModalAberto(true);
  };

  const handleVisualizar = (servico: Servico) => {
    setServicoSelecionado(servico);
    setModalDetalhes(true);
  };

  const handleDelete = async () => {
    if (!servicoSelecionado) return;

    await supabase.from('servicos').delete().eq('id', servicoSelecionado.id);
    setServicoSelecionado(null);
    carregarServicos();
  };

  const limparForm = () => {
    setFormData({
      nome: '',
      codigo_municipal: '',
      preco: 0,
      descricao: '',
    });
    setServicoSelecionado(null);
    setErro('');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Serviços" subtitulo="Gerencie seus serviços" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou código municipal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ViewToggle value={viewMode} onChange={setViewMode} />

          <button
            onClick={() => {
              limparForm();
              setModalAberto(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus size={20} />
            Novo Serviço
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhum serviço encontrado</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Serviço</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Código</th>
                  <th className="text-right px-4 py-3">Preço</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {servicosFiltrados.map((s) => (
                  <tr key={s.id} onClick={() => handleVisualizar(s)} className="border-t border-slate-700 hover:bg-slate-700/40 cursor-pointer">
                    <td className="px-4 py-3 text-white">{s.nome}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{s.codigo_municipal || '—'}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatarMoeda(s.preco)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setServicoSelecionado(s); setModalExcluir(true); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'small' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {servicosFiltrados.map((servico) => (
              <div key={servico.id} onClick={() => handleVisualizar(servico)} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-md bg-purple-600/20 flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-purple-400" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(servico); }} className="p-1 text-slate-400 hover:text-blue-400 rounded">
                    <Edit2 size={14} />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-white truncate" title={servico.nome}>{servico.nome}</h3>
                <p className="text-sm font-semibold text-green-400 mt-1">{formatarMoeda(servico.preco)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicosFiltrados.map((servico) => (
              <div
                key={servico.id}
                onClick={() => handleVisualizar(servico)}
                className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-16 h-16 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Wrench className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(servico); }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setServicoSelecionado(servico);
                        setModalExcluir(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{servico.nome}</h3>
                <p className="text-slate-400 text-sm mb-3 flex items-center gap-1">
                  <Hash size={14} /> Código: {servico.codigo_municipal}
                </p>

                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500">Preço</p>
                  <p className="text-lg font-semibold text-green-400">
                    {formatarMoeda(servico.preco)}
                  </p>
                  {servico.descricao && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {servico.descricao}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={servicoSelecionado ? 'Editar Serviço' : 'Novo Serviço'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Serviço *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do serviço"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Código Municipal NFS-e *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={formData.codigo_municipal}
                onChange={(e) => setFormData({ ...formData, codigo_municipal: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Código municipal"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Preço (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco || ''}
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                className="w-full pl-12 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descrição do serviço"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {servicoSelecionado ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={handleDelete}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        type="danger"
      />

      <DetailsModal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title={servicoSelecionado?.nome || 'Detalhes do Serviço'}
        entries={[
          { label: 'Nome', value: servicoSelecionado?.nome },
          { label: 'Código Municipal', value: servicoSelecionado?.codigo_municipal },
          { label: 'Preço', value: servicoSelecionado ? formatarMoeda(servicoSelecionado.preco) : '' },
          { label: 'Descrição', value: servicoSelecionado?.descricao },
        ]}
      />
    </div>
  );
}
