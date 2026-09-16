using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CompaniesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Companies
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
        {
            var companies = await _context.Companies.ToListAsync();
            return Ok(companies);
        }

        // GET: api/Companies/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Company>> GetCompany(string id)
        {
            var company = await _context.Companies.FindAsync(id);

            if (company == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' not found." });
            }

            return Ok(company);
        }

        // POST: api/Companies
        [HttpPost]
        public async Task<ActionResult<Company>> CreateCompany([FromBody] Company company)
        {
            if (company == null || string.IsNullOrWhiteSpace(company.Name))
            {
                return BadRequest(new { message = "Company name is required." });
            }

            if (string.IsNullOrWhiteSpace(company.Id))
            {
                var slugName = System.Text.RegularExpressions.Regex.Replace(company.Name.ToLower().Trim(), @"[^a-z0-9]+", "-").Trim('-');
                var slugCountry = System.Text.RegularExpressions.Regex.Replace((company.Country ?? "").ToLower().Trim(), @"[^a-z0-9]+", "-").Trim('-');
                var baseId = string.IsNullOrWhiteSpace(slugCountry) ? slugName : $"{slugName}-{slugCountry}";
                company.Id = string.IsNullOrWhiteSpace(baseId) ? $"company-{DateTime.UtcNow.Ticks}" : baseId;
            }

            var existing = await _context.Companies.AnyAsync(c => c.Id == company.Id);
            if (existing)
            {
                company.Id = $"{company.Id}-{Guid.NewGuid().ToString("N").Substring(0, 6)}";
            }

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, company);
        }

        // PUT: api/Companies/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(string id, [FromBody] Company updated)
        {
            if (updated == null)
            {
                return BadRequest(new { message = "Invalid company payload." });
            }

            var existing = await _context.Companies.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' not found." });
            }

            existing.Name = updated.Name;
            if (!string.IsNullOrWhiteSpace(updated.Country)) existing.Country = updated.Country;
            if (!string.IsNullOrWhiteSpace(updated.CountryCode)) existing.CountryCode = updated.CountryCode;
            if (!string.IsNullOrWhiteSpace(updated.Currency)) existing.Currency = updated.Currency;
            if (!string.IsNullOrWhiteSpace(updated.CurrencyCode)) existing.CurrencyCode = updated.CurrencyCode;
            if (!string.IsNullOrWhiteSpace(updated.CurrencySymbol)) existing.CurrencySymbol = updated.CurrencySymbol;
            if (updated.CurrencyDecimals > 0) existing.CurrencyDecimals = updated.CurrencyDecimals;
            if (updated.DefaultVatRate >= 0) existing.DefaultVatRate = updated.DefaultVatRate;
            if (updated.TaxNumber != null) existing.TaxNumber = updated.TaxNumber;
            if (updated.CrNumber != null) existing.CrNumber = updated.CrNumber;
            if (updated.Branch != null) existing.Branch = updated.Branch;
            if (updated.Address != null) existing.Address = updated.Address;
            if (updated.ContactNo != null) existing.ContactNo = updated.ContactNo;
            if (updated.Email != null) existing.Email = updated.Email;
            if (updated.Website != null) existing.Website = updated.Website;
            if (updated.LogoUrl != null) existing.LogoUrl = updated.LogoUrl;
            if (updated.Profit != 0) existing.Profit = updated.Profit;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // POST: api/Companies/5/logo
        [HttpPost("{id}/logo")]
        public async Task<IActionResult> UploadLogo(string id, [FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id || c.Id.ToLower() == id.ToLower());
            if (company == null)
            {
                company = new Company
                {
                    Id = id,
                    Name = id == "ggms-oman" ? "GGMS Global IT Solutions SPC" : id,
                    Country = "Oman",
                    Currency = "OMR",
                    TaxNumber = "OM11023891",
                    CrNumber = "CR-1049281",
                    Branch = "Muscat Main HQ"
                };
                _context.Companies.Add(company);
                await _context.SaveChangesAsync();
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            try
            {
                var uploadsFolder = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "uploads", "logos");
                if (!System.IO.Directory.Exists(uploadsFolder))
                {
                    System.IO.Directory.CreateDirectory(uploadsFolder);
                }

                var extension = System.IO.Path.GetExtension(file.FileName);
                var fileName = $"{company.Id}_{DateTime.UtcNow.Ticks}{extension}";
                var filePath = System.IO.Path.Combine(uploadsFolder, fileName);

                using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                company.LogoUrl = $"/uploads/logos/{fileName}";
                await _context.SaveChangesAsync();

                return Ok(new { logoUrl = company.LogoUrl, message = "Logo uploaded successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to save logo file.", details = ex.Message });
            }
        }

        // DELETE: api/Companies/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(string id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
            {
                return NotFound(new { message = $"Company with ID '{id}' not found." });
            }

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Company '{company.Name}' deleted successfully." });
        }

        // POST: api/Companies/onboard
        [HttpPost("onboard")]
        public async Task<IActionResult> OnboardCompany([FromBody] CompanyOnboardingDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Company name is required." });
            }

            var slugName = System.Text.RegularExpressions.Regex.Replace(dto.Name.ToLower().Trim(), @"[^a-z0-9]+", "-").Trim('-');
            var slugCountry = System.Text.RegularExpressions.Regex.Replace((dto.Country ?? "").ToLower().Trim(), @"[^a-z0-9]+", "-").Trim('-');
            var companyId = string.IsNullOrWhiteSpace(slugCountry) ? slugName : $"{slugName}-{slugCountry}";

            var existingCompany = await _context.Companies.FindAsync(companyId);
            if (existingCompany != null)
            {
                companyId = $"{companyId}-{Guid.NewGuid().ToString("N").Substring(0, 6)}";
            }

            var newCompany = new Company
            {
                Id = companyId,
                Name = dto.Name,
                Country = dto.Country,
                CountryCode = dto.CountryCode,
                Currency = dto.Currency,
                CurrencyCode = dto.CurrencyCode,
                CurrencySymbol = dto.CurrencySymbol,
                CurrencyDecimals = dto.CurrencyDecimals,
                DefaultVatRate = dto.DefaultVatRate,
                TaxNumber = dto.TaxNumber
            };

            _context.Companies.Add(newCompany);

            // Create initial Admin User if email provided
            if (!string.IsNullOrWhiteSpace(dto.AdminEmail))
            {
                var adminUser = new User
                {
                    CompanyId = companyId,
                    AllowedCompanyIds = companyId,
                    Email = dto.AdminEmail.Trim().ToLower(),
                    PasswordHash = string.IsNullOrWhiteSpace(dto.AdminPassword) ? "hashed_default_password" : dto.AdminPassword,
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(adminUser);
            }

            // Seed Default UOMs for this new Company
            _context.Uoms.AddRange(
                new Uom { CompanyId = companyId, Name = "Pcs", Description = "Pieces" },
                new Uom { CompanyId = companyId, Name = "Hours", Description = "Service Hours" },
                new Uom { CompanyId = companyId, Name = "Box", Description = "Standard Box" }
            );

            // Seed Default Product Groups
            _context.ProductGroups.AddRange(
                new ProductGroup { CompanyId = companyId, Name = "General Hardware", VatPercentage = dto.DefaultVatRate },
                new ProductGroup { CompanyId = companyId, Name = "IT Services", VatPercentage = dto.DefaultVatRate }
            );

            await _context.SaveChangesAsync();

            return Ok(new { 
                company = newCompany,
                message = $"Company '{newCompany.Name}' onboarded successfully with ID '{newCompany.Id}'."
            });
        }
    }

    public class CompanyOnboardingDto
    {
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = "Oman";
        public string CountryCode { get; set; } = "OM";
        public string Currency { get; set; } = "OMR";
        public string CurrencyCode { get; set; } = "OMR";
        public string CurrencySymbol { get; set; } = "OMR";
        public int CurrencyDecimals { get; set; } = 3;
        public decimal DefaultVatRate { get; set; } = 5.0m;
        public string TaxNumber { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
    }
}
