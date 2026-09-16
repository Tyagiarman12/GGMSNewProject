using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GGMSNEWPROJECT.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    Client = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Brand = table.Column<string>(type: "TEXT", nullable: false),
                    Warranty = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assets", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "Bills",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Supplier = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Due = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Industry = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    Profitability = table.Column<int>(type: "INTEGER", nullable: false),
                    OpenTasks = table.Column<int>(type: "INTEGER", nullable: false),
                    InvoicesDue = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Country = table.Column<string>(type: "TEXT", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", nullable: false),
                    TaxNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Profit = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Credentials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Credentials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    Department = table.Column<string>(type: "TEXT", nullable: false),
                    Salary = table.Column<decimal>(type: "TEXT", nullable: false),
                    Bank = table.Column<string>(type: "TEXT", nullable: false),
                    Iban = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Date = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Vat = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Receipt = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReceiptUrl = table.Column<string>(type: "TEXT", nullable: false),
                    Project = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Customer = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Due = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    ClientName = table.Column<string>(type: "TEXT", nullable: false),
                    Contact = table.Column<string>(type: "TEXT", nullable: false),
                    Requirement = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Owner = table.Column<string>(type: "TEXT", nullable: false),
                    NextFollowUp = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyId = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    BuyPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    SellPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    Stock = table.Column<int>(type: "INTEGER", nullable: false),
                    MinStock = table.Column<int>(type: "INTEGER", nullable: false),
                    VatRate = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Quotations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Customer = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Vat = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Expires = table.Column<string>(type: "TEXT", nullable: false),
                    LastFollowUp = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quotations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Renewals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Client = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Due = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Margin = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Renewals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TimelineEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimelineEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClientContacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    ContactName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientContacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientContacts_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    LocationName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientLocations_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientProjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClientId = table.Column<string>(type: "TEXT", nullable: false),
                    ProjectName = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientProjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientProjects_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Assets",
                columns: new[] { "Code", "Brand", "Category", "Client", "Location", "Status", "Warranty" },
                values: new object[,]
                {
                    { "AST-AE-0022", "Microsoft 365", "License", "Al Reem", "Cloud", "License expiring", "2026-06-30" },
                    { "AST-OM-0009", "Fortinet", "Firewall", "KLEEV", "Muscat HQ", "Warranty expiring", "2026-07-12" },
                    { "AST-OM-0014", "Synology", "NAS", "Barka Poultry", "Barka Farm", "Warranty expiring", "2026-06-28" },
                    { "AST-SA-0031", "Hikvision", "Access Control", "Salamander Oil & Gas", "Dammam Site", "Healthy", "2027-01-10" }
                });

            migrationBuilder.InsertData(
                table: "Bills",
                columns: new[] { "Id", "Amount", "Due", "Status", "Supplier" },
                values: new object[,]
                {
                    { "BILL-771", 134.10m, "2026-06-20", "To Pay", "Muscat Technical Trading LLC" },
                    { "BILL-774", 690m, "2026-06-28", "To Pay", "Oman Network Supplies" },
                    { "BILL-779", 420m, "2026-07-02", "Scheduled", "Cloud License Distributor" }
                });

            migrationBuilder.InsertData(
                table: "Clients",
                columns: new[] { "Id", "CompanyId", "Industry", "InvoicesDue", "Name", "Notes", "OpenTasks", "Profitability" },
                values: new object[,]
                {
                    { "al-badea", "ggms-oman", "Construction", 3, "Al Badea National", "Receivables need management attention.", 9, 22 },
                    { "al-reem", "ggms-oman", "Real Estate", 2, "Al Reem", "HRMS payroll export configuration pending.", 11, 37 },
                    { "barka", "ggms-oman", "Food Production", 1, "Barka Poultry", "Warranty expiry coming for UPS and NAS.", 3, 29 },
                    { "kleev", "ggms-oman", "Retail", 2, "KLEEV", "High-value managed IT account with firewall renewal due this quarter.", 8, 34 },
                    { "oneroad", "ggms-oman", "Logistics", 1, "OneRoad Group", "Website phase 2 proposal ready for follow-up.", 6, 48 },
                    { "salamander", "ggms-oman", "Oil & Gas", 0, "Salamander Oil & Gas", "Security project on track, pending final site acceptance.", 4, 41 },
                    { "timberworks", "ggms-oman", "Manufacturing", 1, "Timberworks", "AMC usage is above expected visit consumption. Watch margin.", 5, 18 }
                });

            migrationBuilder.InsertData(
                table: "Companies",
                columns: new[] { "Id", "Country", "Currency", "Name", "Profit", "TaxNumber" },
                values: new object[,]
                {
                    { "ggms-oman", "Oman", "OMR", "GGMS Global IT Solutions SPC", 18420m, "OM11023891" },
                    { "krativegrowth-uae", "UAE", "AED", "KrativeGrowth", 93500m, "AE100557290" },
                    { "pentagram-ksa", "Saudi Arabia", "SAR", "Pentagram", 276000m, "SA310992883" }
                });

            migrationBuilder.InsertData(
                table: "Credentials",
                columns: new[] { "Id", "Name", "Password", "Username" },
                values: new object[,]
                {
                    { 1, "Firewall admin", "FortiPassword123!", "admin" },
                    { 2, "Microsoft 365 tenant", "M365TenantSecret!", "globaladmin@kleev.onmicrosoft.com" },
                    { 3, "CCTV NVR", "NvrPassword456!", "admin" },
                    { 4, "Cloud backup", "AzureStorageBackupKey789!", "backup_agent" }
                });

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "Id", "Bank", "Department", "Iban", "Name", "Role", "Salary", "Status" },
                values: new object[,]
                {
                    { "EMP-001", "Bank Muscat", "Operations", "OM12BMUS000000001", "Abdullah", "Engineer", 650m, "Active" },
                    { "EMP-002", "Sohar International", "Delivery", "OM44SOIB000000002", "Rizwan", "Project Manager", 850m, "Active" },
                    { "EMP-003", "Bank Muscat", "Sales", "Missing", "Sales Team", "Sales", 700m, "Needs IBAN" },
                    { "EMP-004", "NBO", "Finance", "OM77NBOB000000004", "Accounts", "Accounts", 600m, "Active" },
                    { "EMP-005", "Bank Dhofar", "Delivery", "OM55BDOF000000005", "Project Coordinator", "Coordinator", 500m, "Active" }
                });

            migrationBuilder.InsertData(
                table: "Expenses",
                columns: new[] { "Id", "Amount", "Category", "CompanyId", "Date", "Project", "Receipt", "ReceiptUrl", "Status", "Vat" },
                values: new object[,]
                {
                    { "EXP-1042", 34.50m, "Fuel", "ggms-oman", "2026-06-04", "CCTV AMC Support", true, "/placeholder-receipt1.pdf", "Pending", 1.64m },
                    { "EXP-1043", 128m, "Cable", "ggms-oman", "2026-06-05", "Server & Firewall Setup", true, "/placeholder-receipt2.pdf", "Approved", 6.10m },
                    { "EXP-1044", 875m, "Emergency purchase", "pentagram-ksa", "2026-06-06", "Access Control Setup", false, "", "Pending", 114.13m },
                    { "EXP-1045", 90m, "Courier", "krativegrowth-uae", "2026-06-07", "HRMS Software", true, "/placeholder-receipt3.pdf", "Rejected", 4.29m }
                });

            migrationBuilder.InsertData(
                table: "Invoices",
                columns: new[] { "Id", "Amount", "Customer", "Due", "Status" },
                values: new object[,]
                {
                    { "INV-3028", 1850m, "KLEEV", "2026-06-18", "Overdue" },
                    { "INV-3031", 4200m, "Timberworks", "2026-06-25", "Due" },
                    { "INV-3036", 8925m, "Barka Poultry", "2026-07-05", "Open" }
                });

            migrationBuilder.InsertData(
                table: "Leads",
                columns: new[] { "Id", "ClientName", "CompanyId", "Contact", "NextFollowUp", "Owner", "Requirement", "Status", "Value" },
                values: new object[,]
                {
                    { "LEAD-OM-101", "KLEEV", "ggms-oman", "Operations Manager", "Today", "Sales", "Firewall renewal and IT AMC", "Hot", 9800m },
                    { "LEAD-OM-102", "Barka Poultry", "ggms-oman", "Maintenance Head", "Tomorrow", "Manager", "Server & Firewall Setup", "Qualified", 8500m },
                    { "LEAD-OM-103", "Timberworks", "ggms-oman", "Plant Admin", "Overdue", "Sales", "CCTV AMC Support", "Follow-up", 4200m },
                    { "LEAD-OM-104", "Al Badea National", "ggms-oman", "Projects Director", "2026-06-18", "Engineer", "Access point upgrade", "New", 2600m }
                });

            migrationBuilder.InsertData(
                table: "ProductItems",
                columns: new[] { "Id", "BuyPrice", "Category", "CompanyId", "MinStock", "Name", "SellPrice", "Stock", "Type", "VatRate" },
                values: new object[,]
                {
                    { "ITM-001", 28m, "CCTV", "ggms-oman", 5, "Hikvision 4MP IP Camera", 48m, 12, "Product", 0.05m },
                    { "ITM-002", 85m, "CCTV", "ggms-oman", 2, "8 Channel NVR", 135m, 4, "Product", 0.05m },
                    { "ITM-003", 22m, "Storage", "ggms-oman", 4, "1TB Surveillance HDD", 38m, 8, "Product", 0.05m },
                    { "ITM-004", 32m, "Cable", "ggms-oman", 4, "Cat6 Cable Box", 55m, 3, "Product", 0.05m },
                    { "ITM-005", 0m, "IT Service", "ggms-oman", 0, "Firewall Configuration Service", 180m, 0, "Service", 0.05m },
                    { "ITM-006", 120m, "AMC", "ggms-oman", 0, "IT AMC Monthly Plan", 320m, 0, "AMC", 0.05m },
                    { "ITM-007", 2.4m, "Software", "ggms-oman", 10, "Microsoft 365 Business Basic", 3.5m, 25, "License", 0.05m }
                });

            migrationBuilder.InsertData(
                table: "Quotations",
                columns: new[] { "Id", "Amount", "Customer", "Expires", "LastFollowUp", "Status", "Title", "Vat" },
                values: new object[,]
                {
                    { "QT-OM-2201", 9800m, "KLEEV", "2026-06-28", "1 day ago", "Sent", "IT AMC", 490m },
                    { "QT-OM-2202", 8500m, "Barka Poultry", "2026-07-05", "Today", "Approved", "Server & Firewall Setup", 425m },
                    { "QT-OM-2203", 4200m, "Timberworks", "2026-06-08", "6 days ago", "Expired", "CCTV AMC Support", 210m },
                    { "QT-OM-2204", 3100m, "KLEEV", "2026-07-12", "Not sent", "Draft", "Microsoft 365 migration", 155m }
                });

            migrationBuilder.InsertData(
                table: "Renewals",
                columns: new[] { "Id", "Client", "Due", "Margin", "Status", "Type", "Value" },
                values: new object[,]
                {
                    { 1, "KLEEV", "2026-06-25", 42, "Due 15 days", "Firewall subscription", 1850m },
                    { 2, "Timberworks", "2026-07-09", 16, "Due 30 days", "CCTV AMC", 4200m },
                    { 3, "OneRoad Group", "2026-08-15", 55, "Due 60 days", "Website maintenance", 12000m },
                    { 4, "Al Reem", "2026-06-18", 38, "Due 15 days", "HRMS support", 9000m }
                });

            migrationBuilder.InsertData(
                table: "TimelineEvents",
                columns: new[] { "Id", "Message", "Timestamp" },
                values: new object[,]
                {
                    { 1, "AI identified 3 low-margin jobs needing review.", new DateTime(2026, 7, 6, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9760) },
                    { 2, "KLEEV firewall renewal is due within 15 days.", new DateTime(2026, 7, 6, 12, 16, 7, 38, DateTimeKind.Local).AddTicks(9810) },
                    { 3, "Accounts marked 8 invoices as overdue.", new DateTime(2026, 7, 6, 20, 16, 7, 38, DateTimeKind.Local).AddTicks(9810) },
                    { 4, "Engineer uploaded site photos for CCTV AMC visit.", new DateTime(2026, 7, 6, 23, 16, 7, 38, DateTimeKind.Local).AddTicks(9820) }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsActive", "LastLoginAt", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 7, 7, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9850), "md@ggms.ai", true, null, "$2b$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57Qi1a", "Admin" },
                    { 2, new DateTime(2026, 7, 7, 0, 16, 7, 38, DateTimeKind.Local).AddTicks(9860), "user@ggms.ai", true, null, "$2b$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR57Qi1a", "User" }
                });

            migrationBuilder.InsertData(
                table: "ClientContacts",
                columns: new[] { "Id", "ClientId", "ContactName" },
                values: new object[,]
                {
                    { 1, "kleev", "Operations Manager" },
                    { 2, "kleev", "Finance Lead" },
                    { 3, "timberworks", "Plant Admin" },
                    { 4, "timberworks", "Procurement" },
                    { 5, "salamander", "IT Manager" },
                    { 6, "salamander", "HSE Coordinator" },
                    { 7, "al-badea", "Projects Director" },
                    { 8, "oneroad", "CEO Office" },
                    { 9, "oneroad", "Marketing" },
                    { 10, "barka", "Maintenance Head" },
                    { 11, "al-reem", "Admin Manager" }
                });

            migrationBuilder.InsertData(
                table: "ClientLocations",
                columns: new[] { "Id", "ClientId", "LocationName" },
                values: new object[,]
                {
                    { 1, "kleev", "Muscat HQ" },
                    { 2, "kleev", "Azaiba Warehouse" },
                    { 3, "timberworks", "Barka Factory" },
                    { 4, "salamander", "Dammam Site" },
                    { 5, "al-badea", "Riyadh Office" },
                    { 6, "oneroad", "Dubai" },
                    { 7, "barka", "Barka Farm" },
                    { 8, "al-reem", "Dubai Marina" }
                });

            migrationBuilder.InsertData(
                table: "ClientProjects",
                columns: new[] { "Id", "ClientId", "ProjectName" },
                values: new object[,]
                {
                    { 1, "kleev", "Server & Firewall Setup" },
                    { 2, "kleev", "IT AMC" },
                    { 3, "timberworks", "CCTV AMC Support" },
                    { 4, "salamander", "Access Control Setup" },
                    { 5, "al-badea", "CCTV AMC Support" },
                    { 6, "oneroad", "Website Development" },
                    { 7, "barka", "Server & Firewall Setup" },
                    { 8, "al-reem", "HRMS Software" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientContacts_ClientId",
                table: "ClientContacts",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientLocations_ClientId",
                table: "ClientLocations",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientProjects_ClientId",
                table: "ClientProjects",
                column: "ClientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assets");

            migrationBuilder.DropTable(
                name: "Bills");

            migrationBuilder.DropTable(
                name: "ClientContacts");

            migrationBuilder.DropTable(
                name: "ClientLocations");

            migrationBuilder.DropTable(
                name: "ClientProjects");

            migrationBuilder.DropTable(
                name: "Companies");

            migrationBuilder.DropTable(
                name: "Credentials");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Leads");

            migrationBuilder.DropTable(
                name: "ProductItems");

            migrationBuilder.DropTable(
                name: "Quotations");

            migrationBuilder.DropTable(
                name: "Renewals");

            migrationBuilder.DropTable(
                name: "TimelineEvents");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Clients");
        }
    }
}
