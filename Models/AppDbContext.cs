using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using GGMSNEWPROJECT.Services;

namespace GGMSNEWPROJECT.Models
{
    public class AppDbContext : DbContext
    {
        private readonly ITenantService? _tenantService;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService? tenantService = null) : base(options)
        {
            _tenantService = tenantService;
        }

        public string CurrentCompanyId => _tenantService?.GetCurrentTenantId() ?? "ggms-oman";

        public DbSet<Company> Companies { get; set; } = null!;
        public DbSet<Client> Clients { get; set; } = null!;
        public DbSet<ClientContact> ClientContacts { get; set; } = null!;
        public DbSet<ClientLocation> ClientLocations { get; set; } = null!;
        public DbSet<ClientProject> ClientProjects { get; set; } = null!;
        public DbSet<Lead> Leads { get; set; } = null!;
        public DbSet<Quotation> Quotations { get; set; } = null!;
        public DbSet<ProductItem> ProductItems { get; set; } = null!;
        public DbSet<Uom> Uoms { get; set; } = null!;
        public DbSet<ProductGroup> ProductGroups { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<Bill> Bills { get; set; } = null!;
        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<EmployeeTask> EmployeeTasks { get; set; } = null!;
        public DbSet<Expense> Expenses { get; set; } = null!;
        public DbSet<CustomerPayment> CustomerPayments { get; set; } = null!;
        public DbSet<SupplierPayment> SupplierPayments { get; set; } = null!;
        public DbSet<Renewal> Renewals { get; set; } = null!;
        public DbSet<Asset> Assets { get; set; } = null!;
        public DbSet<Credential> Credentials { get; set; } = null!;
        public DbSet<TimelineEvent> TimelineEvents { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Supplier> Suppliers { get; set; } = null!;
        public DbSet<PurchaseEnquiry> PurchaseEnquiries { get; set; } = null!;
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
        public DbSet<Ledger> Ledgers { get; set; } = null!;
        public DbSet<EntryType> EntryTypes { get; set; } = null!;
        public DbSet<CostCentre> CostCentres { get; set; } = null!;
        public DbSet<ProfitCentre> ProfitCentres { get; set; } = null!;
        public DbSet<JournalEntry> JournalEntries { get; set; } = null!;
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; } = null!;

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var companyId = CurrentCompanyId;
            if (!string.IsNullOrWhiteSpace(companyId) && companyId != "all")
            {
                foreach (var entry in ChangeTracker.Entries<ITenantScoped>())
                {
                    if (entry.State == EntityState.Added && string.IsNullOrWhiteSpace(entry.Entity.CompanyId))
                    {
                        entry.Entity.CompanyId = companyId;
                    }
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Global Multi-Tenant Query Filter for ITenantScoped entities
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
                {
                    var parameter = Expression.Parameter(entityType.ClrType, "e");
                    var property = Expression.Property(parameter, nameof(ITenantScoped.CompanyId));
                    var tenantIdProperty = Expression.Property(Expression.Constant(this), nameof(CurrentCompanyId));

                    var allConstant = Expression.Constant("all");
                    var isAllCondition = Expression.Equal(tenantIdProperty, allConstant);
                    var isEqualCondition = Expression.Equal(property, tenantIdProperty);

                    var body = Expression.OrElse(isAllCondition, isEqualCondition);
                    var lambda = Expression.Lambda(body, parameter);

                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                }
            }

            // Configure primary keys and relations if necessary
            modelBuilder.Entity<Client>()
                .HasMany(c => c.Contacts)
                .WithOne()
                .HasForeignKey(cc => cc.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Client>()
                .HasMany(c => c.Locations)
                .WithOne()
                .HasForeignKey(cl => cl.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Client>()
                .HasMany(c => c.Projects)
                .WithOne()
                .HasForeignKey(cp => cp.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Base Company
            modelBuilder.Entity<Company>().HasData(
                new Company { Id = "ggms-oman", Name = "GGMS Global IT Solutions SPC", Country = "Oman", CountryCode = "OM", Currency = "OMR", CurrencyCode = "OMR", CurrencySymbol = "OMR", CurrencyDecimals = 3, DefaultVatRate = 5.0m, TaxNumber = "OM11023891", CrNumber = "CR-1049281", Branch = "Muscat Main HQ", Address = "Building 42, Street 19, Al Khuwair, Muscat, Sultanate of Oman", ContactNo = "+968 2449 0011", Email = "billing@ggms.om", Website = "https://www.ggms.om", Profit = 18420 }
            );

            // Seed Clients
            modelBuilder.Entity<Client>().HasData(
                new Client { Id = "kleev", Name = "KLEEV", CompanyId = "ggms-oman", Industry = "Retail", Profitability = 34, OpenTasks = 8, InvoicesDue = 2, Notes = "High-value managed IT account with firewall renewal due this quarter.", VatNumber = "OM110022334", Email = "info@kleev.com", ContactPersonName = "John Operations", ContactPersonNumber = "+96899112233" },
                new Client { Id = "timberworks", Name = "Timberworks", CompanyId = "ggms-oman", Industry = "Manufacturing", Profitability = 18, OpenTasks = 5, InvoicesDue = 1, Notes = "AMC usage is above expected visit consumption. Watch margin.", VatNumber = "OM110022335", Email = "procure@timberworks.com", ContactPersonName = "Ahmed Procure", ContactPersonNumber = "+96899445566" },
                new Client { Id = "salamander", Name = "Salamander Oil & Gas", CompanyId = "ggms-oman", Industry = "Oil & Gas", Profitability = 41, OpenTasks = 4, InvoicesDue = 0, Notes = "Security project on track, pending final site acceptance.", VatNumber = "OM110022337", Email = "security@salamander.com", ContactPersonName = "Salim HSE", ContactPersonNumber = "+96899554433" },
                new Client { Id = "al-badea", Name = "Al Badea National", CompanyId = "ggms-oman", Industry = "Construction", Profitability = 22, OpenTasks = 9, InvoicesDue = 3, Notes = "Receivables need management attention.", VatNumber = "OM110022338", Email = "projects@albadea.com", ContactPersonName = "Tariq Projects", ContactPersonNumber = "+96899887766" },
                new Client { Id = "oneroad", Name = "OneRoad Group", CompanyId = "ggms-oman", Industry = "Logistics", Profitability = 48, OpenTasks = 6, InvoicesDue = 1, Notes = "Website phase 2 proposal ready for follow-up.", VatNumber = "OM110022339", Email = "ceo@oneroad.com", ContactPersonName = "Mazin CEO Office", ContactPersonNumber = "+96899223344" },
                new Client { Id = "barka", Name = "Barka Poultry", CompanyId = "ggms-oman", Industry = "Food Production", Profitability = 29, OpenTasks = 3, InvoicesDue = 1, Notes = "Warranty expiry coming for UPS and NAS.", VatNumber = "OM110022336", Email = "contact@barkapoultry.com", ContactPersonName = "Said Maintenance", ContactPersonNumber = "+96899778899" },
                new Client { Id = "al-reem", Name = "Al Reem", CompanyId = "ggms-oman", Industry = "Real Estate", Profitability = 37, OpenTasks = 11, InvoicesDue = 2, Notes = "HRMS payroll export configuration pending.", VatNumber = "OM110022340", Email = "admin@alreem.ae", ContactPersonName = "Fatma Admin", ContactPersonNumber = "+971509988776" }
            );

            // Seed Suppliers
            modelBuilder.Entity<Supplier>().HasData(
                new Supplier { Id = "muscat-tech", Name = "Muscat Technical Trading LLC", CompanyId = "ggms-oman", VatNumber = "OM550099881", Email = "sales@muscattech.om", ContactPersonName = "Salim Sales", ContactPersonNumber = "+96899221100", Category = "IT Hardware", Notes = "Local distributor for network switches and cabling accessories.", ActiveOrders = 2, BillsDue = 1 },
                new Supplier { Id = "oman-net", Name = "Oman Network Supplies", CompanyId = "ggms-oman", VatNumber = "OM550099882", Email = "support@omannet.om", ContactPersonName = "Fatma Support", ContactPersonNumber = "+96899334455", Category = "Cabling", Notes = "Main supplier for Cat6 box and fiber patch panels.", ActiveOrders = 1, BillsDue = 1 },
                new Supplier { Id = "cloud-lic", Name = "Cloud License Distributor", CompanyId = "ggms-oman", VatNumber = "OM550099883", Email = "billing@cloudlic.com", ContactPersonName = "George Billing", ContactPersonNumber = "+971501234567", Category = "Software", Notes = "Microsoft 365 and cloud subscription provider.", ActiveOrders = 3, BillsDue = 1 }
            );

            // Seed Client Contacts
            modelBuilder.Entity<ClientContact>().HasData(
                new ClientContact { Id = 1, ClientId = "kleev", ContactName = "Operations Manager" },
                new ClientContact { Id = 2, ClientId = "kleev", ContactName = "Finance Lead" },
                new ClientContact { Id = 3, ClientId = "timberworks", ContactName = "Plant Admin" },
                new ClientContact { Id = 4, ClientId = "timberworks", ContactName = "Procurement" },
                new ClientContact { Id = 5, ClientId = "salamander", ContactName = "IT Manager" },
                new ClientContact { Id = 6, ClientId = "salamander", ContactName = "HSE Coordinator" },
                new ClientContact { Id = 7, ClientId = "al-badea", ContactName = "Projects Director" },
                new ClientContact { Id = 8, ClientId = "oneroad", ContactName = "CEO Office" },
                new ClientContact { Id = 9, ClientId = "oneroad", ContactName = "Marketing" },
                new ClientContact { Id = 10, ClientId = "barka", ContactName = "Maintenance Head" },
                new ClientContact { Id = 11, ClientId = "al-reem", ContactName = "Admin Manager" }
            );

            // Seed Client Locations
            modelBuilder.Entity<ClientLocation>().HasData(
                new ClientLocation { Id = 1, ClientId = "kleev", LocationName = "Muscat HQ" },
                new ClientLocation { Id = 2, ClientId = "kleev", LocationName = "Azaiba Warehouse" },
                new ClientLocation { Id = 3, ClientId = "timberworks", LocationName = "Barka Factory" },
                new ClientLocation { Id = 4, ClientId = "salamander", LocationName = "Dammam Site" },
                new ClientLocation { Id = 5, ClientId = "al-badea", LocationName = "Riyadh Office" },
                new ClientLocation { Id = 6, ClientId = "oneroad", LocationName = "Dubai" },
                new ClientLocation { Id = 7, ClientId = "barka", LocationName = "Barka Farm" },
                new ClientLocation { Id = 8, ClientId = "al-reem", LocationName = "Dubai Marina" }
            );

            // Seed Client Projects
            modelBuilder.Entity<ClientProject>().HasData(
                new ClientProject { Id = 1, ClientId = "kleev", ProjectName = "Server & Firewall Setup" },
                new ClientProject { Id = 2, ClientId = "kleev", ProjectName = "IT AMC" },
                new ClientProject { Id = 3, ClientId = "timberworks", ProjectName = "CCTV AMC Support" },
                new ClientProject { Id = 4, ClientId = "salamander", ProjectName = "Access Control Setup" },
                new ClientProject { Id = 5, ClientId = "al-badea", ProjectName = "CCTV AMC Support" },
                new ClientProject { Id = 6, ClientId = "oneroad", ProjectName = "Website Development" },
                new ClientProject { Id = 7, ClientId = "barka", ProjectName = "Server & Firewall Setup" },
                new ClientProject { Id = 8, ClientId = "al-reem", ProjectName = "HRMS Software" }
            );

            // Seed Leads
            modelBuilder.Entity<Lead>().HasData(
                new Lead { Id = "LEAD-OM-101", CompanyId = "ggms-oman", ClientName = "KLEEV", Contact = "Operations Manager", Requirement = "Firewall renewal and IT AMC", Value = 9800, Status = "Hot", Owner = "Sales", NextFollowUp = "Today" },
                new Lead { Id = "LEAD-OM-102", CompanyId = "ggms-oman", ClientName = "Barka Poultry", Contact = "Maintenance Head", Requirement = "Server & Firewall Setup", Value = 8500, Status = "Qualified", Owner = "Manager", NextFollowUp = "Tomorrow" },
                new Lead { Id = "LEAD-OM-103", CompanyId = "ggms-oman", ClientName = "Timberworks", Contact = "Plant Admin", Requirement = "CCTV AMC Support", Value = 4200, Status = "Follow-up", Owner = "Sales", NextFollowUp = "Overdue" },
                new Lead { Id = "LEAD-OM-104", CompanyId = "ggms-oman", ClientName = "Al Badea National", Contact = "Projects Director", Requirement = "Access point upgrade", Value = 2600, Status = "New", Owner = "Engineer", NextFollowUp = "2026-06-18" }
            );

            // Seed Quotations
            modelBuilder.Entity<Quotation>().HasData(
                new Quotation { Id = "QT-OM-2201", CompanyId = "ggms-oman", Customer = "KLEEV", Title = "IT AMC", Amount = 9800, Vat = 490, Status = "Sent", Expires = "2026-06-28", LastFollowUp = "1 day ago" },
                new Quotation { Id = "QT-OM-2202", CompanyId = "ggms-oman", Customer = "Barka Poultry", Title = "Server & Firewall Setup", Amount = 8500, Vat = 425, Status = "Approved", Expires = "2026-07-05", LastFollowUp = "Today" },
                new Quotation { Id = "QT-OM-2203", CompanyId = "ggms-oman", Customer = "Timberworks", Title = "CCTV AMC Support", Amount = 4200, Vat = 210, Status = "Expired", Expires = "2026-06-08", LastFollowUp = "6 days ago" },
                new Quotation { Id = "QT-OM-2204", CompanyId = "ggms-oman", Customer = "KLEEV", Title = "Microsoft 365 migration", Amount = 3100, Vat = 155, Status = "Draft", Expires = "2026-07-12", LastFollowUp = "Not sent" }
            );

            // Seed Uoms
            modelBuilder.Entity<Uom>().HasData(
                new Uom { Id = 1, Name = "Pcs", Description = "Pieces", CompanyId = "ggms-oman" },
                new Uom { Id = 2, Name = "Meter", Description = "Meters", CompanyId = "ggms-oman" },
                new Uom { Id = 3, Name = "Box", Description = "Boxes", CompanyId = "ggms-oman" },
                new Uom { Id = 4, Name = "Kg", Description = "Kilograms", CompanyId = "ggms-oman" },
                new Uom { Id = 5, Name = "Set", Description = "Sets", CompanyId = "ggms-oman" },
                new Uom { Id = 6, Name = "Roll", Description = "Rolls", CompanyId = "ggms-oman" }
            );

            // Seed ProductGroups
            modelBuilder.Entity<ProductGroup>().HasData(
                new ProductGroup { Id = 1, Name = "CCTV", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 2, Name = "Storage", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 3, Name = "Cable", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 4, Name = "IT Service", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 5, Name = "AMC", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 6, Name = "Software", VatPercentage = 5.0m, CompanyId = "ggms-oman" },
                new ProductGroup { Id = 7, Name = "Exempt Items", VatPercentage = 0.0m, CompanyId = "ggms-oman" }
            );

            // Seed ProductItems
            modelBuilder.Entity<ProductItem>().HasData(
                new ProductItem { Id = "ITM-001", CompanyId = "ggms-oman", Name = "Hikvision 4MP IP Camera", Type = "Product", Category = "CCTV", Barcode = "008562011991", Uom = "Pcs", ProductGroupId = 1, BuyPrice = 28, SellPrice = 48, Stock = 12, MinStock = 5, VatRate = 0.05m },
                new ProductItem { Id = "ITM-002", CompanyId = "ggms-oman", Name = "8 Channel NVR", Type = "Product", Category = "CCTV", Barcode = "181800007719", Uom = "Pcs", ProductGroupId = 1, BuyPrice = 85, SellPrice = 135, Stock = 4, MinStock = 2, VatRate = 0.05m },
                new ProductItem { Id = "ITM-003", CompanyId = "ggms-oman", Name = "1TB Surveillance HDD", Type = "Product", Category = "Storage", Barcode = "209918273645", Uom = "Pcs", ProductGroupId = 2, BuyPrice = 22, SellPrice = 38, Stock = 8, MinStock = 4, VatRate = 0.05m },
                new ProductItem { Id = "ITM-004", CompanyId = "ggms-oman", Name = "Cat6 Cable Box", Type = "Product", Category = "Cable", Barcode = "301928374650", Uom = "Box", ProductGroupId = 3, BuyPrice = 32, SellPrice = 55, Stock = 3, MinStock = 4, VatRate = 0.05m },
                new ProductItem { Id = "ITM-005", CompanyId = "ggms-oman", Name = "Firewall Configuration Service", Type = "Service", Category = "IT Service", Barcode = "402837465019", Uom = "Set", ProductGroupId = 4, BuyPrice = 0, SellPrice = 180, Stock = 0, MinStock = 0, VatRate = 0.05m },
                new ProductItem { Id = "ITM-006", CompanyId = "ggms-oman", Name = "IT AMC Monthly Plan", Type = "AMC", Category = "AMC", Barcode = "503746501928", Uom = "Set", ProductGroupId = 5, BuyPrice = 120, SellPrice = 320, Stock = 0, MinStock = 0, VatRate = 0.05m },
                new ProductItem { Id = "ITM-007", CompanyId = "ggms-oman", Name = "Microsoft 365 Business Basic", Type = "License", Category = "Software", Barcode = "604650192837", Uom = "Pcs", ProductGroupId = 6, BuyPrice = 2.4m, SellPrice = 3.5m, Stock = 25, MinStock = 10, VatRate = 0.05m }
            );

            // Seed Invoices
            modelBuilder.Entity<Invoice>().HasData(
                new Invoice { Id = "INV-3028", Customer = "KLEEV", Amount = 1850, Due = "2026-06-18", Status = "Overdue" },
                new Invoice { Id = "INV-3031", Customer = "Timberworks", Amount = 4200, Due = "2026-06-25", Status = "Due" },
                new Invoice { Id = "INV-3036", Customer = "Barka Poultry", Amount = 8925, Due = "2026-07-05", Status = "Open" }
            );

            // Seed Bills (Payables)
            modelBuilder.Entity<Bill>().HasData(
                new Bill { Id = "BILL-771", Supplier = "Muscat Technical Trading LLC", Amount = 134.10m, Due = "2026-06-20", Status = "To Pay" },
                new Bill { Id = "BILL-774", Supplier = "Oman Network Supplies", Amount = 690m, Due = "2026-06-28", Status = "To Pay" },
                new Bill { Id = "BILL-779", Supplier = "Cloud License Distributor", Amount = 420m, Due = "2026-07-02", Status = "Scheduled" }
            );

            // Seed Employees
            modelBuilder.Entity<Employee>().HasData(
                new Employee { Id = "EMP-001", Name = "Abdullah", Role = "Engineer", Department = "Operations", Salary = 650, Bank = "Bank Muscat", Iban = "OM12BMUS000000001", Status = "Active" },
                new Employee { Id = "EMP-002", Name = "Rizwan", Role = "Project Manager", Department = "Delivery", Salary = 850, Bank = "Sohar International", Iban = "OM44SOIB000000002", Status = "Active" },
                new Employee { Id = "EMP-003", Name = "Sales Team", Role = "Sales", Department = "Sales", Salary = 700, Bank = "Bank Muscat", Iban = "Missing", Status = "Needs IBAN" },
                new Employee { Id = "EMP-004", Name = "Accounts", Role = "Accounts", Department = "Finance", Salary = 600, Bank = "NBO", Iban = "OM77NBOB000000004", Status = "Active" },
                new Employee { Id = "EMP-005", Name = "Project Coordinator", Role = "Coordinator", Department = "Delivery", Salary = 500, Bank = "Bank Dhofar", Iban = "OM55BDOF000000005", Status = "Active" }
            );

            // Seed Expenses
            modelBuilder.Entity<Expense>().HasData(
                new Expense { Id = "EXP-1042", Date = "2026-06-04", CompanyId = "ggms-oman", Category = "Fuel", Amount = 34.50m, Vat = 1.64m, Status = "Pending", Receipt = true, ReceiptUrl = "/placeholder-receipt1.pdf", Project = "CCTV AMC Support" },
                new Expense { Id = "EXP-1043", Date = "2026-06-05", CompanyId = "ggms-oman", Category = "Cable", Amount = 128m, Vat = 6.10m, Status = "Approved", Receipt = true, ReceiptUrl = "/placeholder-receipt2.pdf", Project = "Server & Firewall Setup" },
                new Expense { Id = "EXP-1044", Date = "2026-06-06", CompanyId = "pentagram-ksa", Category = "Emergency purchase", Amount = 875m, Vat = 114.13m, Status = "Pending", Receipt = false, ReceiptUrl = "", Project = "Access Control Setup" },
                new Expense { Id = "EXP-1045", Date = "2026-06-07", CompanyId = "krativegrowth-uae", Category = "Courier", Amount = 90m, Vat = 4.29m, Status = "Rejected", Receipt = true, ReceiptUrl = "/placeholder-receipt3.pdf", Project = "HRMS Software" }
            );

            // Seed Renewals
            modelBuilder.Entity<Renewal>().HasData(
                new Renewal { Id = 1, Client = "KLEEV", Type = "Firewall subscription", Due = "2026-06-25", Value = 1850, Status = "Due 15 days", Margin = 42 },
                new Renewal { Id = 2, Client = "Timberworks", Type = "CCTV AMC", Due = "2026-07-09", Value = 4200, Status = "Due 30 days", Margin = 16 },
                new Renewal { Id = 3, Client = "OneRoad Group", Type = "Website maintenance", Due = "2026-08-15", Value = 12000, Status = "Due 60 days", Margin = 55 },
                new Renewal { Id = 4, Client = "Al Reem", Type = "HRMS support", Due = "2026-06-18", Value = 9000, Status = "Due 15 days", Margin = 38 }
            );

            // Seed Assets
            modelBuilder.Entity<Asset>().HasData(
                new Asset { Code = "AST-OM-0009", Client = "KLEEV", Category = "Firewall", Brand = "Fortinet", Warranty = "2026-07-12", Location = "Muscat HQ", Status = "Warranty expiring" },
                new Asset { Code = "AST-OM-0014", Client = "Barka Poultry", Category = "NAS", Brand = "Synology", Warranty = "2026-06-28", Location = "Barka Farm", Status = "Warranty expiring" },
                new Asset { Code = "AST-SA-0031", Client = "Salamander Oil & Gas", Category = "Access Control", Brand = "Hikvision", Warranty = "2027-01-10", Location = "Dammam Site", Status = "Healthy" },
                new Asset { Code = "AST-AE-0022", Client = "Al Reem", Category = "License", Brand = "Microsoft 365", Warranty = "2026-06-30", Location = "Cloud", Status = "License expiring" }
            );

            // Seed Credentials
            modelBuilder.Entity<Credential>().HasData(
                new Credential { Id = 1, Name = "Firewall admin", Username = "admin", Password = "FortiPassword123!" },
                new Credential { Id = 2, Name = "Microsoft 365 tenant", Username = "globaladmin@kleev.onmicrosoft.com", Password = "M365TenantSecret!" },
                new Credential { Id = 3, Name = "CCTV NVR", Username = "admin", Password = "NvrPassword456!" },
                new Credential { Id = 4, Name = "Cloud backup", Username = "backup_agent", Password = "AzureStorageBackupKey789!" }
            );

            // Seed Timeline Events
            modelBuilder.Entity<TimelineEvent>().HasData(
                new TimelineEvent { Id = 1, Timestamp = DateTime.Now.AddDays(-1), Message = "AI identified 3 low-margin jobs needing review." },
                new TimelineEvent { Id = 2, Timestamp = DateTime.Now.AddHours(-12), Message = "KLEEV firewall renewal is due within 15 days." },
                new TimelineEvent { Id = 3, Timestamp = DateTime.Now.AddHours(-4), Message = "Accounts marked 8 invoices as overdue." },
                new TimelineEvent { Id = 4, Timestamp = DateTime.Now.AddHours(-1), Message = "Engineer uploaded site photos for CCTV AMC visit." }
            );

            // Seed EmployeeTasks
            modelBuilder.Entity<EmployeeTask>().HasData(
                new EmployeeTask { Id = "TSK-1001", CompanyId = "ggms-oman", Title = "Configure Fortinet Firewall Policies", Description = "Setup outbound rules & VPN user access for KLEEV project site.", AssigneeId = "EMP-001", AssigneeName = "Abdullah", ReporterName = "Rizwan", Status = "In Progress", Priority = "High", TaskType = "Task", EstimatedHours = 6, LoggedHours = 4, CreatedAt = DateTime.UtcNow.AddDays(-3), DueDate = DateTime.UtcNow.AddDays(2) },
                new EmployeeTask { Id = "TSK-1002", CompanyId = "ggms-oman", Title = "Inspect CCTV Camera Rack Connections", Description = "Conduct physical cabling check and test NVR channel feeds at Barka Poultry.", AssigneeId = "EMP-001", AssigneeName = "Abdullah", ReporterName = "Rizwan", Status = "Completed", Priority = "Medium", TaskType = "Maintenance", EstimatedHours = 4, LoggedHours = 4, CreatedAt = DateTime.UtcNow.AddDays(-5), DueDate = DateTime.UtcNow.AddDays(-1), CompletedAt = DateTime.UtcNow.AddDays(-1) },
                new EmployeeTask { Id = "TSK-1003", CompanyId = "ggms-oman", Title = "Prepare Project Delivery Milestones", Description = "Draft project timeline gantt chart & resource allocation for Timberworks project.", AssigneeId = "EMP-002", AssigneeName = "Rizwan", ReporterName = "Management", Status = "In Progress", Priority = "Urgent", TaskType = "Feature", EstimatedHours = 8, LoggedHours = 5, CreatedAt = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(1) },
                new EmployeeTask { Id = "TSK-1004", CompanyId = "ggms-oman", Title = "Client Sales Pitch Follow-up", Description = "Call OneRoad Group procurement manager for AMC proposal feedback.", AssigneeId = "EMP-003", AssigneeName = "Sales Team", ReporterName = "Management", Status = "To Do", Priority = "High", TaskType = "Task", EstimatedHours = 3, LoggedHours = 0, CreatedAt = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(3) },
                new EmployeeTask { Id = "TSK-1005", CompanyId = "ggms-oman", Title = "Reconcile Outstanding Invoices for Q2", Description = "Perform bank statement matching against overdue customer payments.", AssigneeId = "EMP-004", AssigneeName = "Accounts", ReporterName = "Management", Status = "In Review", Priority = "Medium", TaskType = "Task", EstimatedHours = 5, LoggedHours = 4, CreatedAt = DateTime.UtcNow.AddDays(-4), DueDate = DateTime.UtcNow.AddDays(2) },
                new EmployeeTask { Id = "TSK-1006", CompanyId = "ggms-oman", Title = "Setup M365 Business Basic Users", Description = "Provision 25 user licenses and sync domain MX records for Al Reem.", AssigneeId = "EMP-005", AssigneeName = "Project Coordinator", ReporterName = "Rizwan", Status = "To Do", Priority = "Low", TaskType = "Task", EstimatedHours = 4, LoggedHours = 0, CreatedAt = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(4) }
            );

            // Seed Test Users
            // Password: demo1234 (bcrypt hash generated with cost factor 11)
            // These are valid bcrypt hashes - you can verify with any bcrypt tool
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Email = "md@ggms.ai", PasswordHash = "$2a$11$wCDVEmvOxkEpHvDf5Uaxg.MA.qmxLQ3hO50RxRdp5e50h1ZHi9vAa", Role = "Admin", IsActive = true, CreatedAt = DateTime.Now },
                new User { Id = 2, Email = "user@ggms.ai", PasswordHash = "$2a$11$wCDVEmvOxkEpHvDf5Uaxg.MA.qmxLQ3hO50RxRdp5e50h1ZHi9vAa", Role = "User", IsActive = true, CreatedAt = DateTime.Now }
            );
        }
    }
}
