using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FinanceEntitiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FinanceEntitiesController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. LEDGERS (CHART OF ACCOUNTS)
        // ==========================================
        [HttpGet("ledgers")]
        public async Task<IActionResult> GetLedgers([FromQuery] string? companyId)
        {
            var targetCompanyId = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var ledgers = await _context.Ledgers
                .Where(l => l.CompanyId == targetCompanyId || l.CompanyId == "ggms-oman")
                .OrderBy(l => l.Code)
                .ToListAsync();

            if (!ledgers.Any())
            {
                var defaultLedgers = new List<Ledger>
                {
                    new Ledger { Code = "1002", Name = "Fixed Assets", Class = "Asset", ParentCode = "No Parent", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Fixed Assets Group" },
                    new Ledger { Code = "100201", Name = "Machinery & Equipment", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Machinery & Equipment" },
                    new Ledger { Code = "100202", Name = "Rental Equipment", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Rental Equipment" },
                    new Ledger { Code = "100203", Name = "Tools & Instruments", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Tools & Instruments" },
                    new Ledger { Code = "100204", Name = "Vehicles", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Vehicles" },
                    new Ledger { Code = "100205", Name = "Office Equipment", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Office Equipment" },
                    new Ledger { Code = "100206", Name = "Accumulated Depreciation", Class = "Asset", ParentCode = "1002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Accumulated Depreciation" },

                    new Ledger { Code = "1001", Name = "Current Asset", Class = "Asset", ParentCode = "No Parent", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Current Asset Group" },
                    new Ledger { Code = "10001", Name = "Main Bank Account", Class = "Asset", ParentCode = "1001", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Main Bank Account" },

                    new Ledger { Code = "2002", Name = "Long-Term Liabilities", Class = "Liability", ParentCode = "No Parent", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Long-Term Liabilities Group" },
                    new Ledger { Code = "200201", Name = "Bank Loan", Class = "Liability", ParentCode = "2002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Bank Loan" },
                    new Ledger { Code = "200202", Name = "Equipment Financing", Class = "Liability", ParentCode = "2002", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Equipment Financing" },

                    new Ledger { Code = "3001", Name = "Equity", Class = "Equity", ParentCode = "No Parent", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Equity Group" },
                    new Ledger { Code = "300101", Name = "Owner's Capital", Class = "Equity", ParentCode = "3001", IsRetainedEarnings = false, CompanyId = "ggms-oman", Description = "Owner's Capital" },
                    new Ledger { Code = "300102", Name = "Retained Earnings", Class = "Equity", ParentCode = "3001", IsRetainedEarnings = true, CompanyId = "ggms-oman", Description = "Retained Earnings" }
                };

                _context.Ledgers.AddRange(defaultLedgers);
                await _context.SaveChangesAsync();
                ledgers = defaultLedgers;
            }

            return Ok(ledgers);
        }

        [HttpPost("ledgers")]
        public async Task<IActionResult> CreateLedger([FromBody] Ledger ledger)
        {
            if (string.IsNullOrWhiteSpace(ledger.Code))
            {
                return BadRequest("Ledger Code is required.");
            }

            var existing = await _context.Ledgers.FindAsync(ledger.Code);
            if (existing != null)
            {
                // Update existing ledger
                existing.Name = ledger.Name;
                existing.Class = ledger.Class;
                existing.ParentCode = string.IsNullOrWhiteSpace(ledger.ParentCode) ? "No Parent" : ledger.ParentCode;
                existing.IsRetainedEarnings = ledger.IsRetainedEarnings;
                existing.Description = ledger.Description ?? string.Empty;
                _context.Ledgers.Update(existing);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(ledger.CompanyId))
                {
                    ledger.CompanyId = "ggms-oman";
                }
                if (string.IsNullOrWhiteSpace(ledger.ParentCode))
                {
                    ledger.ParentCode = "No Parent";
                }
                ledger.CreatedAt = DateTime.Now;
                _context.Ledgers.Add(ledger);
            }

            await _context.SaveChangesAsync();
            return Ok(ledger);
        }

        [HttpDelete("ledgers/{code}")]
        public async Task<IActionResult> DeleteLedger(string code)
        {
            var item = await _context.Ledgers.FindAsync(code);
            if (item == null) return NotFound();

            _context.Ledgers.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Ledger deleted successfully" });
        }

        // ==========================================
        // 2. ENTRY TYPES
        // ==========================================
        [HttpGet("entry-types")]
        public async Task<IActionResult> GetEntryTypes([FromQuery] string? companyId)
        {
            var targetCompanyId = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var entryTypes = await _context.EntryTypes
                .Where(e => e.CompanyId == targetCompanyId || e.CompanyId == "ggms-oman")
                .OrderBy(e => e.Code)
                .ToListAsync();
            return Ok(entryTypes);
        }

        [HttpPost("entry-types")]
        public async Task<IActionResult> CreateEntryType([FromBody] EntryType entryType)
        {
            if (string.IsNullOrWhiteSpace(entryType.Code))
            {
                var existingCodes = await _context.EntryTypes.Select(e => e.Code).ToListAsync();
                int nextNum = 1001;
                foreach (var c in existingCodes)
                {
                    if (int.TryParse(c, out int num) && num >= nextNum)
                    {
                        nextNum = num + 1;
                    }
                }
                entryType.Code = nextNum.ToString();
            }

            var existing = await _context.EntryTypes.FindAsync(entryType.Code);
            if (existing != null)
            {
                existing.Name = entryType.Name;
                existing.Description = entryType.Description ?? string.Empty;
                existing.Editor = "Tatweer Admin (Tatweer-Admin)";
                _context.EntryTypes.Update(existing);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(entryType.CompanyId))
                {
                    entryType.CompanyId = "ggms-oman";
                }
                entryType.Creator = "Tatweer Admin (Tatweer-Admin)";
                entryType.CreatedAt = DateTime.Now;
                _context.EntryTypes.Add(entryType);
            }

            await _context.SaveChangesAsync();
            return Ok(entryType);
        }

        [HttpDelete("entry-types/{code}")]
        public async Task<IActionResult> DeleteEntryType(string code)
        {
            var item = await _context.EntryTypes.FindAsync(code);
            if (item == null) return NotFound();

            _context.EntryTypes.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Entry Type deleted successfully" });
        }

        // ==========================================
        // 3. COST CENTRES
        // ==========================================
        [HttpGet("cost-centres")]
        public async Task<IActionResult> GetCostCentres([FromQuery] string? companyId)
        {
            var targetCompanyId = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var items = await _context.CostCentres
                .Where(c => c.CompanyId == targetCompanyId || c.CompanyId == "ggms-oman")
                .ToListAsync();
            return Ok(items);
        }

        [HttpPost("cost-centres")]
        public async Task<IActionResult> CreateCostCentre([FromBody] CostCentre costCentre)
        {
            if (string.IsNullOrWhiteSpace(costCentre.Code))
            {
                return BadRequest("Cost Centre Code is required.");
            }

            var existing = await _context.CostCentres.FindAsync(costCentre.Code);
            if (existing != null)
            {
                existing.Name = costCentre.Name;
                existing.Department = costCentre.Department;
                existing.Description = costCentre.Description;
                _context.CostCentres.Update(existing);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(costCentre.CompanyId)) costCentre.CompanyId = "ggms-oman";
                _context.CostCentres.Add(costCentre);
            }

            await _context.SaveChangesAsync();
            return Ok(costCentre);
        }

        [HttpDelete("cost-centres/{code}")]
        public async Task<IActionResult> DeleteCostCentre(string code)
        {
            var item = await _context.CostCentres.FindAsync(code);
            if (item == null) return NotFound();

            _context.CostCentres.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cost Centre deleted" });
        }

        // ==========================================
        // 4. PROFIT CENTRES
        // ==========================================
        [HttpGet("profit-centres")]
        public async Task<IActionResult> GetProfitCentres([FromQuery] string? companyId)
        {
            var targetCompanyId = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var items = await _context.ProfitCentres
                .Where(p => p.CompanyId == targetCompanyId || p.CompanyId == "ggms-oman")
                .ToListAsync();
            return Ok(items);
        }

        [HttpPost("profit-centres")]
        public async Task<IActionResult> CreateProfitCentre([FromBody] ProfitCentre profitCentre)
        {
            if (string.IsNullOrWhiteSpace(profitCentre.Code))
            {
                return BadRequest("Profit Centre Code is required.");
            }

            var existing = await _context.ProfitCentres.FindAsync(profitCentre.Code);
            if (existing != null)
            {
                existing.Name = profitCentre.Name;
                existing.BusinessUnit = profitCentre.BusinessUnit;
                existing.Description = profitCentre.Description;
                _context.ProfitCentres.Update(existing);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(profitCentre.CompanyId)) profitCentre.CompanyId = "ggms-oman";
                _context.ProfitCentres.Add(profitCentre);
            }

            await _context.SaveChangesAsync();
            return Ok(profitCentre);
        }

        [HttpDelete("profit-centres/{code}")]
        public async Task<IActionResult> DeleteProfitCentre(string code)
        {
            var item = await _context.ProfitCentres.FindAsync(code);
            if (item == null) return NotFound();

            _context.ProfitCentres.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Profit Centre deleted" });
        }

        // ==========================================
        // 5. JOURNAL ENTRIES (VOUCHERS)
        // ==========================================
        [HttpGet("entries")]
        public async Task<IActionResult> GetJournalEntries([FromQuery] string? companyId)
        {
            var targetCompanyId = string.IsNullOrWhiteSpace(companyId) ? "ggms-oman" : companyId;
            var entries = await _context.JournalEntries
                .Include(e => e.Lines)
                .Where(e => e.CompanyId == targetCompanyId || e.CompanyId == "ggms-oman")
                .OrderByDescending(e => e.Datetime)
                .ToListAsync();
            return Ok(entries);
        }

        [HttpPost("entries")]
        public async Task<IActionResult> CreateJournalEntry([FromBody] JournalEntry entry)
        {
            if (string.IsNullOrWhiteSpace(entry.Id))
            {
                entry.Id = $"JV-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
            }

            if (string.IsNullOrWhiteSpace(entry.CompanyId))
            {
                entry.CompanyId = "ggms-oman";
            }

            if (string.IsNullOrWhiteSpace(entry.Datetime))
            {
                entry.Datetime = DateTime.Now.ToString("dd/MM/yyyy, hh:mm:ss tt");
            }

            // Calculate totals from lines
            if (entry.Lines != null && entry.Lines.Any())
            {
                entry.TotalDebit = entry.Lines.Sum(l => l.Debit);
                entry.TotalCredit = entry.Lines.Sum(l => l.Credit);
                foreach (var line in entry.Lines)
                {
                    line.JournalEntryId = entry.Id;
                }
            }

            _context.JournalEntries.Add(entry);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = entry.CompanyId,
                Message = $"New Voucher Entry recorded: {entry.EntryTypeName} ({entry.Id}) with Total {entry.TotalDebit:N3} OMR."
            });

            await _context.SaveChangesAsync();
            return Ok(entry);
        }

        [HttpDelete("entries/{id}")]
        public async Task<IActionResult> DeleteJournalEntry(string id)
        {
            var entry = await _context.JournalEntries.Include(e => e.Lines).FirstOrDefaultAsync(e => e.Id == id);
            if (entry == null) return NotFound();

            if (entry.Lines != null && entry.Lines.Any())
            {
                _context.JournalEntryLines.RemoveRange(entry.Lines);
            }
            _context.JournalEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Journal Entry deleted" });
        }
    }
}
