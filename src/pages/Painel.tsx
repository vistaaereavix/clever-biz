import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import {
  Users,
  Package,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';
import { formatarMoeda, formatarData } from '../lib/utils';

interface DashboardStats {
  totalClientes: number;
  totalFornecedores: number;
  totalProdutos: number;
  totalServicos: number;
  totalOrcamentos: number;
  orcamentosPendentes: number;
  totalNotas: number;
  notasEmitidas: number;
  faturamentoTotal: number;
}

export function Painel() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalFornecedores: 0,
    totalProdutos: 0,
    totalServicos: 0,
    totalOrcamentos: 0,
    orcamentosPendentes: 0,
    totalNotas: 0,
    notasEmitidas: 0,
    faturamentoTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [ultimosOrcamentos, setUltimosOrcamentos] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);

    const [
      { data: clientes },
      { data: fornecedores },
      { data: produtos },
      { data: servicos },
      { data: orcamentos },
      { data: notas },
    ] = await Promise.all([
      supabase.from('clientes').select('id'),
      supabase.from('fornecedores').select('id'),
      supabase.from('produtos').select('id'),
      supabase.from('servicos').select('id'),
      supabase.from('orcamentos').select('*, cliente:clientes(nome_razao_social)'),
      supabase.from('notas_fiscais').select('*'),
    ]);

    const orcamentosPendentes = (orcamentos || []).filter((o) => o.status === 'pendente').length;
    const notasEmitidas = (notas || []).filter((n) => n.status === 'emitida').length;
    const faturamentoTotal = (notas || [])
      .filter((n) => n.status === 'emitida')
      .reduce((acc, n) => acc + n.valor_total, 0);

    setStats({
      totalClientes: clientes?.length || 0,
      totalFornecedores: fornecedores?.length || 0,
      totalProdutos: produtos?.length || 0,
      totalServicos: servicos?.length || 0,
      totalOrcamentos: orcamentos?.length || 0,
      orcamentosPendentes,
      totalNotas: notas?.length || 0,
      notasEmitidas,
      faturamentoTotal,
    });

    setUltimosOrcamentos((orcamentos || []).slice(0, 5));

    setLoading(false);
  };

  const cards = [
    {
      label: 'Clientes',
      value: stats.totalClientes,
      icon: Users,
      color: 'bg-blue-600/20 text-blue-400',
    },
    {
      label: 'Produtos',
      value: stats.totalProdutos,
      icon: Package,
      color: 'bg-green-600/20 text-green-400',
    },
    {
      label: 'Orçamentos',
      value: stats.totalOrcamentos,
      icon: FileText,
      color: 'bg-yellow-600/20 text-yellow-400',
    },
    {
      label: 'Notas Emitidas',
      value: stats.notasEmitidas,
      icon: Receipt,
      color: 'bg-purple-600/20 text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Header titulo="Painel" subtitulo="Visão geral do sistema" />

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${card.color}`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Resumo Financeiro</h3>
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Faturamento Total</span>
                    <span className="text-xl font-bold text-green-400">
                      {formatarMoeda(stats.faturamentoTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Orçamentos Pendentes</span>
                    <span className="text-xl font-bold text-yellow-400">
                      {stats.orcamentosPendentes}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Total de Fornecedores</span>
                    <span className="text-xl font-bold text-blue-400">
                      {stats.totalFornecedores}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-400">Total de Serviços</span>
                    <span className="text-xl font-bold text-purple-400">
                      {stats.totalServicos}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Últimos Orçamentos</h3>
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>

                {ultimosOrcamentos.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum orçamento registrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ultimosOrcamentos.map((orcamento) => (
                      <div
                        key={orcamento.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">
                            Orçamento Nº {String(orcamento.numero).padStart(4, '0')}
                          </p>
                          <p className="text-sm text-slate-400">
                            {orcamento.cliente?.nome_razao_social || 'Cliente não identificado'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-medium">
                            {formatarMoeda(orcamento.total)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatarData(orcamento.data_emissao)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Indicadores</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-600/20">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Aprovação</p>
                    <p className="text-white font-medium">
                      {stats.totalOrcamentos > 0
                        ? Math.round(
                            ((stats.totalOrcamentos - stats.orcamentosPendentes) /
                              stats.totalOrcamentos) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Emissão</p>
                    <p className="text-white font-medium">
                      {stats.totalOrcamentos > 0
                        ? Math.round((stats.notasEmitidas / stats.totalOrcamentos) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-600/20">
                    <Calendar className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Este mês</p>
                    <p className="text-white font-medium">
                      {formatarMoeda(stats.faturamentoTotal)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-600/20">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Clientes ativos</p>
                    <p className="text-white font-medium">{stats.totalClientes}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
