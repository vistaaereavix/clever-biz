import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente } from '../types';
import { Modal, ConfirmModal } from '../components/Modals';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import {
  formatarDocumento,
  limparDocumento,
  validarCPF,
  validarCNPJ,
  formatarTelefone,
  formatarCEP,
  buscarCNPJ,
  buscarCEP,
} from '../lib/utils';

export function Clientes() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    documento: '',
    nome_razao_social: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    tipo_documento: 'CPF',
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setClientes(data);
    }
    setLoading(false);
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
      c.documento.includes(busca)
  );

  const handleBuscaCNPJ = async () => {
    const doc = limparDocumento(formData.documento);
    if (doc.length !== 14) {
      setErro('Digite um CNPJ válido com 14 dígitos');
      return;
    }

    setBuscandoCNPJ(true);
    setErro('');

    try {
      const dados = await buscarCNPJ(doc);
      setFormData((prev) => ({
        ...prev,
        nome_razao_social: dados.nome_razao_social,
        email: dados.email,
        telefone: dados.telefone,
        cep: dados.cep,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        inscricao_estadual: dados.inscricao_estadual,
        tipo_documento: 'CNPJ',
      }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar CNPJ');
    }

    setBuscandoCNPJ(false);
  };

  const handleBuscaCEP = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('CEP deve conter 8 dígitos');
      return;
    }

    setBuscandoCEP(true);
    setErro('');

    try {
      const dados = await buscarCEP(formData.cep);
      setFormData((prev) => ({
        ...prev,
        cep: dados.cep,
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar CEP');
    }

    setBuscandoCEP(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const docLimpo = limparDocumento(formData.documento);
    const tipoDoc = docLimpo.length <= 11 ? 'CPF' : 'CNPJ';

    if (tipoDoc === 'CPF' && !validarCPF(docLimpo)) {
      setErro('CPF inválido');
      return;
    }

    if (tipoDoc === 'CNPJ' && !validarCNPJ(docLimpo)) {
      setErro('CNPJ inválido');
      return;
    }

    const dadosParaSalvar = {
      ...formData,
      documento: docLimpo,
      tipo_documento: tipoDoc,
      user_id: usuario?.id,
    };

    if (clienteSelecionado) {
      const { error } = await supabase
        .from('clientes')
        .update(dadosParaSalvar)
        .eq('id', clienteSelecionado.id);
      if (error) {
        setErro('Erro ao atualizar cliente');
        return;
      }
    } else {
      const { error } = await supabase.from('clientes').insert([dadosParaSalvar]);
      if (error) {
        setErro('Erro ao criar cliente: ' + error.message);
        return;
      }
    }

    setModalAberto(false);
    carregarClientes();
    limparForm();
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setFormData({
      documento: cliente.documento,
      nome_razao_social: cliente.nome_razao_social,
      inscricao_estadual: cliente.inscricao_estadual || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      cep: cliente.cep || '',
      logradouro: cliente.logradouro || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      tipo_documento: cliente.tipo_documento,
    });
    setModalAberto(true);
  };

  const handleDelete = async () => {
    if (!clienteSelecionado) return;

    await supabase.from('clientes').delete().eq('id', clienteSelecionado.id);
    setClienteSelecionado(null);
    carregarClientes();
  };

  const limparForm = () => {
    setFormData({
      documento: '',
      nome_razao_social: '',
      inscricao_estadual: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      tipo_documento: 'CPF',
    });
    setClienteSelecionado(null);
    setErro('');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Clientes" subtitulo="Gerencie seus clientes" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
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
            Novo Cliente
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{cliente.nome_razao_social}</h3>
                      <p className="text-slate-400 text-sm">
                        {formatarDocumento(cliente.documento, cliente.tipo_documento as 'CPF' | 'CNPJ')}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                        {cliente.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} /> {cliente.email}
                          </span>
                        )}
                        {cliente.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} /> {cliente.telefone}
                          </span>
                        )}
                        {cliente.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {cliente.cidade}/{cliente.estado}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cliente)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setClienteSelecionado(cliente);
                        setModalExcluir(true);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
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
        title={clienteSelecionado ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CPF/CNPJ
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o documento"
                  maxLength={18}
                />
                <button
                  type="button"
                  onClick={handleBuscaCNPJ}
                  disabled={buscandoCNPJ}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {buscandoCNPJ ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Digite um CNPJ e clique em Buscar para preencher automaticamente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nome / Razão Social *
              </label>
              <input
                type="text"
                value={formData.nome_razao_social}
                onChange={(e) => setFormData({ ...formData, nome_razao_social: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Inscrição Estadual
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={formData.inscricao_estadual}
                  onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inscrição Estadual"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })
                  }
                  className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CEP
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatarCEP(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <button
                  type="button"
                  onClick={handleBuscaCEP}
                  disabled={buscandoCEP}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  {buscandoCEP ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CEP'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Número
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Complemento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Estado
              </label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="UF"
                maxLength={2}
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
              {clienteSelecionado ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
