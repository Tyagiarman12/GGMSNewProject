using System.IO;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Services
{
    public class VatScannerService : IVatScannerService
    {
        public Task<VatScanResult> ScanBillAsync(Stream fileStream, string fileName)
        {
            // In a production system, you would connect to Azure Document Intelligence (Form Recognizer)
            // or an OCR provider here.
            
            // Simulating a delay and returning matching demo scan data.
            var mockResult = new VatScanResult
            {
                SupplierName = "Muscat Technical Trading LLC",
                SupplierVat = "OM110223344",
                InvoiceNumber = "MTT-INV-28671",
                InvoiceDate = "2026-06-06",
                NetAmount = 128.00m,
                VatAmount = 6.10m,
                TotalAmount = 134.10m,
                Currency = "OMR",
                Category = "Cable",
                Confidence = 91
            };

            return Task.FromResult(mockResult);
        }
    }
}
