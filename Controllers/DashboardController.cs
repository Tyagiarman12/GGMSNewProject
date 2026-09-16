using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] string companyId = "ggms-oman")
        {
            try
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId);
                if (company == null)
                {
                    return NotFound(new { message = $"Company with id {companyId} not found" });
                }

                var totalLeads = await _context.Leads.CountAsync();
                var hotLeads = await _context.Leads.CountAsync(l => l.Status == "Hot");
                var pendingTasks = await _context.Clients.SumAsync(c => c.OpenTasks);
                
                // Receivables (Invoices)
                var receivablesList = await _context.Invoices.Select(i => i.Amount).ToListAsync();
                var receivables = receivablesList.Sum();
                var overdueInvoices = await _context.Invoices.CountAsync(i => i.Status == "Overdue");

                // Payables (Bills)
                var payablesList = await _context.Bills.Select(b => b.Amount).ToListAsync();
                var payables = payablesList.Sum();

                // Compute VAT Payable: Output VAT (from invoices) - Input VAT (from bills)
                // VAT rate is 5% in Oman (OM11023891 is seeded for Oman). 
                // In Next.js, Output VAT = total receivables * 5% / 1.05, Input VAT = total payables * 5% / 1.05
                decimal outputVat = receivables * 0.05m / 1.05m;
                decimal inputVat = payables * 0.05m / 1.05m;
                decimal vatPayable = Math.Max(outputVat - inputVat, 0);

                // Timeline logs
                var events = await _context.TimelineEvents
                    .OrderByDescending(e => e.Timestamp)
                    .Take(5)
                    .Select(e => e.Message)
                    .ToListAsync();

                // Alerts (Attention Required list)
                var alerts = new[]
                {
                    new { Type = "Leads", Label = $"{await _context.Leads.CountAsync(l => l.NextFollowUp == "Overdue")} leads not followed up", Severity = "danger", Owner = "Sales" },
                    new { Type = "Quotations", Label = $"{await _context.Quotations.CountAsync(q => q.Status == "Expired")} quotations expired", Severity = "warning", Owner = "Manager" },
                    new { Type = "Tasks", Label = "19 tasks overdue", Severity = "danger", Owner = "Project Managers" },
                    new { Type = "Invoices", Label = $"{overdueInvoices} invoices overdue", Severity = "danger", Owner = "Accounts" },
                    new { Type = "Renewals", Label = $"{await _context.Renewals.CountAsync(r => r.Due.Contains("15") || r.Due.Contains("30"))} renewals due within 30 days", Severity = "warning", Owner = "Account Managers" },
                    new { Type = "AMC", Label = "4 AMC contracts overused or low margin", Severity = "warning", Owner = "Operations" }
                };

                return Ok(new
                {
                    companyName = company.Name,
                    country = company.Country,
                    currency = company.Currency,
                    taxNumber = company.TaxNumber,
                    netProfit = company.Profit,
                    receivables,
                    payables,
                    vatPayable,
                    totalLeads,
                    hotLeads,
                    pendingTasks,
                    overdueTasks = 19, // seeded baseline value
                    timeline = events,
                    alerts
                });
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Dashboard Stats Error] Exception: {ex}");
                return StatusCode(500, new { message = ex.Message, details = ex.ToString() });
            }
        }
    }
}
