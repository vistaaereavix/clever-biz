import type jsPDF from 'jspdf';

/**
 * Adiciona uma marca d'água clara (logo) centralizada em todas as páginas do PDF.
 * Deve ser chamada imediatamente antes de `doc.save(...)`.
 * Se `logoUrl` for omitido, usa o texto como fallback.
 */
export function aplicarMarcaDagua(doc: jsPDF, textoOuLogo: string, logoUrl?: string) {
  const t = (textoOuLogo || 'DOCUMENTO').toUpperCase();
  const total = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const anyDoc = doc as any;

    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.06 }));
    }

    if (logoUrl) {
      try {
        const size = 130;
        const x = (pageWidth - size) / 2;
        const y = (pageHeight - size) / 2;
        try { doc.addImage(logoUrl, 'PNG', x, y, size, size); }
        catch { doc.addImage(logoUrl, 'JPEG', x, y, size, size); }
      } catch {
        // se falhar imagem, usa texto
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(70);
        doc.setTextColor(120, 120, 120);
        doc.text(t, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 } as any);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(70);
      doc.setTextColor(120, 120, 120);
      doc.text(t, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 } as any);
    }

    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    }
  }

  doc.setTextColor(0, 0, 0);
}