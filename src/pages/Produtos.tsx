import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Produto } from '../types';
import { Modal, ConfirmModal } from '../components/Modals';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Hash,
  Archive,
} from 'lucide-react';
import { formatarMoeda, gerarCodigoProduto } from '../lib/utils';
import { ViewToggle, ViewMode } from '../components/ViewToggle';
import { filtrarNcm, NcmItem } from '../lib/ncm';
import { DetailsModal } from '../components/DetailsModal';

export function Produtos() {
  const { usuario } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [erro, setErro] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('large');
  const [ncmOpen, setNcmOpen] = useState(false);
  const ncmRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo: gerarCodigoProduto(),
    preco_custo: 0,
    preco_venda: 0,
    estoque: 0,
    marca: '',
    modelo: '',
    condicao: 'Novo',
    tipo_item: 'Peça',
    ncm: '',
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ncmRef.current && !ncmRef.current.contains(e.target as Node)) {
        setNcmOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const sugestoesNcm = useMemo<NcmItem[]>(
    () => filtrarNcm(formData.ncm),
    [formData.ncm]
  );

  const carregarProdutos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProdutos(data);
    }
    setLoading(false);
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome || !formData.codigo) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    const dadosParaSalvar = {
      nome: formData.nome,
      codigo: formData.codigo,
      preco_custo: Number(formData.preco_custo),
      preco_venda: Number(formData.preco_venda),
      estoque: Number(formData.estoque),
      marca: formData.marca || null,
      modelo: formData.modelo || null,
      condicao: formData.condicao || null,
      tipo_item: formData.tipo_item || null,
      ncm: formData.ncm || null,
      user_id: usuario?.id,
    };

    if (produtoSelecionado) {
      const { error } = await supabase
        .from('produtos')
        .update(dadosParaSalvar)
        .eq('id', produtoSelecionado.id);
      if (error) {
        setErro('Erro ao atualizar produto: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('produtos').insert([dadosParaSalvar]);
      if (error) {
        setErro('Erro ao criar produto: ' + error.message);
        return;
      }
    }

    setModalAberto(false);
    carregarProdutos();
    limparForm();
  };

  const handleEdit = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setFormData({
      nome: produto.nome,
      codigo: produto.codigo,
      preco_custo: produto.preco_custo,
      preco_venda: produto.preco_venda,
      estoque: produto.estoque,
      marca: produto.marca || '',
      modelo: produto.modelo || '',
      condicao: produto.condicao || 'Novo',
      tipo_item: produto.tipo_item || 'Peça',
      ncm: produto.ncm || '',
    });
    setModalAberto(true);
  };

  const handleVisualizar = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalDetalhes(true);
  };

  const handleDelete = async () => {
    if (!produtoSelecionado) return;

    await supabase.from('produtos').delete().eq('id', produtoSelecionado.id);
    setProdutoSelecionado(null);
    carregarProdutos();
  };

  const limparForm = () => {
    setFormData({
      nome: '',
      codigo: gerarCodigoProduto(),
      preco_custo: 0,
      preco_venda: 0,
      estoque: 0,
      marca: '',
      modelo: '',
      condicao: 'Novo',
      tipo_item: 'Peça',
      ncm: '',
    });
    setProdutoSelecionado(null);
    setErro('');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Produtos" subtitulo="Gerencie seu estoque de produtos" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
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
            Novo Produto
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhum produto encontrado</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Produto</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Código</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">NCM</th>
                  <th className="text-right px-4 py-3">Venda</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Estoque</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((p) => (
                  <tr key={p.id} onClick={() => handleVisualizar(p)} className="border-t border-slate-700 hover:bg-slate-700/40 cursor-pointer">
                    <td className="px-4 py-3 text-white">{p.nome}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{p.codigo}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{p.ncm || '—'}</td>
                    <td className="px-4 py-3 text-right text-green-400">{formatarMoeda(p.preco_venda)}</td>
                    <td className="px-4 py-3 text-right text-slate-300 hidden sm:table-cell">{p.estoque}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setProdutoSelecionado(p); setModalExcluir(true); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg">
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
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} onClick={() => handleVisualizar(produto)} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-md bg-blue-600/20 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-400" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(produto); }} className="p-1 text-slate-400 hover:text-blue-400 rounded">
                    <Edit2 size={14} />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-white truncate" title={produto.nome}>{produto.nome}</h3>
                <p className="text-xs text-slate-500 truncate">{produto.codigo}</p>
                <p className="text-sm font-semibold text-green-400 mt-1">{formatarMoeda(produto.preco_venda)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                onClick={() => handleVisualizar(produto)}
                className="bg-slate-800 rounded-lg p-5 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <Package className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(produto); }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProdutoSelecionado(produto);
                        setModalExcluir(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{produto.nome}</h3>
                <p className="text-slate-400 text-sm mb-3 flex items-center gap-1">
                  <Hash size={14} /> {produto.codigo}
                </p>
                {(produto.marca || produto.modelo) && (
                  <p className="text-xs text-slate-500 mb-2">
                    {[produto.marca, produto.modelo].filter(Boolean).join(' • ')}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Preço de Custo</p>
                    <p className="text-sm font-medium text-slate-300">
                      {formatarMoeda(produto.preco_custo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Preço de Venda</p>
                    <p className="text-sm font-medium text-green-400">
                      {formatarMoeda(produto.preco_venda)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Estoque</p>
                    <p className="text-sm font-medium text-white flex items-center gap-1">
                      <Archive size={14} /> {produto.estoque} unidades
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={produtoSelecionado ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do produto"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Marca</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex.: Samsung"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex.: Galaxy S23"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Condição</label>
              <select
                value={formData.condicao}
                onChange={(e) => setFormData({ ...formData, condicao: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Novo">Novo</option>
                <option value="Semi-novo">Semi-novo</option>
                <option value="Usado">Usado</option>
                <option value="Recondicionado">Recondicionado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Item</label>
              <select
                value={formData.tipo_item}
                onChange={(e) => setFormData({ ...formData, tipo_item: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Peça">Peça</option>
                <option value="Equipamento">Equipamento</option>
                <option value="Acessório">Acessório</option>
                <option value="Bateria">Bateria</option>
              </select>
            </div>
          </div>

          <div ref={ncmRef} className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-1">NCM</label>
            <input
              type="text"
              value={formData.ncm}
              onChange={(e) => { setFormData({ ...formData, ncm: e.target.value }); setNcmOpen(true); }}
              onFocus={() => setNcmOpen(true)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o código ou descrição..."
              autoComplete="off"
            />
            {ncmOpen && sugestoesNcm.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-slate-800 border border-slate-600 rounded-lg shadow-lg">
                {sugestoesNcm.map((item) => (
                  <button
                    key={item.codigo}
                    type="button"
                    onClick={() => { setFormData({ ...formData, ncm: item.codigo }); setNcmOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 border-b border-slate-700 last:border-b-0"
                  >
                    <div className="text-sm text-white font-medium">{item.codigo}</div>
                    <div className="text-xs text-slate-400">{item.descricao}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Código *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Código do produto"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Preço de Custo (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 font-medium">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_custo || ''}
                  onChange={(e) => setFormData({ ...formData, preco_custo: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Preço de Venda (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 font-medium">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_venda || ''}
                  onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Estoque
            </label>
            <div className="relative">
              <Archive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="number"
                min="0"
                value={formData.estoque}
                onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quantidade em estoque"
              />
            </div>
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
              {produtoSelecionado ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={handleDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        type="danger"
      />

      <DetailsModal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title={produtoSelecionado?.nome || 'Detalhes do Produto'}
        entries={[
          { label: 'Nome', value: produtoSelecionado?.nome },
          { label: 'Código', value: produtoSelecionado?.codigo },
          { label: 'Marca', value: produtoSelecionado?.marca },
          { label: 'Modelo', value: produtoSelecionado?.modelo },
          { label: 'Condição', value: produtoSelecionado?.condicao },
          { label: 'Tipo de Item', value: produtoSelecionado?.tipo_item },
          { label: 'NCM', value: produtoSelecionado?.ncm },
          { label: 'Preço de Custo', value: produtoSelecionado ? formatarMoeda(produtoSelecionado.preco_custo) : '' },
          { label: 'Preço de Venda', value: produtoSelecionado ? formatarMoeda(produtoSelecionado.preco_venda) : '' },
          { label: 'Estoque', value: produtoSelecionado ? `${produtoSelecionado.estoque} un.` : '' },
        ]}
      />
    </div>
  );
}
