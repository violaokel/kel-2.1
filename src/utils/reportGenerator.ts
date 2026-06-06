/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StockTransaction, SchoolMenu } from "../types";

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
 * Opens a beautiful styled layout optimized for browser printing (PDF generator)
 */
export function printReport(title: string, subtitle: string, headers: string[], rows: string[][]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, habilite popups para visualizar o relatório para impressão.");
    return;
  }

  const currentDate = new Date().toLocaleString("pt-BR");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 30px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #047857;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .logo-title {
          display: flex;
          flex-direction: column;
        }
        .logo-title h1 {
          margin: 0;
          font-size: 24px;
          color: #047857;
        }
        .logo-title p {
          margin: 3px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        .meta-info {
          text-align: right;
          font-size: 12px;
          color: #777;
        }
        h2 {
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 10px;
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 13px;
        }
        th {
          background-color: #f3f4f6;
          color: #111827;
          font-weight: bold;
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #d1d5db;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9ca3af;
        }
        .badge {
          display: inline-block;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
        .badge-entrada { background-color: #d1fae5; color: #065f46; }
        .badge-saida { background-color: #fee2e2; color: #991b1b; }
        .badge-desper { background-color: #fef3c7; color: #92400e; }
        @media print {
          body { margin: 15px; }
          .header { border-bottom-color: #000; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-title">
          <h1>Controle de Estoque (kel)</h1>
          <p>${subtitle}</p>
        </div>
        <div class="meta-info">
          Gerado em: ${currentDate}<br>
          (CAEF) Centro de Apoio ao Ensino Fundamental
        </div>
      </div>
      
      <h2>${title}</h2>
      
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => {
                if (cell === "ENTRADA") return `<td><span class="badge badge-entrada">ENTRADA</span></td>`;
                if (cell === "SAIDA") return `<td><span class="badge badge-saida">SAÍDA</span></td>`;
                if (cell === "DESPERDÍCIO" || cell === "DESPERDICIO") return `<td><span class="badge badge-desper">DESPERDÍCIO</span></td>`;
                return `<td>${cell}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
      
      <div class="footer">
        <span>Sistema de Abastecimento Escolar (kel) - Perfil Administrador</span>
        <span>Rubrica de Recebimento de Carga: __________________________________</span>
      </div>

      <script>
        window.onload = function() {
          // Automatic trigger print setup
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
