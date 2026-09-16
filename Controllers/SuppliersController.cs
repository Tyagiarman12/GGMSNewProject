using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SuppliersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSuppliers(
            [FromQuery] string companyId = "ggms-oman",
            [FromQuery] bool paginate = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string search = "")
        {
            try
            {
                var allList = await _context.Suppliers
                    .Where(s => string.IsNullOrWhiteSpace(companyId) || companyId == "all" || s.CompanyId == companyId)
                    .ToListAsync();

                allList.Reverse();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLower();
                    allList = allList.Where(s => (s.Name != null && s.Name.ToLower().Contains(lowerSearch)) || 
                                                 (s.Category != null && s.Category.ToLower().Contains(lowerSearch))).ToList();
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

                    var totalActiveOrders = allList.Sum(s => s.ActiveOrders);
                    var totalDueBills = allList.Sum(s => s.BillsDue);

                    return Ok(new
                    {
                        items,
                        totalItems,
                        page,
                        pageSize,
                        totalPages,
                        totalActiveOrders,
                        totalDueBills
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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupplier(string id)
        {
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier {id} not found" });
            }

            return Ok(supplier);
        }

        public class CreateSupplierDto
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string CompanyId { get; set; } = "ggms-oman";
            public string Category { get; set; } = string.Empty;
            public string Notes { get; set; } = string.Empty;
            public string VatNumber { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string ContactPersonName { get; set; } = string.Empty;
            public string ContactPersonNumber { get; set; } = string.Empty;
            public int ActiveOrders { get; set; } = 0;
            public int BillsDue { get; set; } = 0;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            var supplier = new Supplier
            {
                Id = dto.Id.ToLower(),
                Name = dto.Name,
                CompanyId = dto.CompanyId,
                Category = dto.Category,
                Notes = dto.Notes,
                VatNumber = dto.VatNumber,
                Email = dto.Email,
                ContactPersonName = dto.ContactPersonName,
                ContactPersonNumber = dto.ContactPersonNumber,
                ActiveOrders = dto.ActiveOrders,
                BillsDue = dto.BillsDue
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Created new supplier Profile: {supplier.Name}"
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(string id, [FromBody] CreateSupplierDto dto)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound(new { message = $"Supplier {id} not found" });
            }

            supplier.Name = dto.Name;
            supplier.Category = dto.Category;
            supplier.Notes = dto.Notes;
            supplier.VatNumber = dto.VatNumber;
            supplier.Email = dto.Email;
            supplier.ContactPersonName = dto.ContactPersonName;
            supplier.ContactPersonNumber = dto.ContactPersonNumber;
            supplier.ActiveOrders = dto.ActiveOrders;
            supplier.BillsDue = dto.BillsDue;

            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Updated supplier Profile: {supplier.Name}"
            });
            await _context.SaveChangesAsync();

            return Ok(supplier);
        }
    }
}
