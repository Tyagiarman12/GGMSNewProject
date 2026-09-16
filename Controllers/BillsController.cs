using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    }
}
