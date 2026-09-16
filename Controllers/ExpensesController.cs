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
            if (string.IsNullOrEmpty(expense.Id))
            {
                expense.Id = $"EXP-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
            }
            expense.CompanyId = "ggms-oman";
            expense.Status = "Pending";

            _context.Expenses.Add(expense);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Expense submitted: {expense.Category} of {expense.Amount} OMR for project {expense.Project}"
            });

            await _context.SaveChangesAsync();
            return Ok(expense);
        }

        [HttpPost("scan")]
        public async Task<IActionResult> ScanBill(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            try
            {
                // 1. Upload the file to Blob Storage (or local fallback)
                string fileUrl;
                using (var stream = file.OpenReadStream())
                {
                    fileUrl = await _blobService.UploadBlobAsync(stream, file.FileName, file.ContentType);
                }

                // 2. Perform OCR scan simulation
                VatScanResult scanResult;
                using (var stream = file.OpenReadStream())
                {
                    scanResult = await _vatScannerService.ScanBillAsync(stream, file.FileName);
                }

                // 3. Create a pending expense record in the database representing this scan
                var expense = new Expense
                {
                    Id = $"EXP-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                    Date = DateTime.Now.ToString("yyyy-MM-dd"),
                    CompanyId = "ggms-oman",
                    Category = scanResult.Category,
                    Amount = scanResult.TotalAmount,
                    Vat = scanResult.VatAmount,
                    Status = "Pending",
                    Receipt = true,
                    ReceiptUrl = fileUrl,
                    Project = "General / Pending classification"
                };

                _context.Expenses.Add(expense);

                // Add corresponding bill to payables
                var bill = new Bill
                {
                    Id = $"BILL-{Guid.NewGuid().ToString().Substring(0, 3).ToUpper()}",
                    Supplier = scanResult.SupplierName,
                    Amount = scanResult.TotalAmount,
                    Due = DateTime.Now.AddDays(14).ToString("yyyy-MM-dd"),
                    Status = "To Pay"
                };
                _context.Bills.Add(bill);

                _context.TimelineEvents.Add(new TimelineEvent
                {
                    Timestamp = DateTime.Now,
                    Message = $"AI Scanner uploaded bill from {scanResult.SupplierName} with {scanResult.Confidence}% confidence."
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    scanResult,
                    receiptUrl = fileUrl,
                    expenseId = expense.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
