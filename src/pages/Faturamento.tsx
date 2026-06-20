import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NotaFiscal, Cliente, Orcamento } from '../types';
import { Modal } from '../components/Modals';
import { Header } from '../components/Header';
import {
  Receipt,
  Search,
  Loader2,
  FileDown,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Eye,
  FileSearch,
} from 'lucide-react';
import { formatarMoeda, formatarData, formatarDocumento, formatarDataHora } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarMarcaDagua } from '@/lib/pdfWatermark';

export function Faturamento() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalEmitir, setModalEmitir] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    arquivo_certificado: null as File | null,
    senha_certificado: '',
    processando: false,
    resultado: '',
  });

  useEffect(() => {
    carregarDados();
    carregarLogo();
  }, []);

  const carregarLogo = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from('company_settings')
      .select('logo_url')
      .eq('user_id', uid)
      .maybeSingle();
    if (data?.logo_url) {
      const { data: signed } = await supabase.storage
        .from('company-logos')
        .createSignedUrl(data.logo_url, 60 * 60);
      if (signed?.signedUrl) setLogoUrl(signed.signedUrl);
    }
  };

  const carregarDados = async () => {
    setLoading(true);

    const { data: notasData } = await supabase
      .from('notas_fiscais')
      .select('*, cliente:clientes(*)')
      .order('created_at', { ascending: false });

    const { data: clientesData } = await supabase.from('clientes').select('*');
    const { data: orcamentosData } = await supabase.from('orcamentos').select('*');

    if (notasData) setNotas(notasData);
    if (clientesData) setClientes(clientesData);
    if (orcamentosData) setOrcamentos(orcamentosData);

    setLoading(false);
  };

  const notasFiltradas = notas.filter(
    (n) =>
      n.numero.toString().includes(busca) ||
      n.chave_acesso?.includes(busca)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, arquivo_certificado: file });
    }
  };

  const simularEmissao = async (nota: NotaFiscal) => {
    setNotaSelecionada(nota);
    setFormData({
      arquivo_certificado: null,
      senha_certificado: '',
      processando: false,
      resultado: '',
    });
    setModalEmitir(true);
  };

  const transmitirNota = async () => {
    if (!formData.arquivo_certificado) {
      setErro('Selecione o arquivo do certificado digital');
      return;
    }

    if (!formData.senha_certificado) {
      setErro('Digite a senha do certificado');
      return;
    }

    setErro('');
    setFormData({ ...formData, processando: true });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const chaveAcesso = Array.from({ length: 44 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');

    const cliente = clientes.find((c) => c.id === notaSelecionada?.cliente_id);
    const orcamento = orcamentos.find((o) => o.id === notaSelecionada?.orcamento_id);

    const xmlSimulado = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <nNF>${notaSelecionada?.numero}</nNF>
      <serie>1</serie>
      <dhEmi>${new Date().toISOString()}</dhEmi>
    </ide>
    <emit>
      <CNPJ>00000000000000</CNPJ>
      <xNome>EMPRESA LTDA</xNome>
    </emit>
    <dest>
      <CNPJ>${cliente?.documento || '00000000000000'}</CNPJ>
      <xNome>${cliente?.nome_razao_social || 'CLIENTE'}</xNome>
    </dest>
    <total>
      <vNF>${notaSelecionada?.valor_total || 0}</vNF>
    </total>
  </infNFe>
</NFe>`;

    const { error } = await supabase
      .from('notas_fiscais')
      .update({
        status: 'emitida',
        chave_acesso: chaveAcesso,
        xml_enviado: xmlSimulado,
        resposta_sefaz: 'Autorizado o uso da NF-e',
        data_emissao: new Date().toISOString(),
      })
      .eq('id', notaSelecionada?.id);

    if (!error) {
      setFormData({ ...formData, resultado: 'Nota Fiscal emitida com sucesso!' });
      carregarDados();
    }

    setFormData({ ...formData, processando: false });
  };

  const baixarDANFE = async (nota: NotaFiscal, modo: 'download' | 'preview' = 'download') => {
    const cliente = clientes.find((c) => c.id === nota.cliente_id);
    const orcamento = orcamentos.find((o) => o.id === nota.orcamento_id);

    const doc = new jsPDF();

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 40, 'F');

    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 10, 8, 35, 12);
      } catch (e) {
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text('EMPRESA LTDA', 10, 18);
      }
    }

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('DANFE - Documento Auxiliar da Nota Fiscal Eletrônica', 50, 18);

    doc.setFontSize(10);
    doc.text(`NFe Nº ${String(nota.numero).padStart(6, '0')} - Série ${nota.serie}`, 160, 18);

    doc.setFillColor(240, 240, 240);
    doc.rect(5, 45, 200, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('EMITENTE', 10, 55);
    doc.setFontSize(8);
    doc.text('EMPRESA LTDA', 10, 62);
    doc.text('CNPJ: 00.000.000/0000-00', 10, 68);
    doc.text('Rua Exemplo, 123 - Centro', 10, 74);

    doc.setFontSize(9);
    doc.text('DESTINATÁRIO', 110, 55);
    doc.setFontSize(8);
    doc.text(cliente?.nome_razao_social || 'CLIENTE', 110, 62);
    doc.text(`CNPJ/CPF: ${cliente ? formatarDocumento(cliente.documento, cliente.tipo_documento as 'CPF' | 'CNPJ') : 'N/A'}`, 110, 68);
    if (cliente?.logradouro) {
      doc.text(`${cliente.logradouro}, ${cliente.numero} - ${cliente.bairro}`, 110, 74);
      doc.text(`${cliente.cidade}/${cliente.estado} - CEP: ${cliente.cep}`, 110, 80);
    }

    if (orcamento) {
      const { data: itens } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamento.id);

      if (itens && itens.length > 0) {
        autoTable(doc, {
          startY: 90,
          head: [['Código', 'Descrição', 'NCM', 'CFOP', 'Qtd', 'Valor Unit.', 'Total']],
          body: itens.map((item, idx) => [
            `${idx + 1}`,
            item.descricao,
            '00000000',
            '5102',
            item.quantidade.toString(),
            formatarMoeda(item.valor_unitario),
            formatarMoeda(item.valor_total),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
        });
      }
    }

    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    doc.setFontSize(10);
    doc.text('VALOR TOTAL DA NOTA', 140, finalY + 10);
    doc.setFontSize(14);
    doc.text(formatarMoeda(nota.valor_total), 170, finalY + 10);

    doc.setFontSize(8);
    doc.text('CHAVE DE ACESSO', 10, finalY + 25);
    doc.setFontSize(10);
    doc.text(nota.chave_acesso || '00000000000000000000000000000000000000000000', 10, finalY + 32);

    doc.text(`Data de Emissão: ${formatarDataHora(nota.data_emissao)}`, 10, finalY + 45);

    doc.setFontSize(7);
    doc.text('Document o auxiliar da Nota Fiscal Eletrônica. Este documento não possui validade fiscal.', 10, 285);

    aplicarMarcaDagua(doc, 'EMPRESA');
    if (modo === 'preview') {
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } else {
      doc.save(`DANFE_${String(nota.numero).padStart(6, '0')}.pdf`);
    }
  };

  const visualizarDetalhes = async (nota: NotaFiscal) => {
    setNotaSelecionada(nota);
    setModalDetalhes(true);
  };

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-600/20 text-yellow-400 border-yellow-600',
    emitida: 'bg-green-600/20 text-green-400 border-green-600',
    rejeitada: 'bg-red-600/20 text-red-400 border-red-600',
    cancelada: 'bg-slate-600/20 text-slate-400 border-slate-600',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pendente: <Clock className="h-5 w-5" />,
    emitida: <CheckCircle className="h-5 w-5" />,
    rejeitada: <XCircle className="h-5 w-5" />,
    cancelada: <XCircle className="h-5 w-5" />,
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Faturamento" subtitulo="Emita e gerencie suas notas fiscais" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número ou chave de acesso..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhuma nota fiscal encontrada</p>
            <p className="text-slate-500 text-sm mt-2">
              Converta um orçamento aprovado para gerar uma nota fiscal
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notasFiltradas.map((nota) => {
              const cliente = clientes.find((c) => c.id === nota.cliente_id);
              return (
                <div
                  key={nota.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            NF-e Nº {String(nota.numero).padStart(6, '0')}
                          </h3>
                          <span
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${statusColors[nota.status]}`}
                          >
                            {statusIcons[nota.status]}
                            {nota.status.charAt(0).toUpperCase() + nota.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          {cliente?.nome_razao_social || 'Cliente não encontrado'}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                          <span>Valor: {formatarMoeda(nota.valor_total)}</span>
                          <span>Emissão: {formatarData(nota.data_emissao)}</span>
                        </div>
                        {nota.chave_acesso && (
                          <p className="text-xs text-slate-500 mt-1">
                            Chave: {nota.chave_acesso}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => visualizarDetalhes(nota)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      {nota.status === 'pendente' && (
                        <button
                          onClick={() => simularEmissao(nota)}
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Emitir Nota Fiscal"
                        >
                          <Send size={18} />
                        </button>
                      )}
                      {nota.status === 'emitida' && (
                        <button
                          onClick={() => baixarDANFE(nota)}
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Baixar DANFE"
                        >
                          <FileDown size={18} />
                        </button>
                      )}
                      {nota.status === 'emitida' && (
                        <button
                          onClick={() => baixarDANFE(nota, 'preview')}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Visualizar DANFE"
                        >
                          <FileSearch size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modalEmitir} onClose={() => setModalEmitir(false)} title="Emitir Nota Fiscal" size="md">
        <div className="space-y-4">
          {erro && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-2">NOTA FISCAL</h3>
            <p className="text-white font-medium">
              NF-e Nº {String(notaSelecionada?.numero).padStart(6, '0')}
            </p>
            <p className="text-slate-400 text-sm">
              Cliente: {clientes.find((c) => c.id === notaSelecionada?.cliente_id)?.nome_razao_social}
            </p>
            <p className="text-green-400 font-medium mt-2">
              Valor: {formatarMoeda(notaSelecionada?.valor_total || 0)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Certificado Digital (PFX/P12)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pfx,.p12"
                onChange={handleFileChange}
                className="hidden"
                id="certificado"
              />
              <button
                onClick={() => document.getElementById('certificado')?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Upload size={18} />
                Selecionar Arquivo
              </button>
              {formData.arquivo_certificado && (
                <span className="text-sm text-slate-300">
                  {formData.arquivo_certificado.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Selecione seu certificado digital do tipo A1 (arquivo .pfx ou .p12)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Senha do Certificado
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={formData.senha_certificado}
                onChange={(e) => setFormData({ ...formData, senha_certificado: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a senha"
              />
            </div>
          </div>

          {formData.resultado && (
            <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              {formData.resultado}
            </div>
          )}

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-400">
              Simulação: Este sistema está preparado para enviar a NF-e para o barramento fiscal.
              A transmissão real requer credenciais válidas da SEFAZ.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <button
              onClick={() => setModalEmitir(false)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={transmitirNota}
              disabled={formData.processando}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {formData.processando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Transmitindo...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Transmitir Nota Fiscal
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalDetalhes}
        onClose={() => setModalDetalhes(false)}
        title="Detalhes da Nota Fiscal"
        size="lg"
      >
        {notaSelecionada && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">EMISSÃO</h3>
                <p className="text-white">NF-e Nº {String(notaSelecionada.numero).padStart(6, '0')}</p>
                <p className="text-slate-400 text-sm">Série: {notaSelecionada.serie}</p>
                <p className="text-slate-400 text-sm">
                  Data: {formatarDataHora(notaSelecionada.data_emissao)}
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">VALOR TOTAL</h3>
                <p className="text-2xl font-bold text-green-400">
                  {formatarMoeda(notaSelecionada.valor_total)}
                </p>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">CLIENTE</h3>
              <p className="text-white">
                {clientes.find((c) => c.id === notaSelecionada.cliente_id)?.nome_razao_social}
              </p>
            </div>

            {notaSelecionada.chave_acesso && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">CHAVE DE ACESSO</h3>
                <p className="text-white text-sm font-mono break-all">
                  {notaSelecionada.chave_acesso}
                </p>
              </div>
            )}

            {notaSelecionada.resposta_sefaz && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-400 mb-2">RESPOSTA DA SEFAZ</h3>
                <p className="text-white">{notaSelecionada.resposta_sefaz}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
              <button
                onClick={() => setModalDetalhes(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
              {notaSelecionada.status === 'emitida' && (
                <button
                  onClick={() => baixarDANFE(notaSelecionada, 'preview')}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  <FileSearch size={18} />
                  Visualizar DANFE
                </button>
              )}
              {notaSelecionada.status === 'emitida' && (
                <button
                  onClick={() => {
                    setModalDetalhes(false);
                    baixarDANFE(notaSelecionada);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <FileDown size={18} />
                  Baixar DANFE
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
