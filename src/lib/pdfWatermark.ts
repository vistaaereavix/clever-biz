import type jsPDF from 'jspdf';

/**
 * Adiciona uma marca d'água clara e diagonal em todas as páginas do PDF.
 * Deve ser chamada imediatamente antes de `doc.save(...)`.
 */
export function aplicarMarcaDagua(doc: jsPDF, texto: string) {
  const t = (texto || 'DOCUMENTO').toUpperCase();
  const total = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const anyDoc = doc as any;
    const prevAlpha = anyDoc.GState ? null : null;

    // Transparência (suportada no jsPDF moderno)
    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.08 }));
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(70);
    doc.setTextColor(120, 120, 120);
    doc.text(t, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    } as any);

    // Restaura opacidade total para conteúdo subsequente (se houver)
    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    }
    void prevAlpha;
  }

  doc.setTextColor(0, 0, 0);
}