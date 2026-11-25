using GGMSNEWPROJECT.Models;
using GGMSNEWPROJECT.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IBlobService _blobService;
        private readonly IVatScannerService _vatScannerService;

        public ExpensesController(AppDbContext context, IBlobService blobService, IVatScannerService vatScannerService)
        {
            _context = context;
            _blobService = blobService;
            _vatScannerService = vatScannerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetExpenses()
        {
            var expenses = await _context.Expenses.ToListAsync();
            return Ok(expenses);
        }

        [HttpPost]
        public async Task<IActionResult> CreateExpense([FromBody] Expense expense)
        {
            if (string.IsNullOrWhiteSpace(expense.Category))
            {
                return BadRequest("Expense category is required.");
            }
            if (expense.Amount <= 0 || expense.Vat < 0 || expense.Vat > expense.Amount)
            {
                return BadRequest("Expense total must be positive and VAT must be between zero and the total.");
            }
            if (string.IsNullOrEmpty(expense.Id))
            {
                expense.Id = $"EXP-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            }
            if (string.IsNullOrWhiteSpace(expense.CompanyId))
            {
                expense.CompanyId = _context.CurrentCompanyId;
            }
            if (_context.CurrentCompanyId != "all" && expense.CompanyId != _context.CurrentCompanyId)
            {
                return BadRequest("Expense does not belong to the selected company.");
            }
            expense.Status = "Pending";

            _context.Expenses.Add(expense);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = expense.CompanyId,
                Message = $"Expense submitted: {expense.Category} for project {expense.Project}"
            });

            await _context.SaveChangesAsync();
            return Ok(expense);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
        {
            var expense = await _context.Expenses.FirstOrDefaultAsync(item => item.Id == id);
            if (expense == null)
            {
                return NotFound(new { message = $"Expense {id} was not found." });
            }

            var normalizedStatus = status?.Trim();
            var canTransition = (expense.Status == "Pending" && (normalizedStatus == "Approved" || normalizedStatus == "Rejected"))
                || (expense.Status == "Approved" && normalizedStatus == "Posted");
            if (!canTransition)
            {
                return BadRequest($"Expense cannot transition from {expense.Status} to {normalizedStatus ?? "an empty status"}.");
            }

            expense.Status = normalizedStatus!;
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = expense.CompanyId,
                Message = $"Expense {expense.Id} was {normalizedStatus!.ToLowerInvariant()}."
            });
            await _context.SaveChangesAsync();
            return Ok(expense);
        }

        [HttpPost("receipt")]
        public async Task<IActionResult> UploadReceipt([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Choose a receipt file.");
            }
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest("Receipt files must be 10 MB or smaller.");
            }
            if (file.ContentType is not ("application/pdf" or "image/jpeg" or "image/png"))
            {
                return BadRequest("Receipt must be a PDF, JPEG, or PNG file.");
            }

            await using var stream = file.OpenReadStream();
            var receiptUrl = await _blobService.UploadBlobAsync(stream, file.FileName, file.ContentType);
            return Ok(new { receiptUrl });
        }

        [HttpPost("scan")]
        public async Task<IActionResult> ScanBill(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest("Bill files must be 10 MB or smaller.");
            }
            if (file.ContentType is not ("application/pdf" or "image/jpeg" or "image/png"))
            {
                return BadRequest("Bill must be a PDF, JPEG, or PNG file.");
            }

            try
            {
                // 1. Upload the file to Blob Storage (or local fallback)
                string fileUrl;
                using (var stream = file.OpenReadStream())
                {
                    fileUrl = await _blobService.UploadBlobAsync(stream, file.FileName, file.ContentType);
                }

                // This provider currently returns sample data. The scan endpoint only previews;
                // reviewed values are persisted through the bill confirmation endpoint.
                VatScanResult scanResult;
                using (var stream = file.OpenReadStream())
                {
                    scanResult = await _vatScannerService.ScanBillAsync(stream, file.FileName);
                }

                return Ok(new
                {
                    scanResult,
                    receiptUrl = fileUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
