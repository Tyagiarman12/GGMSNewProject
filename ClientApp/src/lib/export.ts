/**
 * Export utility for Excel (CSV) and PDF.
 */

export function exportToCSV(data: any[], headers: string[], keys: string[], filename: string) {
  // Build CSV content
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));
  
  // Data rows
  for (const item of data) {
    const rowValues = keys.map(key => {
      let val = item[key];
      if (val === undefined || val === null) {
        val = "";
      } else if (Array.isArray(val)) {
        val = val.join("; ");
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(rowValues.join(","));
  }
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(title: string, data: any[], headers: string[], keys: string[]) {
  // Create an iframe to print the content
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const tableRows = data.map((item, idx) => {
    return `
      <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
        ${keys.map(key => {
          let val = item[key];
          if (Array.isArray(val)) val = val.join(", ");
          return `<td style="padding: 10px 12px; font-size: 13px; color: #334155;">${val ?? ""}</td>`;
        }).join("")}
      </tr>
    `;
  }).join("");

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 20px; }
          h1 { font-size: 20px; color: #0f172a; margin-bottom: 5px; }
          p { font-size: 12px; color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #0b1220; color: #ffffff; text-align: left; padding: 12px; font-size: 13px; font-weight: bold; }
          td { border-bottom: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Exported on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  doc.close();

  // Wait for loading before print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 500);
}
