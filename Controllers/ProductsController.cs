using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string companyId = "ggms-oman",
            [FromQuery] bool paginate = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string search = "")
        {
            try
            {
                var allList = await _context.ProductItems
                    .Where(p => string.IsNullOrWhiteSpace(companyId) || companyId == "all" || p.CompanyId == companyId)
                    .ToListAsync();

                // Reverse so newest inserted products appear FIRST (at position 1 / top)
                allList.Reverse();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLower();
                    allList = allList.Where(p => (p.Name != null && p.Name.ToLower().Contains(lowerSearch)) ||
                                                 (p.Category != null && p.Category.ToLower().Contains(lowerSearch)) ||
                                                 (p.Barcode != null && p.Barcode.ToLower().Contains(lowerSearch)) ||
                                                 (p.Id != null && p.Id.ToLower().Contains(lowerSearch))).ToList();
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

                    // Compute KPI values
                    var totalStockValue = allList.Sum(p => p.Stock * p.BuyPrice);
                    var totalCount = allList.Count;
                    var lowStockCount = allList.Count(p => p.Stock > 0 && p.Stock <= p.MinStock);
                    var nonProductCount = allList.Count(p => p.Type != "Product");

                    return Ok(new
                    {
                        items,
                        totalItems,
                        page,
                        pageSize,
                        totalPages,
                        totalStockValue,
                        totalCount,
                        lowStockCount,
                        nonProductCount
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

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] ProductItem product)
        {
            try
            {
                if (product == null)
                {
                    return BadRequest(new { message = "Invalid product data provided." });
                }

                if (string.IsNullOrWhiteSpace(product.Name))
                {
                    return BadRequest(new { message = "Product Name is required." });
                }

                if (product.BuyPrice >= product.SellPrice)
                {
                    return BadRequest(new { message = "Cost price must be less than sales price." });
                }

                // Sanitize fields
                product.Name = product.Name.Trim();
                product.Type = string.IsNullOrWhiteSpace(product.Type) ? "Product" : product.Type.Trim();
                product.Category = string.IsNullOrWhiteSpace(product.Category) ? "General" : product.Category.Trim();
                product.Barcode = product.Barcode?.Trim() ?? string.Empty;
                product.Uom = string.IsNullOrWhiteSpace(product.Uom) ? "pcs" : product.Uom.Trim();
                product.CompanyId = string.IsNullOrWhiteSpace(product.CompanyId) ? "ggms-oman" : product.CompanyId.Trim();

                // Check barcode uniqueness if provided
                if (!string.IsNullOrWhiteSpace(product.Barcode))
                {
                    var targetBarcode = product.Barcode.ToLower();
                    var existingBarcode = await _context.ProductItems
                        .FirstOrDefaultAsync(p => p.Barcode != null && p.Barcode.ToLower() == targetBarcode);
                    if (existingBarcode != null)
                    {
                        return BadRequest(new { message = $"Barcode / Product Code '{product.Barcode}' is already assigned to item '{existingBarcode.Name}'." });
                    }
                }

                if (string.IsNullOrEmpty(product.Id))
                {
                    product.Id = $"ITM-{System.Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
                }

                _context.ProductItems.Add(product);
                await _context.SaveChangesAsync();

                return Ok(product);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.InnerException != null ? ex.InnerException.Message : ex.Message });
            }
        }

        [HttpPost("{id}/issue")]
        public async Task<IActionResult> IssueToProject(string id)
        {
            var product = await _context.ProductItems.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = $"Inventory item {id} not found" });
            }

            if (product.Stock <= 0)
            {
                return BadRequest(new { message = $"Item {product.Name} is out of stock" });
            }

            product.Stock -= 1;
            
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Issued 1 unit of {product.Name} to project. Remaining stock: {product.Stock}"
            });

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductItem productDto)
        {
            try
            {
                var product = await _context.ProductItems.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = $"Product {id} not found" });
                }

                if (productDto.BuyPrice >= productDto.SellPrice)
                {
                    return BadRequest(new { message = "Cost price must be less than sales price." });
                }

                // Check barcode uniqueness if changed
                if (!string.IsNullOrWhiteSpace(productDto.Barcode))
                {
                    var targetBarcode = productDto.Barcode.Trim().ToLower();
                    var existingBarcode = await _context.ProductItems
                        .FirstOrDefaultAsync(p => p.Id != id && p.Barcode != null && p.Barcode.ToLower() == targetBarcode);
                    if (existingBarcode != null)
                    {
                        return BadRequest(new { message = $"Barcode / Product Code '{productDto.Barcode}' is already assigned to item '{existingBarcode.Name}'." });
                    }
                }

                product.Name = string.IsNullOrWhiteSpace(productDto.Name) ? product.Name : productDto.Name.Trim();
                product.Type = string.IsNullOrWhiteSpace(productDto.Type) ? "Product" : productDto.Type.Trim();
                product.Category = string.IsNullOrWhiteSpace(productDto.Category) ? "General" : productDto.Category.Trim();
                product.Barcode = productDto.Barcode?.Trim() ?? string.Empty;
                product.Uom = string.IsNullOrWhiteSpace(productDto.Uom) ? "pcs" : productDto.Uom.Trim();
                product.ProductGroupId = productDto.ProductGroupId;
                product.BuyPrice = productDto.BuyPrice;
                product.SellPrice = productDto.SellPrice;
                product.Stock = productDto.Stock;
                product.MinStock = productDto.MinStock;
                product.VatRate = productDto.VatRate;

                await _context.SaveChangesAsync();

                // Log event
                _context.TimelineEvents.Add(new TimelineEvent
                {
                    Timestamp = System.DateTime.Now,
                    Message = $"Updated product Profile: {product.Name}"
                });
                await _context.SaveChangesAsync();

                return Ok(product);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.InnerException != null ? ex.InnerException.Message : ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(string id)
        {
            var product = await _context.ProductItems.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = $"Product {id} not found." });
            }

            _context.ProductItems.Remove(product);

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Deleted product Profile: {product.Name}"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Product deleted successfully." });
        }
    }
}
