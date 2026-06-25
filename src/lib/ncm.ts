export interface NcmItem {
  codigo: string;
  descricao: string;
}

// Lista resumida de códigos NCM mais comuns para autocomplete.
export const NCM_LIST: NcmItem[] = [
  { codigo: '8517.12.31', descricao: 'Telefones celulares (smartphones)' },
  { codigo: '8517.13.00', descricao: 'Telefones inteligentes (smartphones)' },
  { codigo: '8517.62.59', descricao: 'Outros aparelhos de transmissão/recepção' },
  { codigo: '8471.30.12', descricao: 'Notebooks / Laptops' },
  { codigo: '8471.30.19', descricao: 'Tablets e similares' },
  { codigo: '8471.41.10', descricao: 'Computadores (desktops)' },
  { codigo: '8471.60.52', descricao: 'Teclados para computador' },
  { codigo: '8471.60.53', descricao: 'Mouses' },
  { codigo: '8471.70.00', descricao: 'Unidades de memória / HDs' },
  { codigo: '8473.30.99', descricao: 'Partes e acessórios para computador' },
  { codigo: '8504.40.90', descricao: 'Carregadores e fontes de alimentação' },
  { codigo: '8506.50.10', descricao: 'Pilhas de lítio' },
  { codigo: '8507.60.00', descricao: 'Baterias de íons de lítio' },
  { codigo: '8507.80.00', descricao: 'Outras baterias / acumuladores elétricos' },
  { codigo: '8518.30.00', descricao: 'Fones de ouvido / Headsets' },
  { codigo: '8518.21.00', descricao: 'Caixas de som / Alto-falantes' },
  { codigo: '8523.51.10', descricao: 'Cartões de memória / Pen drives' },
  { codigo: '8528.52.20', descricao: 'Monitores de vídeo' },
  { codigo: '8528.72.00', descricao: 'Televisores' },
  { codigo: '8544.42.00', descricao: 'Cabos com conectores (USB, HDMI, etc.)' },
  { codigo: '9002.90.00', descricao: 'Lentes e componentes ópticos' },
  { codigo: '9405.40.90', descricao: 'Outros aparelhos de iluminação elétrica' },
  { codigo: '3926.90.90', descricao: 'Outras obras de plástico (capas, suportes)' },
  { codigo: '7009.10.00', descricao: 'Espelhos retrovisores' },
  { codigo: '8708.29.99', descricao: 'Outras partes e acessórios para veículos' },
];

export function filtrarNcm(query: string, limit = 8): NcmItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return NCM_LIST.slice(0, limit);
  return NCM_LIST.filter(
    (i) =>
      i.codigo.toLowerCase().includes(q) ||
      i.descricao.toLowerCase().includes(q)
  ).slice(0, limit);
}