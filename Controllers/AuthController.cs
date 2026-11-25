using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GGMSNEWPROJECT.Models;
using System.Threading.Tasks;
using BC = BCrypt.Net.BCrypt;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { message = "Email and password are required" });
                }

                // Find user by email
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify password using the stored hash from the database
                var passwordValid = !string.IsNullOrWhiteSpace(user.PasswordHash)
                    && BC.Verify(request.Password, user.PasswordHash);

                if (!passwordValid)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Update last login time
                user.LastLoginAt = DateTime.Now;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                // Return success response with user info
                var response = new LoginResponse
                {
                    Id = user.Id,
                    Name = string.IsNullOrWhiteSpace(user.Name) ? user.Email : user.Name,
                    Email = user.Email,
                    Role = user.Role,
                    CompanyId = user.CompanyId,
                    AllowedCompanyIds = user.AllowedCompanyIds,
                    Message = "Login successful"
                };

                return Ok(response);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Login Error] Exception: {ex}");
                return StatusCode(500, new { message = ex.Message, details = ex.ToString() });
            }
        }

        // GET: api/auth/tenant-branding
        [HttpGet("tenant-branding")]
        public async Task<IActionResult> GetTenantBranding([FromQuery] string? hostname, [FromQuery] string? companyId, [FromQuery] string? email)
        {
            Company? company = null;

            if (!string.IsNullOrWhiteSpace(email))
            {
                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
                if (user != null && !string.IsNullOrWhiteSpace(user.CompanyId))
                {
                    company = await _context.Companies.AsNoTracking().FirstOrDefaultAsync(c => c.Id == user.CompanyId);
                }
            }

            if (company == null && !string.IsNullOrWhiteSpace(companyId))
            {
                company = await _context.Companies.AsNoTracking().FirstOrDefaultAsync(c => c.Id == companyId);
            }

            if (company == null && !string.IsNullOrWhiteSpace(hostname))
            {
                var slug = hostname.Split('.').FirstOrDefault() ?? "";
                company = await _context.Companies.AsNoTracking().FirstOrDefaultAsync(c => c.Id.Contains(slug, System.StringComparison.OrdinalIgnoreCase));
            }

            if (company == null)
            {
                return Ok(new {
                    name = "GGMS Business Control AI",
                    logoUrl = "",
                    welcomeMessage = "Multi-company operating system",
                    country = "Oman",
                    currency = "OMR"
                });
            }

            return Ok(new {
                name = company.Name,
                logoUrl = company.LogoUrl ?? "",
                welcomeMessage = $"Welcome to {company.Name} Portal",
                country = company.Country,
                currency = company.Currency
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            // Check if user already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Hash password
            var passwordHash = BC.HashPassword(request.Password);

            // Create new user
            var newUser = new User
            {
                Name = string.IsNullOrWhiteSpace(request.Name) ? request.Email : request.Name.Trim(),
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = "User",
                CompanyId = "ggms-oman",
                AllowedCompanyIds = "ggms-oman,ggms-uae",
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully", userId = newUser.Id });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string AllowedCompanyIds { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
