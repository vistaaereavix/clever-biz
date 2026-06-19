import React, { useState, useEffect } from 'react';
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

export function Produtos() {
  const { usuario } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    codigo: gerarCodigoProduto(),
    preco_custo: 0,
    preco_venda: 0,
    estoque: 0,
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

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
    });
    setModalAberto(true);
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
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosFiltrados.map((produto) => (
              <div
                key={produto.id}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(produto)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
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
    </div>
  );
}
