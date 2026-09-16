using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetClients(
            [FromQuery] string companyId = "ggms-oman",
            [FromQuery] bool paginate = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string search = "")
        {
            try
            {
                var targetCompany = (string.IsNullOrWhiteSpace(companyId) || companyId == "undefined") ? "ggms-oman" : companyId;
                var allList = await _context.Clients
                    .Include(c => c.Contacts)
                    .Include(c => c.Locations)
                    .Include(c => c.Projects)
                    .Where(c => targetCompany == "all" || string.IsNullOrWhiteSpace(targetCompany) || c.CompanyId == targetCompany || string.IsNullOrEmpty(c.CompanyId))
                    .ToListAsync();

                allList.Reverse();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lowerSearch = search.ToLower();
                    allList = allList.Where(c => (c.Name != null && c.Name.ToLower().Contains(lowerSearch)) || 
                                                 (c.Industry != null && c.Industry.ToLower().Contains(lowerSearch))).ToList();
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

                    var totalOpenTasks = allList.Sum(c => c.OpenTasks);
                    var totalDueInvoices = allList.Sum(c => c.InvoicesDue);
                    var avgProfitability = allList.Any() ? allList.Average(c => c.Profitability) : 0;

                    return Ok(new
                    {
                        items,
                        totalItems,
                        page,
                        pageSize,
                        totalPages,
                        totalOpenTasks,
                        totalDueInvoices,
                        avgProfitability = (int)avgProfitability
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
        public async Task<IActionResult> GetClient(string id)
        {
            var client = await _context.Clients
                .Include(c => c.Contacts)
                .Include(c => c.Locations)
                .Include(c => c.Projects)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { message = $"Client {id} not found" });
            }

            return Ok(client);
        }

        public class CreateClientDto
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string CompanyId { get; set; } = "ggms-oman";
            public string Industry { get; set; } = string.Empty;
            public string Notes { get; set; } = string.Empty;
            public int Profitability { get; set; } = 30;
            public string VatNumber { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string ContactPersonName { get; set; } = string.Empty;
            public string ContactPersonNumber { get; set; } = string.Empty;
            public string[] Contacts { get; set; } = System.Array.Empty<string>();
            public string[] Locations { get; set; } = System.Array.Empty<string>();
            public string[] Projects { get; set; } = System.Array.Empty<string>();
        }

        [HttpPost]
        public async Task<IActionResult> CreateClient([FromBody] CreateClientDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name))
            {
                return BadRequest(new { message = "Client Name is required." });
            }

            // Generate sequential client ID like: CL-OM-1001
            var maxIdNum = 1000;
            var clients = await _context.Clients.ToListAsync();
            foreach (var c in clients)
            {
                var upperId = c.Id.ToUpper();
                if (upperId.StartsWith("CL-OM-") && int.TryParse(upperId.Substring(6), out int num))
                {
                    if (num > maxIdNum)
                    {
                        maxIdNum = num;
                    }
                }
            }
            var clientId = $"CL-OM-{maxIdNum + 1}";

            var client = new Client
            {
                Id = clientId,
                Name = dto.Name,
                CompanyId = dto.CompanyId,
                Industry = dto.Industry,
                Notes = dto.Notes,
                Profitability = dto.Profitability,
                OpenTasks = 0,
                InvoicesDue = 0,
                VatNumber = dto.VatNumber,
                Email = dto.Email,
                ContactPersonName = dto.ContactPersonName,
                ContactPersonNumber = dto.ContactPersonNumber
            };

            foreach (var contact in dto.Contacts)
            {
                client.Contacts.Add(new ClientContact { ContactName = contact });
            }

            foreach (var loc in dto.Locations)
            {
                client.Locations.Add(new ClientLocation { LocationName = loc });
            }

            foreach (var proj in dto.Projects)
            {
                client.Projects.Add(new ClientProject { ProjectName = proj });
            }

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Created new client Profile: {client.Name}"
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(string id, [FromBody] CreateClientDto dto)
        {
            var client = await _context.Clients
                .Include(c => c.Contacts)
                .Include(c => c.Locations)
                .Include(c => c.Projects)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                return NotFound(new { message = $"Client {id} not found" });
            }

            client.Name = dto.Name;
            client.Industry = dto.Industry;
            client.Notes = dto.Notes;
            client.Profitability = dto.Profitability;
            client.VatNumber = dto.VatNumber;
            client.Email = dto.Email;
            client.ContactPersonName = dto.ContactPersonName;
            client.ContactPersonNumber = dto.ContactPersonNumber;

            // Remove existing relationships
            _context.ClientContacts.RemoveRange(client.Contacts);
            _context.ClientLocations.RemoveRange(client.Locations);
            _context.ClientProjects.RemoveRange(client.Projects);

            // Add updated relationships
            foreach (var contact in dto.Contacts)
            {
                client.Contacts.Add(new ClientContact { ClientId = id, ContactName = contact });
            }

            foreach (var loc in dto.Locations)
            {
                client.Locations.Add(new ClientLocation { ClientId = id, LocationName = loc });
            }

            foreach (var proj in dto.Projects)
            {
                client.Projects.Add(new ClientProject { ClientId = id, ProjectName = proj });
            }

            await _context.SaveChangesAsync();

            // Log event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Updated client profile: {client.Name}"
            });
            await _context.SaveChangesAsync();

            return Ok(client);
        }

        [HttpPost("{clientId}/projects")]
        public async Task<IActionResult> AddProject(string clientId, [FromBody] string projectName)
        {
            var client = await _context.Clients.FindAsync(clientId);
            if (client == null)
            {
                return NotFound(new { message = $"Client {clientId} not found" });
            }

            var project = new ClientProject
            {
                ClientId = clientId,
                ProjectName = projectName
            };

            _context.ClientProjects.Add(project);

            // Log timeline event
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"Project created for client {client.Name}: {projectName}"
            });

            await _context.SaveChangesAsync();
            return Ok(project);
        }
    }
}
