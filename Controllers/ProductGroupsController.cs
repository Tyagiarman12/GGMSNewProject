using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductGroupsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductGroupsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProductGroups([FromQuery] string companyId = "ggms-oman")
        {
            var groups = await _context.ProductGroups
                .Where(g => string.IsNullOrWhiteSpace(companyId) || companyId == "all" || g.CompanyId == companyId)
                .ToListAsync();
            groups.Reverse();
            return Ok(groups);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductGroup(int id)
        {
            var group = await _context.ProductGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = $"Product Group {id} not found." });
            }
            return Ok(group);
        }

        public class CreateProductGroupDto
        {
            public string Name { get; set; } = string.Empty;
            public decimal VatPercentage { get; set; } = 5.0m; // 5.0 or 0.0
            public string CompanyId { get; set; } = "ggms-oman";
        }

        [HttpPost]
        public async Task<IActionResult> CreateProductGroup([FromBody] CreateProductGroupDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Product Group Name is required." });
            }

            var existing = await _context.ProductGroups.FirstOrDefaultAsync(g => g.Name.ToLower() == dto.Name.Trim().ToLower());
            if (existing != null)
            {
                return BadRequest(new { message = $"Product Group '{dto.Name}' already exists." });
            }

            var group = new ProductGroup
            {
                Name = dto.Name.Trim(),
                VatPercentage = dto.VatPercentage,
                CompanyId = string.IsNullOrEmpty(dto.CompanyId) ? "ggms-oman" : dto.CompanyId
            };

            _context.ProductGroups.Add(group);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProductGroup), new { id = group.Id }, group);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProductGroup(int id, [FromBody] CreateProductGroupDto dto)
        {
            var group = await _context.ProductGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = $"Product Group {id} not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Product Group Name is required." });
            }

            var oldName = group.Name;
            group.Name = dto.Name.Trim();
            group.VatPercentage = dto.VatPercentage;
            if (!string.IsNullOrEmpty(dto.CompanyId))
            {
                group.CompanyId = dto.CompanyId;
            }

            // Sync vatRate for all products associated with this group if group name or VAT % changed
            var productsToUpdate = await _context.ProductItems
                .Where(p => p.Category == oldName || p.ProductGroupId == id)
                .ToListAsync();

            decimal vatRateDecimal = dto.VatPercentage / 100m;
            foreach (var p in productsToUpdate)
            {
                p.Category = group.Name;
                p.ProductGroupId = group.Id;
                p.VatRate = vatRateDecimal;
            }

            await _context.SaveChangesAsync();
            return Ok(group);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductGroup(int id)
        {
            var group = await _context.ProductGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = $"Product Group {id} not found." });
            }

            _context.ProductGroups.Remove(group);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product Group deleted successfully." });
        }
    }
}
