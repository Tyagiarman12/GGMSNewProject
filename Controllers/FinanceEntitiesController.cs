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
            if (await _context.JournalEntryLines.AnyAsync(line => line.LedgerCode == code))
            {
                return Conflict("Ledger is used by a journal entry and cannot be deleted.");
            }

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
                existing.Editor = string.IsNullOrWhiteSpace(entryType.Editor) ? entryType.Creator : entryType.Editor;
                _context.EntryTypes.Update(existing);
            }
            else
            {
                if (string.IsNullOrWhiteSpace(entryType.CompanyId))
                {
                    entryType.CompanyId = "ggms-oman";
                }
                if (string.IsNullOrWhiteSpace(entryType.Creator))
                {
                    return BadRequest("Entry Type Creator is required.");
                }
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
            if (await _context.JournalEntries.AnyAsync(entry => entry.EntryTypeCode == code))
            {
                return Conflict("Entry type is used by a journal entry and cannot be deleted.");
            }

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
            if (string.IsNullOrWhiteSpace(costCentre.Creator))
            {
                return BadRequest("Cost Centre Creator is required.");
            }
            if (string.IsNullOrWhiteSpace(costCentre.ProfitCentreCode))
            {
                return BadRequest("Profit Centre is required.");
            }

            var existing = await _context.CostCentres.FindAsync(costCentre.Code);
            if (existing != null)
            {
                existing.Name = costCentre.Name;
                existing.ProfitCentreCode = costCentre.ProfitCentreCode;
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
            if (await _context.JournalEntryLines.AnyAsync(line => line.CostCentreCode == code))
            {
                return Conflict("Cost centre is used by a journal entry and cannot be deleted.");
            }

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
            if (string.IsNullOrWhiteSpace(profitCentre.Creator))
            {
                return BadRequest("Profit Centre Creator is required.");
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
            if (await _context.JournalEntryLines.AnyAsync(line => line.ProfitCentreCode == code))
            {
                return Conflict("Profit centre is used by a journal entry and cannot be deleted.");
            }

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
            if (string.IsNullOrWhiteSpace(entry.Creator))
            {
                return BadRequest("Voucher Creator is required.");
            }
            if (string.IsNullOrWhiteSpace(entry.CompanyId))
            {
                entry.CompanyId = _context.CurrentCompanyId;
            }
            var validationError = await ValidateJournalEntryAsync(entry);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var voucherPrefix = GetVoucherPrefix(entry.EntryTypeName);
            var entryIdSuffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            entry.Id = $"{voucherPrefix}-{DateTime.Now:yyyyMMdd}-{entryIdSuffix}";
            if (string.IsNullOrWhiteSpace(entry.Datetime))
            {
                entry.Datetime = DateTime.Now.ToString("dd/MM/yyyy, hh:mm:ss tt");
            }

            entry.TotalDebit = entry.Lines.Sum(line => line.Debit);
            entry.TotalCredit = entry.Lines.Sum(line => line.Credit);
            entry.Status = "Saved";
            foreach (var line in entry.Lines)
            {
                line.JournalEntryId = entry.Id;
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

        private static string GetVoucherPrefix(string entryTypeName)
        {
            if (entryTypeName.Contains("journal", StringComparison.OrdinalIgnoreCase))
            {
                return "JV";
            }

            var words = entryTypeName
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(word => new string(word.Where(char.IsLetter).ToArray()))
                .Where(word => word.Length > 0)
                .ToList();

            if (words.Any(word => word.Equals("payment", StringComparison.OrdinalIgnoreCase)))
            {
                return "PV";
            }

            var prefix = string.Concat(words.Take(3).Select(word => char.ToUpperInvariant(word[0])));
            return string.IsNullOrEmpty(prefix) ? "EV" : prefix;
        }

        [HttpPut("entries/{id}")]
        public async Task<IActionResult> UpdateJournalEntry(string id, [FromBody] JournalEntry entry)
        {
            var existingEntry = await _context.JournalEntries
                .Include(e => e.Lines)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (existingEntry == null) return NotFound();
            if (existingEntry.Status == "Posted")
            {
                return Conflict("Posted journal entries cannot be edited.");
            }

            var validationError = await ValidateJournalEntryAsync(entry);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            existingEntry.EntryTypeCode = entry.EntryTypeCode;
            existingEntry.EntryTypeName = entry.EntryTypeName;
            existingEntry.FiscalYear = entry.FiscalYear;
            existingEntry.Datetime = entry.Datetime;
            existingEntry.Reference = entry.Reference;
            existingEntry.AttachmentUrl = entry.AttachmentUrl;
            existingEntry.Notes = entry.Notes;

            var updatedLines = (entry.Lines ?? new List<JournalEntryLine>())
                .Select(line => new JournalEntryLine
                {
                    JournalEntryId = existingEntry.Id,
                    ProfitCentreCode = line.ProfitCentreCode,
                    CostCentreCode = line.CostCentreCode,
                    LedgerCode = line.LedgerCode,
                    LedgerName = line.LedgerName,
                    Debit = line.Debit,
                    Credit = line.Credit,
                    Notes = line.Notes
                })
                .ToList();

            _context.JournalEntryLines.RemoveRange(existingEntry.Lines);
            existingEntry.Lines = updatedLines;
            existingEntry.TotalDebit = updatedLines.Sum(line => line.Debit);
            existingEntry.TotalCredit = updatedLines.Sum(line => line.Credit);
            existingEntry.Status = "Saved";

            await _context.SaveChangesAsync();
            return Ok(existingEntry);
        }

        [HttpPut("entries/{id}/status")]
        public async Task<IActionResult> PostJournalEntry(string id, [FromBody] string status)
        {
            if (!string.Equals(status?.Trim(), "Posted", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only the Posted status is supported.");
            }

            var entry = await _context.JournalEntries
                .Include(item => item.Lines)
                .FirstOrDefaultAsync(item => item.Id == id);
            if (entry == null) return NotFound();
            if (entry.Status != "Saved")
            {
                return Conflict($"Journal entry cannot be posted from status {entry.Status}.");
            }
            var validationError = await ValidateJournalEntryAsync(entry);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            entry.Status = "Posted";
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                CompanyId = entry.CompanyId,
                Message = $"Journal entry {entry.Id} was posted."
            });
            await _context.SaveChangesAsync();
            return Ok(entry);
        }

        [HttpDelete("entries/{id}")]
        public async Task<IActionResult> DeleteJournalEntry(string id)
        {
            var entry = await _context.JournalEntries.Include(e => e.Lines).FirstOrDefaultAsync(e => e.Id == id);
            if (entry == null) return NotFound();
            if (entry.Status == "Posted")
            {
                return Conflict("Posted journal entries cannot be deleted.");
            }

            if (entry.Lines != null && entry.Lines.Any())
            {
                _context.JournalEntryLines.RemoveRange(entry.Lines);
            }
            _context.JournalEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Journal Entry deleted" });
        }

        private async Task<string?> ValidateJournalEntryAsync(JournalEntry entry)
        {
            if (entry.Lines == null || entry.Lines.Count < 2)
            {
                return "A journal entry must contain at least two lines.";
            }
            if (string.IsNullOrWhiteSpace(entry.EntryTypeCode) || string.IsNullOrWhiteSpace(entry.EntryTypeName))
            {
                return "Entry type is required.";
            }

            foreach (var line in entry.Lines)
            {
                if (string.IsNullOrWhiteSpace(line.LedgerCode))
                {
                    return "Every journal line must have a ledger account.";
                }
                if (line.Debit < 0 || line.Credit < 0 || (line.Debit > 0) == (line.Credit > 0))
                {
                    return "Each journal line must have a positive debit or credit, but not both.";
                }
            }

            var debit = entry.Lines.Sum(line => line.Debit);
            var credit = entry.Lines.Sum(line => line.Credit);
            if (debit <= 0 || Math.Abs(debit - credit) > 0.001m)
            {
                return "Journal entry debits and credits must be equal and greater than zero.";
            }

            var ledgerCodes = entry.Lines.Select(line => line.LedgerCode).Distinct().ToList();
            var existingLedgerCodes = await _context.Ledgers
                .Where(ledger => ledger.CompanyId == entry.CompanyId || ledger.CompanyId == "ggms-oman")
                .Where(ledger => ledgerCodes.Contains(ledger.Code))
                .Select(ledger => ledger.Code)
                .Distinct()
                .ToListAsync();
            if (existingLedgerCodes.Count != ledgerCodes.Count)
            {
                return "Every journal line must reference an existing ledger for this company.";
            }

            return null;
        }
    }
}
