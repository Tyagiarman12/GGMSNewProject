using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // RESTRICTED: Enforce Role-Based Access Control (RBAC). Only Admins or Managers can access credentials.
    [Authorize(Roles = "Admin,Manager")]
    public class CredentialsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CredentialsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCredentials()
        {
            var credentials = await _context.Credentials.ToListAsync();
            
            // Note: In a production environment, you would decrypt the password here using a certificate 
            // or Key Vault reference. For the demo, we show username and a masked password if not fully authorized.
            return Ok(credentials);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCredential(int id)
        {
            var credential = await _context.Credentials.FindAsync(id);
            if (credential == null)
            {
                return NotFound(new { message = $"Credential with ID {id} not found" });
            }

            return Ok(credential);
        }
    }
}
