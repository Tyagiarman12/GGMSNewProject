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
    public class LeadsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeadsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLeads(
            [FromQuery] string companyId = "ggms-oman",
            [FromQuery] bool paginate = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string search = "")
        {
            try
            {
                var allList = await _context.Leads
                    .Where(l => l.CompanyId == companyId)
                    .ToListAsync();

                allList.Reverse();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLower();
                    allList = allList.Where(l => (l.ClientName != null && l.ClientName.ToLower().Contains(lowerSearch)) || 
                                                 (l.Requirement != null && l.Requirement.ToLower().Contains(lowerSearch)) || 
                                                 (l.Status != null && l.Status.ToLower().Contains(lowerSearch)) || 
                                                 (l.Owner != null && l.Owner.ToLower().Contains(lowerSearch))).ToList();
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

                    var hotLeads = allList.Count(l => l.Status == "Hot");
                    var pipelineValue = allList.Sum(l => l.Value);
                    var overdueFollowUps = allList.Count(l => l.NextFollowUp == "Overdue");

                    return Ok(new
                    {
                        items,
                        totalItems,
                        page,
                        pageSize,
                        totalPages,
                        hotLeads,
                        pipelineValue,
                        overdueFollowUps
                    });
                }
                else
                {
                    return Ok(allList);
                }
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class CreateLeadDto
        {
            public string ClientName { get; set; } = string.Empty;
            public string Contact { get; set; } = string.Empty;
            public string Requirement { get; set; } = string.Empty;
            public decimal Value { get; set; }
            public string Status { get; set; } = "New";
            public string Owner { get; set; } = "Sales";
            public string NextFollowUp { get; set; } = "Today";
        }

        [HttpPost]
        public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto dto)
        {
            var lead = new Lead
            {
                Id = $"LEAD-OM-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                CompanyId = "ggms-oman",
                ClientName = dto.ClientName,
                Contact = dto.Contact,
                Requirement = dto.Requirement,
                Value = dto.Value,
                Status = dto.Status,
                Owner = dto.Owner,
                NextFollowUp = dto.NextFollowUp
            };

            _context.Leads.Add(lead);
            
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Sales registered new Lead: {lead.ClientName} ({lead.Value} OMR)"
            });

            await _context.SaveChangesAsync();
            return Ok(lead);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLead(string id, [FromBody] CreateLeadDto dto)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(new { message = $"Lead {id} not found" });
            }

            lead.ClientName = dto.ClientName;
            lead.Contact = dto.Contact;
            lead.Requirement = dto.Requirement;
            lead.Value = dto.Value;
            lead.Status = dto.Status;
            lead.Owner = dto.Owner;
            lead.NextFollowUp = dto.NextFollowUp;

            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Updated lead profile: {lead.ClientName} ({lead.Value} OMR)"
            });
            await _context.SaveChangesAsync();

            return Ok(lead);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(new { message = $"Lead {id} not found" });
            }

            lead.Status = status;
            await _context.SaveChangesAsync();

            return Ok(lead);
        }
    }
}
