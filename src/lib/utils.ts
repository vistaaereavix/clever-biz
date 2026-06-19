import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatarCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarCNPJ(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatarDocumento(valor: string, tipo: 'CPF' | 'CNPJ'): string {
  return tipo === 'CPF' ? formatarCPF(valor) : formatarCNPJ(valor);
}

export function limparDocumento(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function validarCPF(cpf: string): boolean {
  const numeros = limparDocumento(cpf);
  if (numeros.length !== 11) return false;

  if (/^(\d)\1+$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10))) return false;

  return true;
}

export function validarCNPJ(cnpj: string): boolean {
  const numeros = limparDocumento(cnpj);
  if (numeros.length !== 14) return false;

  if (/^(\d)\1+$/.test(numeros)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros.charAt(i)) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (digito1 !== parseInt(numeros.charAt(12))) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros.charAt(i)) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  if (digito2 !== parseInt(numeros.charAt(13))) return false;

  return true;
}

export function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatarCEP(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarData(data: string): string {
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string): string {
  const date = new Date(data);
  return date.toLocaleString('pt-BR');
}

export async function buscarCNPJ(cnpj: string) {
  const cnpjLimpo = limparDocumento(cnpj);
  if (cnpjLimpo.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos numéricos');
  }

  // Validar CNPJ
  if (!validarCNPJ(cnpjLimpo)) {
    throw new Error('CNPJ inválido. Verifique os dígitos.');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado na base de dados');
      }
      throw new Error(`Erro na consulta: ${response.status}`);
    }

    const data = await response.json();

    // Formatar telefone se disponível
    let telefoneFormatado = '';
    if (data.ddd_telefone_1) {
      const tel = data.ddd_telefone_1.replace(/\D/g, '');
      telefoneFormatado = formatarTelefone(tel);
    }

    return {
      nome_razao_social: data.razao_social || data.nome_fantasia || '',
      nome_fantasia: data.nome_fantasia || '',
      email: data.email ? data.email.toLowerCase() : '',
      telefone: telefoneFormatado,
      cep: data.cep ? formatarCEP(data.cep) : '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      inscricao_estadual: '',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Erro ao buscar CNPJ. Verifique sua conexão.');
  }
}

export async function buscarCEP(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data = await response.json();
    return {
      cep: formatarCEP(data.cep || cepLimpo),
      logradouro: data.street || '',
      bairro: data.neighborhood || '',
      cidade: data.city || '',
      estado: data.state || '',
    };
  } catch {
    throw new Error('Erro ao buscar CEP');
  }
}

export function gerarCodigoProduto(): string {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PRD${random}`;
}

export function gerarCodigoServico(): string {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SRV${random}`;
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
