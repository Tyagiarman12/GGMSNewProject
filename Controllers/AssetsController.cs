using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();
            return Ok(assets);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsset([FromBody] Asset asset)
        {
            if (string.IsNullOrEmpty(asset.Code))
            {
                asset.Code = $"AST-OM-{System.Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
            }

            _context.Assets.Add(asset);
            
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Registered new asset: {asset.Category} - {asset.Brand} for client {asset.Client}"
            });

            await _context.SaveChangesAsync();
            return Ok(asset);
        }
    }
}
