export interface Usuario {
  id: string;
  email: string;
  senha: string;
  nome: string;
  criado_em: string;
}

export interface Cliente {
  id: string;
  documento: string;
  nome_razao_social: string;
  inscricao_estadual: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo_documento: string;
  user_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Fornecedor {
  id: string;
  documento: string;
  nome_razao_social: string;
  inscricao_estadual: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo_documento: string;
  user_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Produto {
  id: string;
  nome: string;
  codigo: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  user_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Servico {
  id: string;
  nome: string;
  codigo_municipal: string;
  preco: number;
  descricao: string;
  user_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  tipo: 'produto' | 'servico';
  item_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  user_id?: string;
  criado_em: string;
}

export interface Orcamento {
  id: string;
  cliente_id: string;
  numero: number;
  data_emissao: string;
  validade_dias: number;
  status: 'pendente' | 'aprovado' | 'convertido' | 'cancelado';
  observacoes: string;
  total: number;
  user_id?: string;
  criado_em: string;
  atualizado_em: string;
  cliente?: Cliente;
  itens?: OrcamentoItem[];
}

export interface NotaFiscal {
  id: string;
  orcamento_id: string;
  cliente_id: string;
  numero: number;
  serie: string;
  data_emissao: string;
  valor_total: number;
  status: 'pendente' | 'emitida' | 'rejeitada' | 'cancelada';
  xml_enviado: string;
  resposta_sefaz: string;
  chave_acesso: string;
  user_id?: string;
  criado_em: string;
  cliente?: Cliente;
  orcamento?: Orcamento;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  criado_em: string;
  atualizado_em: string;
}
