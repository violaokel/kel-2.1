/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StockTransaction, SchoolMenu } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Download static text as file
 */
export function downloadCSV(filename: string, text: string) {
  const element = document.createElement("a");
  const file = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8;" }); // UTF-8 BOM for Excel support
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Format timestamp into local BR date string
 */
export function formatBRDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("pt-BR", { timeZone: "UTC" }).split(",")[0];
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp to full date/time
 */
export function formatBRDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("pt-BR");
  } catch {
    return dateStr;
  }
}

/**
 * Generates Excel-friendly CSV for complete stock listings
 */
export function exportProductsCSV(products: Product[]) {
  let csv = "Código ID;Nome do Produto;Código de Barras;Categoria;Quantidade;Unidade;Mínimo Recomendado;Fornecedor;Localização;Desperdício Acumulado;Vencimento;Status\n";
  
  products.forEach((p) => {
    const isLow = p.quantity <= p.minQuantity;
    const isExpired = new Date(p.expiryDate) < new Date();
    const status = isExpired ? "VENCIDO" : isLow ? "ESTOQUE BAIXO" : "NORMAL";
    
    csv += `"${p.id}";"${p.name}";"${p.barcode || ""}";"${p.category}";"${p.quantity}";"${p.unit}";"${p.minQuantity}";"${p.supplier}";"${p.location}";"${p.wastage}";"${p.expiryDate}";"${status}"\n`;
  });

  downloadCSV(`estoque-geral-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

/**
 * Generates CSV for active alerts or low stocks status
 */
export function exportAlertsCSV(products: Product[]) {
  const today = new Date();
  let csv = "Produto;Código;Categoria;Quantidade Atual;Unidade;Mínimo;Validade;Alerta Ativo\n";
  
  products.forEach((p) => {
    const isLow = p.quantity <= p.minQuantity;
    const isExpired = new Date(p.expiryDate) < today;
    const extDiff = new Date(p.expiryDate).getTime() - today.getTime();
    const daysToExpire = Math.ceil(extDiff / (1000 * 3600 * 24));
    const isNearExpiry = !isExpired && daysToExpire <= 10;

    if (isLow || isExpired || isNearExpiry) {
      const alertType = isExpired 
        ? "PRODUTO VENCIDO" 
        : isLow && isNearExpiry 
        ? "ESTOQUE BAIXO E VENCENDO" 
        : isLow 
        ? "ESTOQUE BAIXO" 
        : `VENCENDO EM ${daysToExpire} DIAS`;

      csv += `"${p.name}";"${p.barcode || ""}";"${p.category}";"${p.quantity}";"${p.unit}";"${p.minQuantity}";"${p.expiryDate}";"${alertType}"\n`;
    }
  });

  downloadCSV(`alertas-estoque-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

/**
 * Generates Excel-friendly CSV for general transaction registry
 */
export function exportTransactionsCSV(transactions: StockTransaction[]) {
  let csv = "Data;ID Transação;Produto;Tipo Movimentação;Quantidade;Unidade;Responsável;Observações\n";
  
  transactions.forEach((t) => {
    csv += `"${formatBRDateTime(t.date)}";"${t.id}";"${t.productName}";"${t.type.toUpperCase()}";"${t.quantity}";"${t.unit}";"${t.user}";"${t.notes}"\n`;
  });

  downloadCSV(`historico-entradas-saidas-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

/**
 * Generates a beautiful PDF report for download using jsPDF and jspdf-autotable
 */
export function printReport(title: string, subtitle: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleString("pt-BR");

  // Title / Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text("Controle de Estoque (kel)", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subtitle, 14, 26);

  // Metadata Info
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Gerado em: ${currentDate}`, 125, 20);
  doc.text("(CAEF) Apoio ao Ensino Fundamental", 125, 25);

  // Divider line
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.5);
  doc.line(14, 29, 196, 29);

  // Section Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 37);

  // Generate Table
  autoTable(doc, {
    startY: 42,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [4, 120, 87], // emerald-700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85] // slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { top: 40, bottom: 40, left: 14, right: 14 },
    didDrawCell: (data) => {
      // Keep colors elegant and standard
    }
  });

  // Footer & Signatures
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = 285;

    // Bottom divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 12, 196, footerY - 12);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Sistema de Abastecimento Escolar (kel) - Perfil Administrador", 14, footerY - 5);
    doc.text(`Página ${i} de ${pageCount}`, 175, footerY - 5);

    // Draw signature line on the last page only
    if (i === pageCount) {
      const sigY = footerY - 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Responsável: ____________________________________________", 14, sigY);
      doc.text("Visto: ________________________", 145, sigY);
    }
  }

  // Save / Trigger Download
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  doc.save(`relatorio-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
