using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseEnquiriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseEnquiriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetEnquiries([FromQuery] string companyId = "ggms-oman", [FromQuery] string search = "")
        {
            var query = _context.PurchaseEnquiries
                .Where(q => q.CompanyId == companyId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(q => q.SupplierName.ToLower().Contains(s) || q.Title.ToLower().Contains(s) || q.Status.ToLower().Contains(s));
            }

            var items = await query.ToListAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEnquiry(string id)
        {
            var enquiry = await _context.PurchaseEnquiries.FindAsync(id);
            if (enquiry == null)
            {
                return NotFound(new { message = $"Purchase Enquiry {id} not found." });
            }
            return Ok(enquiry);
        }

        public class CreateEnquiryDto
        {
            public string SupplierName { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public decimal Vat { get; set; }
            public string Status { get; set; } = "Draft";
            public string Date { get; set; } = string.Empty;
            public string Remarks { get; set; } = string.Empty;
            public string Salesperson { get; set; } = string.Empty;
            public string ItemsJson { get; set; } = "[]";
            public string Notes { get; set; } = string.Empty;
            public string TermsAndConditions { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateEnquiry([FromBody] CreateEnquiryDto dto)
        {
            if (string.IsNullOrEmpty(dto.SupplierName))
            {
                return BadRequest(new { message = "Supplier Name is required." });
            }

            // Generate sequential Enquiry ID like: PE-OM-1001
            var maxIdNum = 1000;
            var enquiries = await _context.PurchaseEnquiries.ToListAsync();
            foreach (var e in enquiries)
            {
                if (e.Id.StartsWith("PE-OM-") && int.TryParse(e.Id.Substring(6), out int num))
                {
                    if (num > maxIdNum)
                    {
                        maxIdNum = num;
                    }
                }
            }
            var enquiryId = $"PE-OM-{maxIdNum + 1}";

            var enquiry = new PurchaseEnquiry
            {
                Id = enquiryId,
                SupplierName = dto.SupplierName.Trim(),
                Title = dto.Title.Trim(),
                Amount = dto.Amount,
                Vat = dto.Vat,
                Status = dto.Status,
                Date = string.IsNullOrEmpty(dto.Date) ? System.DateTime.Now.ToString("yyyy-MM-dd") : dto.Date,
                Remarks = dto.Remarks.Trim(),
                Salesperson = dto.Salesperson.Trim(),
                ItemsJson = dto.ItemsJson,
                Notes = dto.Notes,
                TermsAndConditions = dto.TermsAndConditions,
                CompanyId = "ggms-oman"
            };

            _context.PurchaseEnquiries.Add(enquiry);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Purchase registered new Enquiry: {enquiry.Id} for {enquiry.SupplierName}"
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetEnquiry), new { id = enquiry.Id }, enquiry);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnquiry(string id, [FromBody] CreateEnquiryDto dto)
        {
            var enquiry = await _context.PurchaseEnquiries.FindAsync(id);
            if (enquiry == null)
            {
                return NotFound(new { message = $"Purchase Enquiry {id} not found." });
            }

            enquiry.SupplierName = dto.SupplierName.Trim();
            enquiry.Title = dto.Title.Trim();
            enquiry.Amount = dto.Amount;
            enquiry.Vat = dto.Vat;
            enquiry.Status = dto.Status;
            enquiry.Date = dto.Date;
            enquiry.Remarks = dto.Remarks.Trim();
            enquiry.Salesperson = dto.Salesperson.Trim();
            enquiry.ItemsJson = dto.ItemsJson;
            enquiry.Notes = dto.Notes;
            enquiry.TermsAndConditions = dto.TermsAndConditions;

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Updated Purchase Enquiry: {enquiry.Id}"
            });

            await _context.SaveChangesAsync();
            return Ok(enquiry);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnquiry(string id)
        {
            var enquiry = await _context.PurchaseEnquiries.FindAsync(id);
            if (enquiry == null)
            {
                return NotFound(new { message = $"Purchase Enquiry {id} not found." });
            }

            _context.PurchaseEnquiries.Remove(enquiry);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Deleted Purchase Enquiry: {enquiry.Id}"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Purchase Enquiry deleted successfully." });
        }
    }
}
