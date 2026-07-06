import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente, Produto, Servico, Orcamento, OrcamentoItem } from '../types';
import { Modal, ConfirmModal } from '../components/Modals';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  FileDown,
  ArrowRight,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import { formatarMoeda, formatarData, formatarDocumento } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarMarcaDagua } from '@/lib/pdfWatermark';
import { ViewToggle } from '../components/ViewToggle';
import { useViewMode } from '../hooks/useViewMode';

export function Orcamentos() {
  const { usuario } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [erro, setErro] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [viewMode, setViewMode] = useViewMode('orcamentos');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState('orcamento.pdf');
  const [pdfGerandoId, setPdfGerandoId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cliente_id: '',
    validade_dias: 30 as number,
    observacoes: '',
    status: 'pendente' as 'pendente' | 'aprovado' | 'convertido' | 'cancelado',
    forma_pagamento: 'Pix' as 'Pix' | 'Boleto' | 'Dinheiro' | 'Débito' | 'Crédito à Vista' | 'Crédito Parcelado',
    parcelas: 1 as number,
    garantia: '',
    execucao: '',
  });

  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [novoItem, setNovoItem] = useState({
    tipo: 'produto' as 'produto' | 'servico',
    item_id: '',
    quantidade: 1,
  });

  useEffect(() => {
    carregarDados();
    carregarLogo();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const carregarLogo = async () => {
    if (!usuario) return;
    const { data } = await supabase
      .from('company_settings')
      .select('logo_url')
      .eq('user_id', usuario.id)
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

    const [{ data: orcamentosData }, { data: clientesData }, { data: produtosData }, { data: servicosData }] =
      await Promise.all([
        supabase.from('orcamentos').select('*, cliente:clientes(*)').order('created_at', { ascending: false }),
        supabase.from('clientes').select('*').order('nome_razao_social'),
        supabase.from('produtos').select('*').order('nome'),
        supabase.from('servicos').select('*').order('nome'),
      ]);

    if (orcamentosData) setOrcamentos(orcamentosData);
    if (clientesData) setClientes(clientesData);
    if (produtosData) setProdutos(produtosData);
    if (servicosData) setServicos(servicosData);

    setLoading(false);
  };

  const orcamentosFiltrados = orcamentos.filter((o) => {
    const cliente = clientes.find((c) => c.id === o.cliente_id);
    return (
      cliente?.nome_razao_social.toLowerCase().includes(busca.toLowerCase()) ||
      o.numero.toString().includes(busca)
    );
  });

  const calcularTotal = () => {
    return itens.reduce((acc, item) => acc + item.valor_total, 0);
  };

  const adicionarItem = () => {
    if (!novoItem.item_id) return;

    let item: OrcamentoItem | null = null;

    if (novoItem.tipo === 'produto') {
      const produto = produtos.find((p) => p.id === novoItem.item_id);
      if (produto) {
        item = {
          id: crypto.randomUUID(),
          orcamento_id: '',
          tipo: 'produto',
          item_id: produto.id,
          descricao: produto.nome,
          quantidade: novoItem.quantidade,
          valor_unitario: produto.preco_venda,
          valor_total: produto.preco_venda * novoItem.quantidade,
          created_at: new Date().toISOString(),
        };
      }
    } else {
      const servico = servicos.find((s) => s.id === novoItem.item_id);
      if (servico) {
        item = {
          id: crypto.randomUUID(),
          orcamento_id: '',
          tipo: 'servico',
          item_id: servico.id,
          descricao: servico.nome,
          quantidade: novoItem.quantidade,
          valor_unitario: servico.preco,
          valor_total: servico.preco * novoItem.quantidade,
          created_at: new Date().toISOString(),
        };
      }
    }

    if (item) {
      setItens([...itens, item]);
      setNovoItem({ tipo: 'produto', item_id: '', quantidade: 1 });
    }
  };

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.cliente_id) {
      setErro('Selecione um cliente');
      return;
    }

    if (itens.length === 0) {
      setErro('Adicione pelo menos um item');
      return;
    }

    const total = calcularTotal();

    const extras: string[] = [];
    extras.push(`Forma de Pagamento: ${formData.forma_pagamento}${formData.forma_pagamento === 'Crédito Parcelado' ? ` em ${formData.parcelas}x` : ''}`);
    if (formData.garantia) extras.push(`Tempo de Garantia: ${formData.garantia}`);
    if (formData.execucao) extras.push(`Tempo de Execução do Serviço: ${formData.execucao}`);
    const observacoesFinal = [formData.observacoes, extras.join('\n')].filter(Boolean).join('\n\n');

    try {
      let orcamentoId: string;

      if (orcamentoSelecionado) {
        const { error: updateError } = await supabase
          .from('orcamentos')
          .update({
            cliente_id: formData.cliente_id,
            validade_dias: parseInt(String(formData.validade_dias)) || 30,
            observacoes: observacoesFinal,
            total,
            status: formData.status,
          })
          .eq('id', orcamentoSelecionado.id);

        if (updateError) throw updateError;

        await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamentoSelecionado.id);
        orcamentoId = orcamentoSelecionado.id;
      } else {
        // Próximo número: max(numero)+1 do usuário atual
        const { data: maxRow } = await supabase
          .from('orcamentos')
          .select('numero')
          .eq('user_id', usuario?.id)
          .order('numero', { ascending: false })
          .limit(1)
          .maybeSingle();
        const numero = ((maxRow?.numero as number) || 0) + 1;

        const { data: newOrcamento, error: insertError } = await supabase
          .from('orcamentos')
          .insert([
            {
              cliente_id: formData.cliente_id,
              numero,
              validade_dias: parseInt(String(formData.validade_dias)) || 30,
              observacoes: observacoesFinal,
              total,
              status: formData.status,
              user_id: usuario?.id,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        orcamentoId = newOrcamento.id;

        // contador agora vem do max(numero); nada a atualizar aqui
      }

      const itensParaInserir = itens.map((item) => ({
        orcamento_id: orcamentoId,
        tipo: item.tipo,
        item_id: item.item_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        user_id: usuario?.id,
      }));

      const { error: itensError } = await supabase.from('orcamento_itens').insert(itensParaInserir);
      if (itensError) throw itensError;

      setModalAberto(false);
      carregarDados();
      limparForm();
    } catch (err) {
      setErro('Erro ao salvar orçamento');
    }
  };

  const handleEdit = async (orcamento: Orcamento) => {
    setOrcamentoSelecionado(orcamento);

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcamento.id);

    setFormData({
      cliente_id: orcamento.cliente_id || '',
      validade_dias: orcamento.validade_dias,
      observacoes: orcamento.observacoes || '',
      status: (orcamento.status as 'pendente' | 'aprovado' | 'convertido' | 'cancelado') || 'pendente',
      forma_pagamento: 'Pix',
      parcelas: 1,
      garantia: '',
      execucao: '',
    });

    setItens(itensData || []);
    setModalAberto(true);
  };

  const handleDelete = async () => {
    if (!orcamentoSelecionado) return;

    await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamentoSelecionado.id);
    await supabase.from('orcamentos').delete().eq('id', orcamentoSelecionado.id);
    setOrcamentoSelecionado(null);
    carregarDados();
  };

  const limparForm = () => {
    setFormData({
      cliente_id: '',
      validade_dias: 30,
      observacoes: '',
      status: 'pendente',
      forma_pagamento: 'Pix',
      parcelas: 1,
      garantia: '',
      execucao: '',
    });
    setItens([]);
    setOrcamentoSelecionado(null);
    setErro('');
  };

  const gerarPDF = async (orcamento: Orcamento) => {
    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcamento.id);

    const cliente = clientes.find((c) => c.id === orcamento.cliente_id);

    // Dados da empresa
    const { data: empresa } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', usuario?.id)
      .maybeSingle();

    const doc = new jsPDF();

    // Paleta — acento da marca usado com parcimônia
    const ACCENT: [number, number, number] = [0, 172, 251]; // #00ACFB
    const TEXT_DARK: [number, number, number] = [30, 30, 30];
    const TEXT_MUTED: [number, number, number] = [110, 110, 110];
    const RULE: [number, number, number] = [225, 228, 232];

    // Cabeçalho: fundo branco, logo à esquerda mantendo o tamanho atual
    const HEADER_H = 50;
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 10, 7.5, 35, 35);
      } catch {
        try { doc.addImage(logoUrl, 'JPEG', 10, 7.5, 35, 35); } catch {}
      }
    }

    // Dados da empresa (texto escuro sobre fundo branco)
    const nomeEmpresa = (empresa?.nome_fantasia || empresa?.razao_social || 'Sua Empresa').toString();
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(nomeEmpresa, 50, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    let yE = 19.5;
    if (empresa?.razao_social && empresa?.nome_fantasia) { doc.text(empresa.razao_social, 50, yE); yE += 4; }
    if (empresa?.cnpj) { doc.text(`CNPJ: ${empresa.cnpj}`, 50, yE); yE += 4; }
    if (empresa?.inscricao_estadual) { doc.text(`IE: ${empresa.inscricao_estadual}`, 50, yE); yE += 4; }
    const enderecoLinha = [empresa?.logradouro, empresa?.numero].filter(Boolean).join(', ');
    if (enderecoLinha) { doc.text(enderecoLinha + (empresa?.bairro ? ` - ${empresa.bairro}` : ''), 50, yE); yE += 4; }
    const cidadeLinha = [empresa?.cidade, empresa?.estado].filter(Boolean).join(' - ');
    if (cidadeLinha || empresa?.cep) { doc.text([cidadeLinha, empresa?.cep].filter(Boolean).join('  CEP: '), 50, yE); yE += 4; }
    if (empresa?.telefone || empresa?.email) {
      doc.text([empresa?.telefone, empresa?.email].filter(Boolean).join('  •  '), 50, yE);
    }

    // Número do orçamento — bloco discreto à direita usando a cor de acento
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('ORÇAMENTO', 200, 12, { align: 'right' });
    doc.setTextColor(...ACCENT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Nº ${String(orcamento.numero).padStart(4, '0')}`, 200, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Emissão: ${formatarData(orcamento.data_emissao)}`, 200, 26, { align: 'right' });
    doc.text(`Validade: ${orcamento.validade_dias} dias`, 200, 30.5, { align: 'right' });

    // Régua fina de acento separando o cabeçalho do corpo
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(10, HEADER_H, 200, HEADER_H);
    doc.setLineWidth(0.2);

    // Bloco CLIENTE
    doc.setTextColor(...ACCENT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CLIENTE', 10, HEADER_H + 8);
    doc.setDrawColor(...RULE);
    doc.line(10, HEADER_H + 10, 200, HEADER_H + 10);

    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    if (cliente) {
      doc.setFont('helvetica', 'bold');
      doc.text(cliente.nome_razao_social || '', 10, HEADER_H + 16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.setFontSize(9);
      doc.text(formatarDocumento(cliente.documento, cliente.tipo_documento as 'CPF' | 'CNPJ'), 10, HEADER_H + 21.5);
      if (cliente.logradouro) {
        doc.text(`${cliente.logradouro}, ${cliente.numero || 's/n'}${cliente.bairro ? ' - ' + cliente.bairro : ''}`, 10, HEADER_H + 27);
        doc.text(`${cliente.cidade || ''} - ${cliente.estado || ''}`, 10, HEADER_H + 32.5);
      }
      if (cliente.telefone || cliente.email) {
        doc.text([cliente.telefone, cliente.email].filter(Boolean).join('  •  '), 110, HEADER_H + 16);
      }
    }

    const tableData = (itensData || []).map((item: any, index: number) => [
      (index + 1).toString(),
      item.descricao,
      String(item.quantidade),
      formatarMoeda(item.valor_unitario),
      formatarMoeda(item.valor_total),
    ]);

    autoTable(doc, {
      startY: HEADER_H + 42,
      head: [['Item', 'Descrição', 'Qtd', 'Valor Unit.', 'Total']],
      body: tableData,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        textColor: TEXT_DARK,
        lineColor: RULE,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: ACCENT,
        fontStyle: 'bold',
        fontSize: 8.5,
        lineColor: ACCENT,
        lineWidth: { top: 0, right: 0, bottom: 0.4, left: 0 } as any,
      },
      bodyStyles: {
        lineColor: RULE,
        lineWidth: { top: 0, right: 0, bottom: 0.1, left: 0 } as any,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 32, halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    // Total — rótulo em acento, valor em preto
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(130, finalY + 4, 200, finalY + 4);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text('TOTAL', 130, finalY + 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...TEXT_DARK);
    doc.text(formatarMoeda(orcamento.total), 200, finalY + 11, { align: 'right' });

    if (orcamento.observacoes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...ACCENT);
      doc.text('OBSERVAÇÕES', 10, finalY + 24);
      doc.setDrawColor(...RULE);
      doc.line(10, finalY + 26, 200, finalY + 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...TEXT_DARK);
      doc.text(orcamento.observacoes, 10, finalY + 31, { maxWidth: 190 });
    }

    // Rodapé sutil
    doc.setDrawColor(...RULE);
    doc.line(10, 282, 200, 282);
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Validade: ${orcamento.validade_dias} dias a partir da emissão`, 10, 287);
    doc.text(nomeEmpresa, 200, 287, { align: 'right' });

    aplicarMarcaDagua(doc, nomeEmpresa, logoUrl || undefined);
    return doc.output('blob') as Blob;
  };

  const handleVisualizar = async (orcamento: Orcamento) => {
    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcamento.id);

    setOrcamentoSelecionado({
      ...orcamento,
      itens: itensData || [],
    });
    setModalVisualizar(true);
  };

  const handlePreviewPDF = async (orcamento: Orcamento) => {
    setPdfGerandoId(orcamento.id);
    try {
      const blob = await gerarPDF(orcamento);
      const blobUrl = URL.createObjectURL(blob);
      setPdfPreviewFileName(`orcamento_${String(orcamento.numero).padStart(4, '0')}.pdf`);
      setPdfPreviewUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return blobUrl;
      });
    } catch (e) {
      console.error('Erro ao gerar preview do PDF', e);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setPdfGerandoId(null);
    }
  };

  const handleDownloadPDF = async (orcamento: Orcamento) => {
    setPdfGerandoId(orcamento.id);
    try {
      const blob = await gerarPDF(orcamento);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `orcamento_${String(orcamento.numero).padStart(4, '0')}.pdf`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch (e) {
      console.error('Erro ao baixar PDF', e);
      alert('Não foi possível baixar o PDF. Tente novamente.');
    } finally {
      setPdfGerandoId(null);
    }
  };

  const converterParaNotaFiscal = async (orcamento: Orcamento) => {
    const { data: maxRow } = await supabase
      .from('notas_fiscais')
      .select('numero')
      .eq('user_id', usuario?.id)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();
    const numeroNF = ((maxRow?.numero as number) || 0) + 1;

    await supabase.from('notas_fiscais').insert([
      {
        orcamento_id: orcamento.id,
        cliente_id: orcamento.cliente_id,
        numero: numeroNF,
        valor_total: orcamento.total,
        status: 'pendente',
        user_id: usuario?.id,
      },
    ]);

    await supabase.from('orcamentos').update({ status: 'convertido' }).eq('id', orcamento.id);

    carregarDados();
  };

  const statusColors: Record<string, string> = {
    pendente: 'bg-yellow-600/20 text-yellow-400 border-yellow-600',
    aprovado: 'bg-blue-600/20 text-blue-400 border-blue-600',
    convertido: 'bg-green-600/20 text-green-400 border-green-600',
    cancelado: 'bg-red-600/20 text-red-400 border-red-600',
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Orçamentos" subtitulo="Emita e gerencie seus orçamentos" />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente ou número..."
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
            Novo Orçamento
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : orcamentosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Nenhum orçamento encontrado</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-700/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.map((orcamento) => {
                  const cliente = clientes.find((c) => c.id === orcamento.cliente_id);
                  return (
                    <tr key={orcamento.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm font-medium text-white">Nº {String(orcamento.numero).padStart(4, '0')}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{cliente?.nome_razao_social || 'Cliente não encontrado'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{formatarData(orcamento.data_emissao)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-400">{formatarMoeda(orcamento.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded border ${statusColors[orcamento.status]}`}>
                          {orcamento.status.charAt(0).toUpperCase() + orcamento.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handlePreviewPDF(orcamento)} disabled={pdfGerandoId === orcamento.id} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors" title="Visualizar PDF" aria-label="Visualizar PDF">
                            {pdfGerandoId === orcamento.id ? <Loader2 size={17} className="animate-spin" /> : <Eye size={17} />}
                          </button>
                          <button onClick={() => handleEdit(orcamento)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors" title="Editar" aria-label="Editar">
                            <Edit2 size={17} />
                          </button>
                          <button onClick={() => handleDownloadPDF(orcamento)} disabled={pdfGerandoId === orcamento.id} className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors" title="Baixar PDF" aria-label="Baixar PDF">
                            {pdfGerandoId === orcamento.id ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />}
                          </button>
                          {orcamento.status === 'pendente' && (
                            <button onClick={() => converterParaNotaFiscal(orcamento)} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors" title="Converter em Nota Fiscal" aria-label="Converter em Nota Fiscal">
                              <ArrowRight size={17} />
                            </button>
                          )}
                          <button onClick={() => { setOrcamentoSelecionado(orcamento); setModalExcluir(true); }} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors" title="Excluir" aria-label="Excluir">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={viewMode === 'small' ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid gap-4 xl:grid-cols-2'}>
            {orcamentosFiltrados.map((orcamento) => {
              const cliente = clientes.find((c) => c.id === orcamento.cliente_id);
              const compact = viewMode === 'small';
              return (
                <div
                  key={orcamento.id}
                  className={`bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors ${compact ? 'p-3' : 'p-4'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      {!compact && (
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex shrink-0 items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-white`}>
                            Orçamento Nº {String(orcamento.numero).padStart(4, '0')}
                          </h3>
                          <span className={`px-2 py-0.5 text-[11px] rounded border ${statusColors[orcamento.status]}`}>
                            {orcamento.status.charAt(0).toUpperCase() + orcamento.status.slice(1)}
                          </span>
                        </div>
                        <p className={`text-slate-400 ${compact ? 'text-xs' : 'text-sm'} flex items-center gap-1.5 mt-1 truncate`}>
                          <User size={13} /> {cliente?.nome_razao_social || 'Cliente não encontrado'}
                        </p>
                        <div className={`flex flex-wrap gap-x-3 gap-y-1 mt-2 ${compact ? 'text-xs' : 'text-sm'} text-slate-400`}>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} /> {formatarData(orcamento.data_emissao)}
                          </span>
                          <span className="font-semibold text-green-400">{formatarMoeda(orcamento.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <button onClick={() => handlePreviewPDF(orcamento)} disabled={pdfGerandoId === orcamento.id} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors" title="Visualizar PDF" aria-label="Visualizar PDF">
                        {pdfGerandoId === orcamento.id ? <Loader2 size={17} className="animate-spin" /> : <Eye size={17} />}
                      </button>
                      <button onClick={() => handleEdit(orcamento)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors" title="Editar" aria-label="Editar">
                        <Edit2 size={17} />
                      </button>
                      <button onClick={() => handleDownloadPDF(orcamento)} disabled={pdfGerandoId === orcamento.id} className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors" title="Baixar PDF" aria-label="Baixar PDF">
                        {pdfGerandoId === orcamento.id ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />}
                      </button>
                      {orcamento.status === 'pendente' && (
                        <button onClick={() => converterParaNotaFiscal(orcamento)} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors" title="Converter em Nota Fiscal" aria-label="Converter em Nota Fiscal">
                          <ArrowRight size={17} />
                        </button>
                      )}
                      <button onClick={() => { setOrcamentoSelecionado(orcamento); setModalExcluir(true); }} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors" title="Excluir" aria-label="Excluir">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!pdfPreviewUrl}
        onClose={() => setPdfPreviewUrl(null)}
        title="Prévia do Orçamento"
        size="xl"
      >
        <div className="space-y-3">
          <div className="h-[70vh] overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                title="Prévia do orçamento em PDF"
                className="h-full w-full bg-white"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPdfPreviewUrl(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
            {pdfPreviewUrl && (
              <a
                href={pdfPreviewUrl}
                download={pdfPreviewFileName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FileDown size={17} /> Baixar PDF
              </a>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={orcamentoSelecionado ? 'Editar Orçamento' : 'Novo Orçamento'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cliente *</label>
              <select
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome_razao_social}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Validade (dias)</label>
              <input
                type="number"
                min="1"
                value={formData.validade_dias}
                onChange={(e) => setFormData({ ...formData, validade_dias: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-medium text-white mb-3">Adicionar Itens</h3>

            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                <select
                  value={novoItem.tipo}
                  onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as 'produto' | 'servico' })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="produto">Produto</option>
                  <option value="servico">Serviço</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Item</label>
                <select
                  value={novoItem.item_id}
                  onChange={(e) => setNovoItem({ ...novoItem, item_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  {novoItem.tipo === 'produto'
                    ? produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} - {formatarMoeda(p.preco_venda)}
                        </option>
                      ))
                    : servicos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} - {formatarMoeda(s.preco)}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {itens.length > 0 && (
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">Descrição</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-slate-300">Qtd</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-slate-300">Valor Unit.</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-slate-300">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, index) => (
                    <tr key={item.id} className="border-t border-slate-700">
                      <td className="px-4 py-2 text-white">{item.descricao}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{item.quantidade}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatarMoeda(item.valor_unitario)}</td>
                      <td className="px-4 py-2 text-right text-green-400 font-medium">{formatarMoeda(item.valor_total)}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removerItem(index)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 border-t border-slate-700">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-white">
                      Total:
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-green-400">{formatarMoeda(calcularTotal())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Forma de Pagamento</label>
              <select
                value={formData.forma_pagamento}
                onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as typeof formData.forma_pagamento })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pix">Pix</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Débito">Débito</option>
                <option value="Crédito à Vista">Crédito à Vista</option>
                <option value="Crédito Parcelado">Crédito Parcelado</option>
              </select>
            </div>
            {formData.forma_pagamento === 'Crédito Parcelado' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Parcelas</label>
                <select
                  value={formData.parcelas}
                  onChange={(e) => setFormData({ ...formData, parcelas: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tempo de Garantia</label>
              <input
                type="text"
                value={formData.garantia}
                onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                placeholder="Ex.: 90 dias"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-1">Tempo de Execução do Serviço</label>
              <input
                type="text"
                value={formData.execucao}
                onChange={(e) => setFormData({ ...formData, execucao: e.target.value })}
                placeholder="Ex.: 7 dias úteis"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Observações do orçamento"
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
              {orcamentoSelecionado ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalVisualizar}
        onClose={() => setModalVisualizar(false)}
        title={`Orçamento Nº ${orcamentoSelecionado?.numero}`}
        size="lg"
      >
        {orcamentoSelecionado && (
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">CLIENTE</h3>
              <p className="text-white font-medium">
                {clientes.find((c) => c.id === orcamentoSelecionado.cliente_id)?.nome_razao_social}
              </p>
            </div>

            {orcamentoSelecionado.itens && orcamentoSelecionado.itens.length > 0 && (
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">Descrição</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-300">Qtd</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-slate-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamentoSelecionado.itens.map((item) => (
                      <tr key={item.id} className="border-t border-slate-700">
                        <td className="px-4 py-2 text-white">{item.descricao}</td>
                        <td className="px-4 py-2 text-right text-slate-300">{item.quantidade}</td>
                        <td className="px-4 py-2 text-right text-green-400">{formatarMoeda(item.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-700">
              <span className="text-slate-400">Total do Orçamento:</span>
              <span className="text-2xl font-bold text-green-400">{formatarMoeda(orcamentoSelecionado.total)}</span>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalVisualizar(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setModalVisualizar(false);
                  handlePreviewPDF(orcamentoSelecionado);
                }}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye size={18} /> Visualizar PDF
              </button>
              <button
                onClick={() => {
                  setModalVisualizar(false);
                  handleDownloadPDF(orcamentoSelecionado);
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FileDown size={18} /> Gerar PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={modalExcluir}
        onClose={() => setModalExcluir(false)}
        onConfirm={handleDelete}
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
