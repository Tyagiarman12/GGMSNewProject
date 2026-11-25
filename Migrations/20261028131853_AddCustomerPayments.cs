using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GGMSNEWPROJECT.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Companies",
                keyColumn: "Id",
                keyValue: "krativegrowth-uae");

            migrationBuilder.DeleteData(
                table: "Companies",
                keyColumn: "Id",
                keyValue: "pentagram-ksa");

            migrationBuilder.AddColumn<string>(
                name: "AllowedCompanyIds",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "TimelineEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Renewals",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ItemsJson",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Salesperson",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TermsAndConditions",
                table: "Quotations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "ProductItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ProductGroupId",
                table: "ProductItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Uom",
                table: "ProductItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ItemsJson",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Salesperson",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TermsAndConditions",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Vat",
                table: "Invoices",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Employees",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Credentials",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactNo",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "Companies",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CrNumber",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrencyCode",
                table: "Companies",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CurrencyDecimals",
                table: "Companies",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CurrencySymbol",
                table: "Companies",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "DefaultVatRate",
                table: "Companies",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Companies",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonName",
                table: "Clients",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonNumber",
                table: "Clients",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Clients",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VatNumber",
                table: "Clients",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Bills",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyId",
                table: "Assets",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CostCentres",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Department = table.Column<string>(type: "TEXT", nullable: false),
                    ProfitCentreCode = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Creator = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostCentres", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "CustomerPayments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    InvoiceId = table.Column<string>(type: "TEXT", nullable: false),
                    Customer = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Method = table.Column<string>(type: "TEXT", nullable: false),
                    Reference = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentDate = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPayments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeTasks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    AssigneeId = table.Column<string>(type: "TEXT", nullable: true),
                    AssigneeName = table.Column<string>(type: "TEXT", nullable: false),
                    ReporterName = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Priority = table.Column<string>(type: "TEXT", nullable: false),
                    TaskType = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DueDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EstimatedHours = table.Column<decimal>(type: "TEXT", nullable: false),
                    LoggedHours = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EntryTypes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Creator = table.Column<string>(type: "TEXT", nullable: false),
                    Editor = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntryTypes", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "JournalEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    EntryTypeCode = table.Column<string>(type: "TEXT", nullable: false),
                    EntryTypeName = table.Column<string>(type: "TEXT", nullable: false),
                    Creator = table.Column<string>(type: "TEXT", nullable: false),
                    FiscalYear = table.Column<string>(type: "TEXT", nullable: false),
                    Datetime = table.Column<string>(type: "TEXT", nullable: false),
                    Reference = table.Column<string>(type: "TEXT", nullable: false),
                    AttachmentUrl = table.Column<string>(type: "TEXT", nullable: false),
                    TotalDebit = table.Column<decimal>(type: "TEXT", nullable: false),
                    TotalCredit = table.Column<decimal>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ledgers",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Class = table.Column<string>(type: "TEXT", nullable: false),
                    ParentCode = table.Column<string>(type: "TEXT", nullable: false),
                    IsRetainedEarnings = table.Column<bool>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ledgers", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "ProductGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    VatPercentage = table.Column<decimal>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProfitCentres",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    BusinessUnit = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Creator = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfitCentres", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseEnquiries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    SupplierName = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Vat = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Date = table.Column<string>(type: "TEXT", nullable: false),
                    Remarks = table.Column<string>(type: "TEXT", nullable: false),
                    Salesperson = table.Column<string>(type: "TEXT", nullable: false),
                    ItemsJson = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    TermsAndConditions = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    PurchaseOrderId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseEnquiries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseOrders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PurchaseOrderNo = table.Column<string>(type: "TEXT", nullable: false),
                    PurchaseEnquiryId = table.Column<string>(type: "TEXT", nullable: false),
                    SupplierName = table.Column<string>(type: "TEXT", nullable: false),
                    SupplierEmail = table.Column<string>(type: "TEXT", nullable: false),
                    OrderDate = table.Column<string>(type: "TEXT", nullable: false),
                    Remarks = table.Column<string>(type: "TEXT", nullable: false),
                    ItemsJson = table.Column<string>(type: "TEXT", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    VatAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    NetAmount = table.Column<decimal>(type: "TEXT", nullable: false),
                    TermsAndConditions = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    VatNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    ContactPersonName = table.Column<string>(type: "TEXT", nullable: false),
                    ContactPersonNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    ActiveOrders = table.Column<int>(type: "INTEGER", nullable: false),
                    BillsDue = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Uoms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Uoms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JournalEntryLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JournalEntryId = table.Column<string>(type: "TEXT", nullable: false),
                    ProfitCentreCode = table.Column<string>(type: "TEXT", nullable: false),
                    CostCentreCode = table.Column<string>(type: "TEXT", nullable: false),
                    LedgerCode = table.Column<string>(type: "TEXT", nullable: false),
                    LedgerName = table.Column<string>(type: "TEXT", nullable: false),
                    Debit = table.Column<decimal>(type: "TEXT", nullable: false),
                    Credit = table.Column<decimal>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalEntryLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JournalEntryLines_JournalEntries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "JournalEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Code",
                keyValue: "AST-AE-0022",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Code",
                keyValue: "AST-OM-0009",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Code",
                keyValue: "AST-OM-0014",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Assets",
                keyColumn: "Code",
                keyValue: "AST-SA-0031",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-771",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-774",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Bills",
                keyColumn: "Id",
                keyValue: "BILL-779",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "al-badea",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Tariq Projects", "+96899887766", "projects@albadea.com", "OM110022338" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "al-reem",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Fatma Admin", "+971509988776", "admin@alreem.ae", "OM110022340" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "barka",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Said Maintenance", "+96899778899", "contact@barkapoultry.com", "OM110022336" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "kleev",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "John Operations", "+96899112233", "info@kleev.com", "OM110022334" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "oneroad",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Mazin CEO Office", "+96899223344", "ceo@oneroad.com", "OM110022339" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "salamander",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Salim HSE", "+96899554433", "security@salamander.com", "OM110022337" });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: "timberworks",
                columns: new[] { "ContactPersonName", "ContactPersonNumber", "Email", "VatNumber" },
                values: new object[] { "Ahmed Procure", "+96899445566", "procure@timberworks.com", "OM110022335" });

            migrationBuilder.UpdateData(
                table: "Companies",
                keyColumn: "Id",
                keyValue: "ggms-oman",
                columns: new[] { "Address", "Branch", "ContactNo", "CountryCode", "CrNumber", "CurrencyCode", "CurrencyDecimals", "CurrencySymbol", "DefaultVatRate", "Email", "LogoUrl", "Website" },
                values: new object[] { "Building 42, Street 19, Al Khuwair, Muscat, Sultanate of Oman", "Muscat Main HQ", "+968 2449 0011", "OM", "CR-1049281", "OMR", 3, "OMR", 5.0m, "billing@ggms.om", null, "https://www.ggms.om" });

            migrationBuilder.UpdateData(
                table: "Credentials",
                keyColumn: "Id",
                keyValue: 1,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Credentials",
                keyColumn: "Id",
                keyValue: 2,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Credentials",
                keyColumn: "Id",
                keyValue: 3,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Credentials",
                keyColumn: "Id",
                keyValue: 4,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.InsertData(
                table: "EmployeeTasks",
                columns: new[] { "Id", "AssigneeId", "AssigneeName", "CompanyId", "CompletedAt", "CreatedAt", "Description", "DueDate", "EstimatedHours", "LoggedHours", "Priority", "ReporterName", "Status", "TaskType", "Title" },
                values: new object[,]
                {
                    { "TSK-1001", "EMP-001", "Abdullah", "ggms-oman", null, new DateTime(2026, 10, 25, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3580), "Setup outbound rules & VPN user access for KLEEV project site.", new DateTime(2026, 10, 30, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3590), 6m, 4m, "High", "Rizwan", "In Progress", "Task", "Configure Fortinet Firewall Policies" },
                    { "TSK-1002", "EMP-001", "Abdullah", "ggms-oman", new DateTime(2026, 10, 27, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3620), new DateTime(2026, 10, 23, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3610), "Conduct physical cabling check and test NVR channel feeds at Barka Poultry.", new DateTime(2026, 10, 27, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3620), 4m, 4m, "Medium", "Rizwan", "Completed", "Maintenance", "Inspect CCTV Camera Rack Connections" },
                    { "TSK-1003", "EMP-002", "Rizwan", "ggms-oman", null, new DateTime(2026, 10, 26, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3640), "Draft project timeline gantt chart & resource allocation for Timberworks project.", new DateTime(2026, 10, 29, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3640), 8m, 5m, "Urgent", "Management", "In Progress", "Feature", "Prepare Project Delivery Milestones" },
                    { "TSK-1004", "EMP-003", "Sales Team", "ggms-oman", null, new DateTime(2026, 10, 27, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3650), "Call OneRoad Group procurement manager for AMC proposal feedback.", new DateTime(2026, 10, 31, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3650), 3m, 0m, "High", "Management", "To Do", "Task", "Client Sales Pitch Follow-up" },
                    { "TSK-1005", "EMP-004", "Accounts", "ggms-oman", null, new DateTime(2026, 10, 24, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3690), "Perform bank statement matching against overdue customer payments.", new DateTime(2026, 10, 30, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3690), 5m, 4m, "Medium", "Management", "In Review", "Task", "Reconcile Outstanding Invoices for Q2" },
                    { "TSK-1006", "EMP-005", "Project Coordinator", "ggms-oman", null, new DateTime(2026, 10, 27, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3700), "Provision 25 user licenses and sync domain MX records for Al Reem.", new DateTime(2026, 11, 1, 13, 18, 40, 824, DateTimeKind.Utc).AddTicks(3700), 4m, 0m, "Low", "Rizwan", "To Do", "Task", "Setup M365 Business Basic Users" }
                });

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: "EMP-001",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: "EMP-002",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: "EMP-003",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: "EMP-004",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: "EMP-005",
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: "INV-3028",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions", "Vat" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "", 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: "INV-3031",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions", "Vat" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "", 0m });

            migrationBuilder.UpdateData(
                table: "Invoices",
                keyColumn: "Id",
                keyValue: "INV-3036",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions", "Vat" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "", 0m });

            migrationBuilder.InsertData(
                table: "ProductGroups",
                columns: new[] { "Id", "CompanyId", "Name", "VatPercentage" },
                values: new object[,]
                {
                    { 1, "ggms-oman", "CCTV", 5.0m },
                    { 2, "ggms-oman", "Storage", 5.0m },
                    { 3, "ggms-oman", "Cable", 5.0m },
                    { 4, "ggms-oman", "IT Service", 5.0m },
                    { 5, "ggms-oman", "AMC", 5.0m },
                    { 6, "ggms-oman", "Software", 5.0m },
                    { 7, "ggms-oman", "Exempt Items", 0.0m }
                });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-001",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "008562011991", 1, "Pcs" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-002",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "181800007719", 1, "Pcs" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-003",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "209918273645", 2, "Pcs" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-004",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "301928374650", 3, "Box" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-005",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "402837465019", 4, "Set" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-006",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "503746501928", 5, "Set" });

            migrationBuilder.UpdateData(
                table: "ProductItems",
                keyColumn: "Id",
                keyValue: "ITM-007",
                columns: new[] { "Barcode", "ProductGroupId", "Uom" },
                values: new object[] { "604650192837", 6, "Pcs" });

            migrationBuilder.UpdateData(
                table: "Quotations",
                keyColumn: "Id",
                keyValue: "QT-OM-2201",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "" });

            migrationBuilder.UpdateData(
                table: "Quotations",
                keyColumn: "Id",
                keyValue: "QT-OM-2202",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "" });

            migrationBuilder.UpdateData(
                table: "Quotations",
                keyColumn: "Id",
                keyValue: "QT-OM-2203",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "" });

            migrationBuilder.UpdateData(
                table: "Quotations",
                keyColumn: "Id",
                keyValue: "QT-OM-2204",
                columns: new[] { "CompanyId", "Discount", "ItemsJson", "Notes", "Salesperson", "TermsAndConditions" },
                values: new object[] { "ggms-oman", 0m, "[]", "", "", "" });

            migrationBuilder.UpdateData(
                table: "Renewals",
                keyColumn: "Id",
                keyValue: 1,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Renewals",
                keyColumn: "Id",
                keyValue: 2,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Renewals",
                keyColumn: "Id",
                keyValue: 3,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.UpdateData(
                table: "Renewals",
                keyColumn: "Id",
                keyValue: 4,
                column: "CompanyId",
                value: "ggms-oman");

            migrationBuilder.InsertData(
                table: "Suppliers",
                columns: new[] { "Id", "ActiveOrders", "BillsDue", "Category", "CompanyId", "ContactPersonName", "ContactPersonNumber", "Email", "Name", "Notes", "VatNumber" },
                values: new object[,]
                {
                    { "cloud-lic", 3, 1, "Software", "ggms-oman", "George Billing", "+971501234567", "billing@cloudlic.com", "Cloud License Distributor", "Microsoft 365 and cloud subscription provider.", "OM550099883" },
                    { "muscat-tech", 2, 1, "IT Hardware", "ggms-oman", "Salim Sales", "+96899221100", "sales@muscattech.om", "Muscat Technical Trading LLC", "Local distributor for network switches and cabling accessories.", "OM550099881" },
                    { "oman-net", 1, 1, "Cabling", "ggms-oman", "Fatma Support", "+96899334455", "support@omannet.om", "Oman Network Supplies", "Main supplier for Cat6 box and fiber patch panels.", "OM550099882" }
                });

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CompanyId", "Timestamp" },
                values: new object[] { "ggms-oman", new DateTime(2026, 10, 27, 18, 48, 40, 824, DateTimeKind.Local).AddTicks(3310) });

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CompanyId", "Timestamp" },
                values: new object[] { "ggms-oman", new DateTime(2026, 10, 28, 6, 48, 40, 824, DateTimeKind.Local).AddTicks(3430) });

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CompanyId", "Timestamp" },
                values: new object[] { "ggms-oman", new DateTime(2026, 10, 28, 14, 48, 40, 824, DateTimeKind.Local).AddTicks(3450) });

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CompanyId", "Timestamp" },
                values: new object[] { "ggms-oman", new DateTime(2026, 10, 28, 17, 48, 40, 824, DateTimeKind.Local).AddTicks(3460) });

            migrationBuilder.InsertData(
                table: "Uoms",
                columns: new[] { "Id", "CompanyId", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "ggms-oman", "Pieces", "Pcs" },
                    { 2, "ggms-oman", "Meters", "Meter" },
                    { 3, "ggms-oman", "Boxes", "Box" },
                    { 4, "ggms-oman", "Kilograms", "Kg" },
                    { 5, "ggms-oman", "Sets", "Set" },
                    { 6, "ggms-oman", "Rolls", "Roll" }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AllowedCompanyIds", "CompanyId", "CreatedAt", "PasswordHash" },
                values: new object[] { "ggms-oman,ggms-uae", "ggms-oman", new DateTime(2026, 10, 28, 18, 48, 40, 824, DateTimeKind.Local).AddTicks(3810), "$2a$11$wCDVEmvOxkEpHvDf5Uaxg.MA.qmxLQ3hO50RxRdp5e50h1ZHi9vAa" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AllowedCompanyIds", "CompanyId", "CreatedAt", "PasswordHash" },
                values: new object[] { "ggms-oman,ggms-uae", "ggms-oman", new DateTime(2026, 10, 28, 18, 48, 40, 824, DateTimeKind.Local).AddTicks(3830), "$2a$11$wCDVEmvOxkEpHvDf5Uaxg.MA.qmxLQ3hO50RxRdp5e50h1ZHi9vAa" });

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_JournalEntryId",
                table: "JournalEntryLines",
                column: "JournalEntryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CostCentres");

            migrationBuilder.DropTable(
                name: "CustomerPayments");

            migrationBuilder.DropTable(
                name: "EmployeeTasks");

            migrationBuilder.DropTable(
                name: "EntryTypes");

            migrationBuilder.DropTable(
                name: "JournalEntryLines");

            migrationBuilder.DropTable(
                name: "Ledgers");

            migrationBuilder.DropTable(
                name: "ProductGroups");

            migrationBuilder.DropTable(
                name: "ProfitCentres");

            migrationBuilder.DropTable(
                name: "PurchaseEnquiries");

            migrationBuilder.DropTable(
                name: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropTable(
                name: "Uoms");

            migrationBuilder.DropTable(
                name: "JournalEntries");

            migrationBuilder.DropColumn(
                name: "AllowedCompanyIds",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "TimelineEvents");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Renewals");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ItemsJson",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Salesperson",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "TermsAndConditions",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "ProductItems");

            migrationBuilder.DropColumn(
                name: "ProductGroupId",
                table: "ProductItems");

            migrationBuilder.DropColumn(
                name: "Uom",
                table: "ProductItems");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ItemsJson",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Salesperson",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "TermsAndConditions",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Vat",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Credentials");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Branch",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ContactNo",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CrNumber",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CurrencyCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CurrencyDecimals",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CurrencySymbol",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "DefaultVatRate",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "ContactPersonName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ContactPersonNumber",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "VatNumber",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Assets");

            migrationBuilder.InsertData(
                table: "Companies",
                columns: new[] { "Id", "Country", "Currency", "Name", "Profit", "TaxNumber" },
                values: new object[,]
                {
                    { "krativegrowth-uae", "UAE", "AED", "KrativeGrowth", 93500m, "AE100557290" },
                    { "pentagram-ksa", "Saudi Arabia", "SAR", "Pentagram", 276000m, "SA310992883" }
                });

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 1,
                column: "Timestamp",
                value: new DateTime(2026, 7, 6, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9760));

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 2,
                column: "Timestamp",
                value: new DateTime(2026, 7, 6, 12, 16, 7, 38, DateTimeKind.Local).AddTicks(9810));

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 3,
                column: "Timestamp",
                value: new DateTime(2026, 7, 6, 20, 16, 7, 38, DateTimeKind.Local).AddTicks(9810));

            migrationBuilder.UpdateData(
                table: "TimelineEvents",
                keyColumn: "Id",
                keyValue: 4,
                column: "Timestamp",
                value: new DateTime(2026, 7, 6, 23, 16, 7, 38, DateTimeKind.Local).AddTicks(9820));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 7, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9850), "$2a$11$lm/f.xn1hW5F0TQYy.Q/peSzCQsWdOEkFB6GJcVfQmr.a3JhKM9Wa" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 7, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9860), "$2a$11$lm/f.xn1hW5F0TQYy.Q/peSzCQsWdOEkFB6GJcVfQmr.a3JhKM9Wa" });
        }
    }
}
