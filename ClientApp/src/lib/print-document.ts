export function printDocument(selector: string): void {
  const documentElement = document.querySelector<HTMLElement>(selector);
  if (!documentElement) {
    console.error(`Cannot print document: no element found for selector "${selector}".`);
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert("Allow pop-ups for this site to print the document.");
    return;
  }

  const targetDocument = printWindow.document;
  targetDocument.open();
  targetDocument.write("<!doctype html><html><head><title></title></head><body></body></html>");

  const base = targetDocument.createElement("base");
  base.href = document.baseURI;
  targetDocument.head.append(base);
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((stylesheet) => {
    targetDocument.head.append(stylesheet.cloneNode(true));
  });

  const printStyles = targetDocument.createElement("style");
  printStyles.textContent = `
    @page { size: A4 portrait; margin: 10mm; }
    html, body {
      width: 190mm !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
    }
    body * { visibility: visible !important; }
    .quotation-print-document, .invoice-print-document {
      position: static !important;
      inset: auto !important;
      display: block !important;
      width: 190mm !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #fff !important;
      animation: none !important;
      page: auto !important;
    }
    .print-document-card {
      display: block !important;
      box-sizing: border-box !important;
      width: 190mm !important;
      max-width: none !important;
      min-height: 277mm !important;
      margin: 0 !important;
    }
    .print-document-body {
      display: flex !important;
      box-sizing: border-box !important;
      flex-direction: column !important;
      width: 100% !important;
      min-height: 277mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .print-document-footer {
      margin-top: auto !important;
    }
    .print-document-customer-grid,
    .print-document-summary-grid {
      display: grid !important;
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
      gap: 0.5rem !important;
    }
    .print-document-customer-grid > :first-child,
    .print-document-summary-grid > :first-child {
      grid-column: span 7 / span 7 !important;
    }
    .print-document-customer-grid > :last-child,
    .print-document-summary-grid > :last-child {
      grid-column: span 5 / span 5 !important;
    }
  `;
  targetDocument.head.append(printStyles);
  targetDocument.title = document.title;
  targetDocument.body.append(documentElement.cloneNode(true));
  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  }, { once: true });
  printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
  targetDocument.close();
}
