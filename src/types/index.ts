// Tipos do domínio do ERP. Campos opcionais espelham as colunas anuláveis do banco.

export interface Usuario {
  id: string;
  email: string;
  nome: string;
}

export interface EnderecoFields {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export interface Cliente extends EnderecoFields {
  id: string;
  user_id?: string;
  documento: string;
  tipo_documento: string;
  nome_razao_social: string;
  inscricao_estadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type Fornecedor = Cliente;

export interface Produto {
  id: string;
  user_id?: string;
  nome: string;
  codigo: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  created_at?: string;
  updated_at?: string;
}

export interface Servico {
  id: string;
  user_id?: string;
  nome: string;
  codigo_municipal?: string | null;
  preco: number;
  descricao?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrcamentoItem {
  id: string;
  user_id?: string;
  orcamento_id: string;
  tipo: "produto" | "servico";
  item_id?: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at?: string;
}

export type OrcamentoStatus = "pendente" | "aprovado" | "convertido" | "cancelado";

export interface Orcamento {
  id: string;
  user_id?: string;
  cliente_id: string | null;
  numero: number;
  data_emissao: string;
  validade_dias: number;
  status: OrcamentoStatus | string;
  observacoes?: string | null;
  total: number;
  created_at?: string;
  updated_at?: string;
  cliente?: Cliente | null;
  itens?: OrcamentoItem[];
}

export interface NotaFiscal {
  id: string;
  user_id?: string;
  orcamento_id?: string | null;
  cliente_id?: string | null;
  numero: number;
  serie: string;
  data_emissao: string;
  valor_total: number;
  status: string;
  xml_enviado?: string | null;
  resposta_sefaz?: string | null;
  chave_acesso?: string | null;
  created_at?: string;
  cliente?: Cliente | null;
  orcamento?: Orcamento | null;
}

export interface CompanySettings {
  id?: string;
  user_id?: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logo_url?: string | null;
}