using System.IO;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Services
{
    public class VatScanResult
    {
        public string SupplierName { get; set; } = string.Empty;
        public string SupplierVat { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public string InvoiceDate { get; set; } = string.Empty;
        public decimal NetAmount { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Confidence { get; set; }
    }

    public interface IVatScannerService
    {
        Task<VatScanResult> ScanBillAsync(Stream fileStream, string fileName);
    }
}
