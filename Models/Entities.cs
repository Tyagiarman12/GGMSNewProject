using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GGMSNEWPROJECT.Models
{
    public interface ITenantScoped
    {
        string CompanyId { get; set; }
    }

    public class Company
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string CountryCode { get; set; } = "OM";
        public string Currency { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = "OMR";
        public string CurrencySymbol { get; set; } = "OMR";
        public int CurrencyDecimals { get; set; } = 3;
        public decimal DefaultVatRate { get; set; } = 5.0m;
        public string TaxNumber { get; set; } = string.Empty;
        public decimal Profit { get; set; }
        public string? LogoUrl { get; set; }
        public string? Address { get; set; }
        public string? Branch { get; set; }
        public string? CrNumber { get; set; }
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }
    }

    public class Client : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public int Profitability { get; set; }
        public int OpenTasks { get; set; }
        public int InvoicesDue { get; set; }
        public string VatNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPersonName { get; set; } = string.Empty;
        public string ContactPersonNumber { get; set; } = string.Empty;

        public List<ClientContact> Contacts { get; set; } = new();
        public List<ClientLocation> Locations { get; set; } = new();
        public List<ClientProject> Projects { get; set; } = new();
    }

    public class ClientContact
    {
        [Key]
        public int Id { get; set; }
        public string ClientId { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
    }

    public class ClientLocation
    {
        [Key]
        public int Id { get; set; }
        public string ClientId { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
    }

    public class ClientProject
    {
        [Key]
        public int Id { get; set; }
        public string ClientId { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
    }

    public class Lead : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public string Requirement { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Status { get; set; } = string.Empty; // e.g. New, Qualified, Hot, Follow-up
        public string Owner { get; set; } = string.Empty;
        public string NextFollowUp { get; set; } = string.Empty;
    }

    public class Quotation : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Customer { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal Vat { get; set; }
        public string Status { get; set; } = string.Empty; // e.g. Sent, Approved, Expired, Draft
        public string Expires { get; set; } = string.Empty;
        public string LastFollowUp { get; set; } = string.Empty;
        public string Salesperson { get; set; } = string.Empty;
        public decimal Discount { get; set; }
        public string ItemsJson { get; set; } = "[]";
        public string Notes { get; set; } = string.Empty;
        public string TermsAndConditions { get; set; } = string.Empty;
    }

    public class ProductItem : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // e.g. Product, Service, AMC, License
        public string Category { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string Uom { get; set; } = "pcs";
        public int ProductGroupId { get; set; }
        public decimal BuyPrice { get; set; }
        public decimal SellPrice { get; set; }
        public int Stock { get; set; }
        public int MinStock { get; set; }
        public decimal VatRate { get; set; }
    }

    public class Uom : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
    }

    public class ProductGroup : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal VatPercentage { get; set; } = 5.0m; // 5.0 or 0.0
        public string CompanyId { get; set; } = "ggms-oman";
    }

    public class Invoice : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Customer { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Due { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g. Overdue, Due, Open
        public string Salesperson { get; set; } = string.Empty;
        public decimal Discount { get; set; }
        public decimal Vat { get; set; }
        public string ItemsJson { get; set; } = "[]";
        public string Notes { get; set; } = string.Empty;
        public string TermsAndConditions { get; set; } = string.Empty;
    }

    public class Bill : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Supplier { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Due { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g. To Pay, Scheduled
    }

    public class Employee : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public decimal Salary { get; set; }
        public string Bank { get; set; } = string.Empty;
        public string Iban { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g. Active, Needs IBAN
    }

    public class EmployeeTask : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AssigneeId { get; set; }
        public string AssigneeName { get; set; } = string.Empty;
        public string ReporterName { get; set; } = "Management";
        public string Status { get; set; } = "To Do"; // "To Do", "In Progress", "In Review", "Completed", "Blocked"
        public string Priority { get; set; } = "Medium"; // "Low", "Medium", "High", "Urgent"
        public string TaskType { get; set; } = "Task"; // "Task", "Bug", "Feature", "Maintenance"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public decimal EstimatedHours { get; set; } = 0;
        public decimal LoggedHours { get; set; } = 0;
    }

    public class Expense : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal Vat { get; set; }
        public string Status { get; set; } = string.Empty; // e.g. Pending, Approved, Rejected
        public bool Receipt { get; set; } // does it have receipt
        public string ReceiptUrl { get; set; } = string.Empty;
        public string Project { get; set; } = string.Empty;
    }

    public class Renewal : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string CompanyId { get; set; } = "ggms-oman";
        public string Client { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Due { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Margin { get; set; }
    }

    public class Asset : ITenantScoped
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Client { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Warranty { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g. Warranty expiring, Healthy
    }

    public class Credential : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // Encrpyted or masked
    }

    public class TimelineEvent : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string CompanyId { get; set; } = "ggms-oman";
        public DateTime Timestamp { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class User : ITenantScoped
    {
        [Key]
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "User"; // e.g. Admin, Manager, User
        public string CompanyId { get; set; } = "ggms-oman";
        public string AllowedCompanyIds { get; set; } = "ggms-oman,ggms-uae";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class Supplier : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string VatNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactPersonName { get; set; } = string.Empty;
        public string ContactPersonNumber { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public int ActiveOrders { get; set; }
        public int BillsDue { get; set; }
    }

    public class PurchaseEnquiry : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal Vat { get; set; }
        public string Status { get; set; } = "Draft"; // e.g. Draft, Sent, Approved, Expired, Converted to PO
        public string Date { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
        public string Salesperson { get; set; } = string.Empty;
        public string ItemsJson { get; set; } = "[]";
        public string Notes { get; set; } = string.Empty;
        public string TermsAndConditions { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string PurchaseOrderId { get; set; } = string.Empty;
    }

    public class PurchaseOrder : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
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

    public class Ledger : ITenantScoped
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string Class { get; set; } = "Asset"; // Asset, Liability, Equity, Revenue, Expense
        public string ParentCode { get; set; } = "No Parent";
        public bool IsRetainedEarnings { get; set; } = false;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class EntryType : ITenantScoped
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Creator { get; set; } = "Tatweer Admin";
        public string Editor { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public class CostCentre : ITenantScoped
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ProfitCentre : ITenantScoped
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string Name { get; set; } = string.Empty;
        public string BusinessUnit { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class JournalEntry : ITenantScoped
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string CompanyId { get; set; } = "ggms-oman";
        public string EntryTypeCode { get; set; } = "1001";
        public string EntryTypeName { get; set; } = "Journal Entry (JV)";
        public string FiscalYear { get; set; } = "2025-26 (Jul 1st 25 to Jun 30th 26)";
        public string Datetime { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string AttachmentUrl { get; set; } = string.Empty;
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = "Saved";
        public List<JournalEntryLine> Lines { get; set; } = new();
    }

    public class JournalEntryLine
    {
        [Key]
        public int Id { get; set; }
        public string JournalEntryId { get; set; } = string.Empty;
        public string ProfitCentreCode { get; set; } = string.Empty;
        public string CostCentreCode { get; set; } = string.Empty;
        public string LedgerCode { get; set; } = string.Empty;
        public string LedgerName { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}

