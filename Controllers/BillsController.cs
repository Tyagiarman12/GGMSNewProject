using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BillsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBills([FromQuery] string companyId = "ggms-oman")
        {
            var targetCompany = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var bills = await _context.Bills
                .Where(b => targetCompany == "all" || b.CompanyId == targetCompany)
                .ToListAsync();
            return Ok(bills);
        }

        public class ConfirmScannedBillDto
        {
            public string CompanyId { get; set; } = string.Empty;
            public string Supplier { get; set; } = string.Empty;
            public string SupplierVat { get; set; } = string.Empty;
            public string InvoiceNumber { get; set; } = string.Empty;
            public string InvoiceDate { get; set; } = string.Empty;
            public decimal NetAmount { get; set; }
            public decimal VatAmount { get; set; }
            public decimal TotalAmount { get; set; }
            public string Category { get; set; } = string.Empty;
            public string Project { get; set; } = string.Empty;
            public string Due { get; set; } = string.Empty;
            public string ReceiptUrl { get; set; } = string.Empty;
        }

        [HttpPost("confirm-scan")]
        public async Task<IActionResult> ConfirmScannedBill([FromBody] ConfirmScannedBillDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Supplier) || string.IsNullOrWhiteSpace(dto.InvoiceNumber))
            {
                return BadRequest("Supplier and supplier invoice number are required.");
            }
            if (dto.NetAmount <= 0 || dto.VatAmount < 0 || dto.TotalAmount <= 0
                || Math.Abs(dto.NetAmount + dto.VatAmount - dto.TotalAmount) > 0.005m)
            {
                return BadRequest("Bill amounts must be positive and net plus VAT must equal the total.");
            }

            var companyId = string.IsNullOrWhiteSpace(dto.CompanyId) ? _context.CurrentCompanyId : dto.CompanyId;
            if (_context.CurrentCompanyId != "all" && companyId != _context.CurrentCompanyId)
            {
                return BadRequest("Bill does not belong to the selected company.");
            }
            var duplicate = await _context.Bills.AnyAsync(bill =>
                bill.CompanyId == companyId && bill.Supplier == dto.Supplier
                && bill.InvoiceNumber == dto.InvoiceNumber);
            if (duplicate)
            {
                return Conflict("A bill with this supplier and invoice number already exists.");
            }

            var bill = new Bill
            {
                Id = $"BILL-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                CompanyId = companyId,
                Supplier = dto.Supplier.Trim(),
                SupplierVat = dto.SupplierVat.Trim(),
                InvoiceNumber = dto.InvoiceNumber.Trim(),
                InvoiceDate = dto.InvoiceDate,
                Amount = decimal.Round(dto.TotalAmount, 3),
                Vat = decimal.Round(dto.VatAmount, 3),
                ReceiptUrl = dto.ReceiptUrl,
                Due = string.IsNullOrWhiteSpace(dto.Due) ? DateTime.Now.AddDays(14).ToString("yyyy-MM-dd") : dto.Due,
                Status = "To Pay"
            };
            var expense = new Expense
            {
                Id = $"EXP-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                CompanyId = companyId,
                Date = string.IsNullOrWhiteSpace(dto.InvoiceDate) ? DateTime.Now.ToString("yyyy-MM-dd") : dto.InvoiceDate,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "Supplier bill" : dto.Category.Trim(),
                Amount = bill.Amount,
                Vat = bill.Vat,
                Status = "Pending",
                Receipt = !string.IsNullOrWhiteSpace(dto.ReceiptUrl),
                ReceiptUrl = dto.ReceiptUrl,
                Project = string.IsNullOrWhiteSpace(dto.Project) ? "Overhead" : dto.Project.Trim()
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();
            _context.Bills.Add(bill);
            _context.Expenses.Add(expense);
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = companyId,
                Message = $"Supplier bill {bill.InvoiceNumber} from {bill.Supplier} saved for review."
            });
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { bill, expense });
        }
    }
}
