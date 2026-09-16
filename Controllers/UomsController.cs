using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UomsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UomsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUoms([FromQuery] string companyId = "ggms-oman")
        {
            var uoms = await _context.Uoms
                .Where(u => string.IsNullOrWhiteSpace(companyId) || companyId == "all" || u.CompanyId == companyId)
                .ToListAsync();
            uoms.Reverse();
            return Ok(uoms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUom(int id)
        {
            var uom = await _context.Uoms.FindAsync(id);
            if (uom == null)
            {
                return NotFound(new { message = $"UOM record {id} not found." });
            }
            return Ok(uom);
        }

        public class CreateUomDto
        {
            public string Name { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string CompanyId { get; set; } = "ggms-oman";
        }

        [HttpPost]
        public async Task<IActionResult> CreateUom([FromBody] CreateUomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "UOM Name is required." });
            }

            var existing = await _context.Uoms.FirstOrDefaultAsync(u => u.Name.ToLower() == dto.Name.Trim().ToLower());
            if (existing != null)
            {
                return BadRequest(new { message = $"UOM '{dto.Name}' already exists." });
            }

            var uom = new Uom
            {
                Name = dto.Name.Trim(),
                Description = dto.Description.Trim(),
                CompanyId = string.IsNullOrEmpty(dto.CompanyId) ? "ggms-oman" : dto.CompanyId
            };

            _context.Uoms.Add(uom);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUom), new { id = uom.Id }, uom);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUom(int id, [FromBody] CreateUomDto dto)
        {
            var uom = await _context.Uoms.FindAsync(id);
            if (uom == null)
            {
                return NotFound(new { message = $"UOM record {id} not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "UOM Name is required." });
            }

            uom.Name = dto.Name.Trim();
            uom.Description = dto.Description.Trim();
            if (!string.IsNullOrEmpty(dto.CompanyId))
            {
                uom.CompanyId = dto.CompanyId;
            }

            await _context.SaveChangesAsync();
            return Ok(uom);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUom(int id)
        {
            var uom = await _context.Uoms.FindAsync(id);
            if (uom == null)
            {
                return NotFound(new { message = $"UOM record {id} not found." });
            }

            _context.Uoms.Remove(uom);
            await _context.SaveChangesAsync();
            return Ok(new { message = "UOM record deleted successfully." });
        }
    }
}
