using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPayments([FromQuery] string companyId = "ggms-oman")
        {
            var targetCompany = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var payments = await _context.CustomerPayments
                .Where(payment => targetCompany == "all" || payment.CompanyId == targetCompany)
                .OrderByDescending(payment => payment.PaymentDate)
                .ToListAsync();

            return Ok(payments);
        }

        public class CreateCustomerPaymentDto
        {
            public string CompanyId { get; set; } = "ggms-oman";
            public string InvoiceId { get; set; } = string.Empty;
            public string Method { get; set; } = "Bank transfer";
            public string Reference { get; set; } = string.Empty;
            public decimal? Amount { get; set; }
        }

        [HttpPost("customer")]
        public async Task<IActionResult> CreateCustomerPayment([FromBody] CreateCustomerPaymentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.InvoiceId))
            {
                return BadRequest("Invoice is required.");
            }

            var invoice = await _context.Invoices.FirstOrDefaultAsync(item => item.Id == dto.InvoiceId);
            if (invoice == null)
            {
                return NotFound(new { message = $"Invoice {dto.InvoiceId} was not found." });
            }

            var targetCompany = string.IsNullOrWhiteSpace(dto.CompanyId) ? "ggms-oman" : dto.CompanyId;
            if (targetCompany != "all" && invoice.CompanyId != targetCompany)
            {
                return BadRequest("Invoice does not belong to the selected company.");
            }
            if (_context.CurrentCompanyId != "all" && targetCompany != _context.CurrentCompanyId)
            {
                return BadRequest("Payment does not belong to the selected company.");
            }

            var postedPayments = await _context.CustomerPayments
                .Where(payment => payment.InvoiceId == invoice.Id && payment.Status == "Posted")
                .Select(payment => payment.Amount)
                .ToListAsync();
            var paidAmount = postedPayments.Sum();
            var balance = invoice.Amount - paidAmount;
            var paymentAmount = dto.Amount ?? balance;

            if (paymentAmount <= 0)
            {
                return BadRequest("Payment amount must be greater than zero.");
            }

            if (paymentAmount > balance)
            {
                return BadRequest($"Payment exceeds the invoice balance of {balance:0.000}.");
            }

            var payment = new CustomerPayment
            {
                Id = $"PAY-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                CompanyId = invoice.CompanyId,
                InvoiceId = invoice.Id,
                Customer = invoice.Customer,
                Amount = decimal.Round(paymentAmount, 3),
                Method = string.IsNullOrWhiteSpace(dto.Method) ? "Bank transfer" : dto.Method,
                Reference = dto.Reference ?? string.Empty,
                PaymentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                Status = "Posted"
            };

            var newPaidAmount = paidAmount + payment.Amount;
            invoice.Status = newPaidAmount >= invoice.Amount ? "Paid" : "Partially Paid";

            _context.CustomerPayments.Add(payment);
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = invoice.CompanyId,
                Message = $"Customer payment recorded for {invoice.Id}: {payment.Amount:N3}."
            });

            await _context.SaveChangesAsync();

            return Ok(payment);
        }

        [HttpGet("supplier")]
        public async Task<IActionResult> GetSupplierPayments([FromQuery] string companyId = "ggms-oman")
        {
            var targetCompany = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var payments = await _context.SupplierPayments
                .Where(payment => targetCompany == "all" || payment.CompanyId == targetCompany)
                .OrderByDescending(payment => payment.PaymentDate)
                .ToListAsync();

            return Ok(payments);
        }

        public class CreateSupplierPaymentDto
        {
            public string CompanyId { get; set; } = "ggms-oman";
            public string BillId { get; set; } = string.Empty;
            public string Method { get; set; } = "Bank transfer";
            public string Reference { get; set; } = string.Empty;
            public decimal Amount { get; set; }
        }

        [HttpPost("supplier")]
        public async Task<IActionResult> CreateSupplierPayment([FromBody] CreateSupplierPaymentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BillId))
            {
                return BadRequest("Bill is required.");
            }

            var bill = await _context.Bills.FirstOrDefaultAsync(item => item.Id == dto.BillId);
            if (bill == null)
            {
                return NotFound(new { message = $"Bill {dto.BillId} was not found." });
            }

            var targetCompany = string.IsNullOrWhiteSpace(dto.CompanyId) ? "ggms-oman" : dto.CompanyId;
            if (targetCompany != "all" && bill.CompanyId != targetCompany)
            {
                return BadRequest("Bill does not belong to the selected company.");
            }
            if (_context.CurrentCompanyId != "all" && targetCompany != _context.CurrentCompanyId)
            {
                return BadRequest("Payment does not belong to the selected company.");
            }

            var postedPayments = await _context.SupplierPayments
                .Where(payment => payment.BillId == bill.Id && payment.Status == "Posted")
                .Select(payment => payment.Amount)
                .ToListAsync();
            var paidAmount = postedPayments.Sum();
            var balance = bill.Amount - paidAmount;
            if (dto.Amount <= 0 || dto.Amount > balance)
            {
                return BadRequest($"Payment must be greater than zero and no more than the bill balance of {balance:0.000}.");
            }

            var payment = new SupplierPayment
            {
                Id = $"SPAY-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                CompanyId = bill.CompanyId,
                BillId = bill.Id,
                Supplier = bill.Supplier,
                Amount = decimal.Round(dto.Amount, 3),
                Method = string.IsNullOrWhiteSpace(dto.Method) ? "Bank transfer" : dto.Method,
                Reference = dto.Reference?.Trim() ?? string.Empty,
                PaymentDate = DateTime.Now.ToString("yyyy-MM-dd"),
                Status = "Posted"
            };

            var newPaidAmount = paidAmount + payment.Amount;
            bill.Status = newPaidAmount >= bill.Amount ? "Paid" : "Partially Paid";
            _context.SupplierPayments.Add(payment);
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = bill.CompanyId,
                Message = $"Supplier payment recorded for {bill.Id}: {payment.Amount:N3}."
            });

            await _context.SaveChangesAsync();
            return Ok(payment);
        }
    }
}
