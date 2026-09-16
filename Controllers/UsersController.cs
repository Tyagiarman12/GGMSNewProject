using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using BC = BCrypt.Net.BCrypt;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new {
                    u.Id,
                    u.Email,
                    u.Role,
                    u.CompanyId,
                    u.AllowedCompanyIds,
                    u.IsActive,
                    u.CreatedAt,
                    u.LastLoginAt
                })
                .ToListAsync();

            return Ok(users);
        }

        public class CreateUserDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "User";
            public string CompanyId { get; set; } = "ggms-oman";
            public string AllowedCompanyIds { get; set; } = "ggms-oman,ggms-uae";
            public bool IsActive { get; set; } = true;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            var existing = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (existing)
            {
                return BadRequest(new { message = "Email already in use" });
            }

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = BC.HashPassword(dto.Password),
                Role = dto.Role,
                CompanyId = string.IsNullOrWhiteSpace(dto.CompanyId) ? "ggms-oman" : dto.CompanyId,
                AllowedCompanyIds = string.IsNullOrWhiteSpace(dto.AllowedCompanyIds) ? dto.CompanyId : dto.AllowedCompanyIds,
                IsActive = dto.IsActive,
                CreatedAt = System.DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new {
                user.Id,
                user.Email,
                user.Role,
                user.CompanyId,
                user.AllowedCompanyIds,
                user.IsActive,
                user.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] CreateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            user.Email = dto.Email;
            user.Role = dto.Role;
            if (!string.IsNullOrWhiteSpace(dto.CompanyId)) user.CompanyId = dto.CompanyId;
            if (!string.IsNullOrWhiteSpace(dto.AllowedCompanyIds)) user.AllowedCompanyIds = dto.AllowedCompanyIds;
            user.IsActive = dto.IsActive;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = BC.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();

            return Ok(new {
                user.Id,
                user.Email,
                user.Role,
                user.IsActive,
                user.CreatedAt
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
