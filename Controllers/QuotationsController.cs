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
    public class QuotationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuotationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetQuotations(
            [FromQuery] string companyId = "ggms-oman",
            [FromQuery] bool paginate = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string search = "")
        {
            try
            {
                var targetCompany = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
                var allList = await _context.Quotations
                    .Where(q => targetCompany == "all" || q.CompanyId == targetCompany)
                    .ToListAsync();
                allList.Reverse();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLower();
                    allList = allList.Where(q => (q.Customer != null && q.Customer.ToLower().Contains(lowerSearch)) || 
                                                 (q.Title != null && q.Title.ToLower().Contains(lowerSearch)) || 
                                                 (q.Status != null && q.Status.ToLower().Contains(lowerSearch))).ToList();
                }

                if (paginate)
                {
                    if (page < 1) page = 1;
                    if (pageSize < 1) pageSize = 5;

                    var totalItems = allList.Count;
                    var totalPages = (int)System.Math.Ceiling((double)totalItems / pageSize);
                    if (totalPages < 1) totalPages = 1;

                    var items = allList
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .ToList();

                    var quoteValue = allList.Sum(q => q.Amount);
                    var approvedValue = allList.Where(q => q.Status == "Approved").Sum(q => q.Amount);
                    var expiredCount = allList.Count(q => q.Status == "Expired");

                    return Ok(new
                    {
                        items,
                        totalItems,
                        totalPages,
                        page,
                        pageSize,
                        quoteValue,
                        approvedValue,
                        expiredCount
                    });
                }

                return Ok(allList);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetQuotation(string id)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {id} not found" });
            }
            return Ok(quotation);
        }

        public class CreateQuotationDto
        {
            public string CompanyId { get; set; } = "ggms-oman";
            public string Customer { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public string Status { get; set; } = "Draft"; // e.g. Sent, Approved, Expired, Draft
            public string Expires { get; set; } = string.Empty;
            public string LastFollowUp { get; set; } = "Not sent";
            public string Salesperson { get; set; } = string.Empty;
            public decimal Discount { get; set; }
            public string ItemsJson { get; set; } = "[]";
            public string Notes { get; set; } = string.Empty;
            public string TermsAndConditions { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateQuotation([FromBody] CreateQuotationDto dto)
        {
            // Generate a quotation ID like: QT-OM-2205
            var maxIdNum = 2204;
            var quotes = await _context.Quotations.ToListAsync();
            foreach (var q in quotes)
            {
                if (q.Id.StartsWith("QT-OM-") && int.TryParse(q.Id.Substring(6), out int num))
                {
                    if (num > maxIdNum)
                    {
                        maxIdNum = num;
                    }
                }
            }
            var quoteId = $"QT-OM-{maxIdNum + 1}";

            var quotation = new Quotation
            {
                Id = quoteId,
                CompanyId = string.IsNullOrWhiteSpace(dto.CompanyId) ? "ggms-oman" : dto.CompanyId,
                Customer = dto.Customer,
                Title = dto.Title,
                Amount = dto.Amount,
                Vat = Math.Round(dto.Amount * 0.05m, 2), // 5% VAT rate
                Status = dto.Status,
                Expires = string.IsNullOrEmpty(dto.Expires) ? DateTime.Now.AddDays(30).ToString("yyyy-MM-dd") : dto.Expires,
                LastFollowUp = string.IsNullOrEmpty(dto.LastFollowUp) ? "Not sent" : dto.LastFollowUp,
                Salesperson = dto.Salesperson,
                Discount = dto.Discount,
                ItemsJson = dto.ItemsJson,
                Notes = dto.Notes,
                TermsAndConditions = dto.TermsAndConditions
            };

            _context.Quotations.Add(quotation);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Sales created new Quotation: {quotation.Customer} ({quotation.Amount} OMR)"
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetQuotation), new { id = quotation.Id }, quotation);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuotation(string id, [FromBody] CreateQuotationDto dto)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {id} not found" });
            }

            quotation.Customer = dto.Customer;
            quotation.Title = dto.Title;
            quotation.Amount = dto.Amount;
            quotation.Vat = Math.Round(dto.Amount * 0.05m, 2);
            quotation.Status = dto.Status;
            quotation.Expires = string.IsNullOrEmpty(dto.Expires) ? DateTime.Now.AddDays(30).ToString("yyyy-MM-dd") : dto.Expires;
            quotation.LastFollowUp = dto.LastFollowUp;
            quotation.Salesperson = dto.Salesperson;
            quotation.Discount = dto.Discount;
            quotation.ItemsJson = dto.ItemsJson;
            quotation.Notes = dto.Notes;
            quotation.TermsAndConditions = dto.TermsAndConditions;

            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Updated quotation profile: {quotation.Customer} ({quotation.Amount} OMR)"
            });
            await _context.SaveChangesAsync();

            return Ok(quotation);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {id} not found" });
            }

            quotation.Status = status;
            await _context.SaveChangesAsync();

            return Ok(quotation);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuotation(string id)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {id} not found" });
            }

            _context.Quotations.Remove(quotation);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Deleted Quotation: {quotation.Id}"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Quotation deleted successfully" });
        }

        public class SendQuotationEmailDto
        {
            public string Email { get; set; } = string.Empty;
        }

        [HttpPost("{id}/send-email")]
        public async Task<IActionResult> SendQuotationEmail(string id, [FromBody] SendQuotationEmailDto dto)
        {
            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
            {
                return NotFound(new { message = $"Quotation {id} not found" });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Recipient email address is required." });
            }

            quotation.Status = "Sent";
            quotation.LastFollowUp = DateTime.Now.ToString("yyyy-MM-dd");

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Sent Quotation {quotation.Id} to {dto.Email}"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Quotation {quotation.Id} successfully sent to {dto.Email}", quotation });
        }
    }
}
