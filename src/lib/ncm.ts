export interface NcmItem {
  codigo: string;
  descricao: string;
}

// Lista resumida de códigos NCM mais comuns para autocomplete.
export const NCM_LIST: NcmItem[] = [
  { codigo: '8807.10.00', descricao: 'Hélice para drone (VANT)' },
  { codigo: '8807.30.00', descricao: 'Motor brushless para drone (VANT)' },
  { codigo: '8807.30.00', descricao: 'Módulo GPS/GNSS para drone (VANT)' },
  { codigo: '8807.30.00', descricao: 'Shell / carcaça / chassi para drone (VANT)' },
  { codigo: '8807.30.00', descricao: 'Trava de gimbal para drone (VANT)' },
  { codigo: '8526.92.00', descricao: 'Rádio controle (transmissor) para drone' },
  { codigo: '8523.51.10', descricao: 'Cartão micro SD' },
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