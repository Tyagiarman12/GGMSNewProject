using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetInvoices([FromQuery] string companyId = "ggms-oman")
        {
            var targetCompany = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var invoices = await _context.Invoices
                .Where(i => targetCompany == "all" || i.CompanyId == targetCompany)
                .ToListAsync();
            invoices.Reverse();
            return Ok(invoices);
        }

        public class CreateInvoiceDto
        {
            public string CompanyId { get; set; } = "ggms-oman";
            public string Customer { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public string Due { get; set; } = string.Empty;
            public string Status { get; set; } = "Open";
            public string Salesperson { get; set; } = string.Empty;
            public decimal Discount { get; set; }
            public decimal Vat { get; set; }
            public string ItemsJson { get; set; } = "[]";
            public string Notes { get; set; } = string.Empty;
            public string TermsAndConditions { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceDto dto)
        {
            try
            {
                // Generate a unique invoice ID like INV-3040
                var randIdNum = new System.Random().Next(3040, 9999);
                var invoiceId = $"INV-{randIdNum}";
                while (await _context.Invoices.AnyAsync(i => i.Id == invoiceId))
                {
                    randIdNum = new System.Random().Next(3040, 9999);
                    invoiceId = $"INV-{randIdNum}";
                }

                var invoice = new Invoice
                {
                    Id = invoiceId,
                    CompanyId = string.IsNullOrWhiteSpace(dto.CompanyId) ? "ggms-oman" : dto.CompanyId,
                    Customer = dto.Customer ?? "General Customer",
                    Amount = dto.Amount,
                    Due = string.IsNullOrEmpty(dto.Due) ? System.DateTime.Now.AddDays(30).ToString("yyyy-MM-dd") : dto.Due,
                    Status = dto.Status ?? "Open",
                    Salesperson = dto.Salesperson ?? "Commercial",
                    Discount = dto.Discount,
                    Vat = dto.Vat,
                    ItemsJson = dto.ItemsJson ?? "[]",
                    Notes = dto.Notes ?? "",
                    TermsAndConditions = dto.TermsAndConditions ?? ""
                };

                _context.Invoices.Add(invoice);

                // Process inventory stock adjustments for returned & sold items
                if (!string.IsNullOrWhiteSpace(dto.ItemsJson) && dto.ItemsJson != "[]")
                {
                    try
                    {
                        var items = System.Text.Json.JsonDocument.Parse(dto.ItemsJson).RootElement;
                        if (items.ValueKind == System.Text.Json.JsonValueKind.Array)
                        {
                            foreach (var item in items.EnumerateArray())
                            {
                                string productId = "";
                                if (item.TryGetProperty("productId", out var pIdProp))
                                {
                                    productId = pIdProp.GetString() ?? "";
                                }
                                else if (item.TryGetProperty("barcode", out var bProp))
                                {
                                    productId = bProp.GetString() ?? "";
                                }

                                decimal qty = 0;
                                if (item.TryGetProperty("quantity", out var qProp) || item.TryGetProperty("qty", out qProp))
                                {
                                    if (qProp.ValueKind == System.Text.Json.JsonValueKind.Number)
                                    {
                                        qty = qProp.GetDecimal();
                                    }
                                    else if (qProp.ValueKind == System.Text.Json.JsonValueKind.String)
                                    {
                                        decimal.TryParse(qProp.GetString(), out qty);
                                    }
                                }

                                if (!string.IsNullOrEmpty(productId) && qty != 0)
                                {
                                    var product = await _context.ProductItems.FirstOrDefaultAsync(p => p.Id == productId || p.Barcode == productId);
                                    if (product != null)
                                    {
                                        int intQty = (int)System.Math.Round(qty);
                                        if (intQty < 0)
                                        {
                                            // Product return: add stock back to inventory!
                                            product.Stock += System.Math.Abs(intQty);
                                        }
                                        else
                                        {
                                            // Normal sale: deduct stock
                                            product.Stock = System.Math.Max(0, product.Stock - intQty);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (System.Exception ex)
                    {
                        System.Console.WriteLine($"Error parsing itemsJson for inventory update: {ex.Message}");
                    }
                }

                _context.TimelineEvents.Add(new TimelineEvent
                {
                    Timestamp = System.DateTime.Now,
                    Message = $"Accounts posted Invoice: {invoice.Customer} ({invoice.Amount} OMR)"
                });

                await _context.SaveChangesAsync();
                return Ok(invoice);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error creating invoice: {ex}");
                return StatusCode(500, new { message = $"Failed to post invoice: {ex.Message}" });
            }
        }

        [HttpPost("convert-quotation/{quotationId}")]
        public async Task<IActionResult> ConvertQuotation(string quotationId)
        {
            var quotation = await _context.Quotations.FindAsync(quotationId);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {quotationId} not found." });
            }

            // Generate invoice ID
            var randIdNum = new System.Random().Next(3040, 9999);
            var invoiceId = $"INV-{randIdNum}";

            var invoice = new Invoice
            {
                Id = invoiceId,
                Customer = quotation.Customer,
                Amount = quotation.Amount,
                Due = System.DateTime.Now.AddDays(30).ToString("yyyy-MM-dd"),
                Status = "Open",
                Salesperson = quotation.Salesperson,
                Discount = quotation.Discount,
                Vat = quotation.Vat,
                ItemsJson = quotation.ItemsJson,
                Notes = quotation.Notes,
                TermsAndConditions = quotation.TermsAndConditions
            };

            _context.Invoices.Add(invoice);

            // Mark quotation as Approved if not already
            quotation.Status = "Approved";

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Converted Approved Quotation {quotationId} to Sales Invoice {invoiceId}"
            });

            await _context.SaveChangesAsync();
            return Ok(invoice);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(item => item.Id == id);
            if (invoice == null)
            {
                return NotFound(new { message = $"Invoice {id} was not found." });
            }

            var allowedStatuses = new[] { "Draft", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled", "Void" };
            if (!allowedStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest("Invalid invoice status.");
            }

            invoice.Status = status;
            await _context.SaveChangesAsync();
            return Ok(invoice);
        }
    }
}
