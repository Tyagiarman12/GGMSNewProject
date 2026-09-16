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
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPurchaseOrders([FromQuery] string companyId = "ggms-oman", [FromQuery] string search = "")
        {
            var query = _context.PurchaseOrders
                .Where(p => string.IsNullOrEmpty(companyId) || p.CompanyId == companyId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var s = search.ToLower();
                query = query.Where(p => p.PurchaseOrderNo.ToLower().Contains(s) ||
                                         p.SupplierName.ToLower().Contains(s) ||
                                         p.PurchaseEnquiryId.ToLower().Contains(s));
            }

            var orders = await query.ToListAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchaseOrder(string id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = $"Purchase Order {id} not found." });
            }
            return Ok(order);
        }

        public class CreatePurchaseOrderDto
        {
            public string PurchaseOrderNo { get; set; } = string.Empty;
            public string PurchaseEnquiryId { get; set; } = string.Empty;
            public string SupplierName { get; set; } = string.Empty;
            public string SupplierEmail { get; set; } = string.Empty;
            public string OrderDate { get; set; } = string.Empty;
            public string Remarks { get; set; } = string.Empty;
            public string ItemsJson { get; set; } = "[]";
            public decimal TotalAmount { get; set; }
            public decimal VatAmount { get; set; }
            public decimal GrossAmount { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal NetAmount { get; set; }
            public string TermsAndConditions { get; set; } = string.Empty;
            public string Notes { get; set; } = string.Empty;
            public string Status { get; set; } = "Issued";
            public string CompanyId { get; set; } = "ggms-oman";
        }

        [HttpPost]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
            {
                return BadRequest(new { message = "Supplier Name is required." });
            }

            var randIdNum = new Random().Next(1000, 9999);
            var poId = $"PO-{randIdNum}";
            var poNo = string.IsNullOrEmpty(dto.PurchaseOrderNo) ? $"PO1_{new Random().Next(1, 999)}" : dto.PurchaseOrderNo;

            var po = new PurchaseOrder
            {
                Id = poId,
                PurchaseOrderNo = poNo,
                PurchaseEnquiryId = dto.PurchaseEnquiryId,
                SupplierName = dto.SupplierName,
                SupplierEmail = dto.SupplierEmail,
                OrderDate = string.IsNullOrEmpty(dto.OrderDate) ? DateTime.Now.ToString("yyyy-MM-dd") : dto.OrderDate,
                Remarks = dto.Remarks,
                ItemsJson = dto.ItemsJson,
                TotalAmount = dto.TotalAmount,
                VatAmount = dto.VatAmount,
                GrossAmount = dto.GrossAmount,
                DiscountAmount = dto.DiscountAmount,
                NetAmount = dto.NetAmount,
                TermsAndConditions = dto.TermsAndConditions,
                Notes = dto.Notes,
                Status = dto.Status,
                CompanyId = string.IsNullOrEmpty(dto.CompanyId) ? "ggms-oman" : dto.CompanyId
            };

            _context.PurchaseOrders.Add(po);

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Purchase Order {po.PurchaseOrderNo} created for supplier {po.SupplierName}"
            });

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPurchaseOrder), new { id = po.Id }, po);
        }

        [HttpPost("convert-enquiry/{enquiryId}")]
        public async Task<IActionResult> ConvertEnquiryToPO(string enquiryId)
        {
            var enquiry = await _context.PurchaseEnquiries.FindAsync(enquiryId);
            if (enquiry == null)
            {
                return NotFound(new { message = $"Purchase Enquiry {enquiryId} not found." });
            }

            var count = await _context.PurchaseOrders.CountAsync();
            var poNo = $"PO1_{count + 1}";
            var poId = $"PO-OM-{1000 + count + 1}";

            // Calculate totals from items
            decimal subtotal = enquiry.Amount;
            decimal vat = enquiry.Vat;
            decimal gross = subtotal + vat;

            var supplierObj = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name == enquiry.SupplierName);
            string suppEmail = supplierObj?.Email ?? "";

            var po = new PurchaseOrder
            {
                Id = poId,
                PurchaseOrderNo = poNo,
                PurchaseEnquiryId = enquiry.Id,
                SupplierName = enquiry.SupplierName,
                SupplierEmail = suppEmail,
                OrderDate = DateTime.Now.ToString("yyyy-MM-dd"),
                Remarks = enquiry.Remarks,
                ItemsJson = enquiry.ItemsJson,
                TotalAmount = subtotal,
                VatAmount = vat,
                GrossAmount = gross,
                DiscountAmount = 0,
                NetAmount = gross,
                TermsAndConditions = enquiry.TermsAndConditions,
                Notes = enquiry.Notes,
                Status = "Issued",
                CompanyId = enquiry.CompanyId
            };

            _context.PurchaseOrders.Add(po);

            // Update enquiry status and link back
            enquiry.Status = "Converted to PO";
            enquiry.PurchaseOrderId = po.Id;

            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = DateTime.Now,
                Message = $"Converted Approved Purchase Enquiry {enquiryId} to Purchase Order {po.PurchaseOrderNo}"
            });

            await _context.SaveChangesAsync();
            return Ok(po);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(string id, [FromBody] CreatePurchaseOrderDto dto)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null)
            {
                return NotFound(new { message = $"Purchase Order {id} not found." });
            }

            po.PurchaseOrderNo = string.IsNullOrEmpty(dto.PurchaseOrderNo) ? po.PurchaseOrderNo : dto.PurchaseOrderNo;
            po.PurchaseEnquiryId = dto.PurchaseEnquiryId ?? po.PurchaseEnquiryId;
            po.SupplierName = dto.SupplierName;
            po.SupplierEmail = dto.SupplierEmail;
            po.OrderDate = string.IsNullOrEmpty(dto.OrderDate) ? po.OrderDate : dto.OrderDate;
            po.Remarks = dto.Remarks;
            po.ItemsJson = dto.ItemsJson;
            po.TotalAmount = dto.TotalAmount;
            po.VatAmount = dto.VatAmount;
            po.GrossAmount = dto.GrossAmount;
            po.DiscountAmount = dto.DiscountAmount;
            po.NetAmount = dto.NetAmount;
            po.TermsAndConditions = dto.TermsAndConditions;
            po.Notes = dto.Notes;
            po.Status = string.IsNullOrEmpty(dto.Status) ? po.Status : dto.Status;

            await _context.SaveChangesAsync();
            return Ok(po);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchaseOrder(string id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = $"Purchase Order {id} not found." });
            }

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Purchase Order deleted successfully." });
        }
    }
}
