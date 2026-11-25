using GGMSNEWPROJECT;
using GGMSNEWPROJECT.Models;
using GGMSNEWPROJECT.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// 1. Add DB Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(connectionString));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// 2. Add Helper Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IBlobService, BlobService>();
builder.Services.AddScoped<IVatScannerService, VatScannerService>();

// 3. Add Controllers (API + View support for SPA proxy)
builder.Services.AddControllersWithViews();

// 4. Configure Authentication: Production (Entra ID) vs. Development (DevAuthHandler)
var tenantId = builder.Configuration["AzureAd:TenantId"];
bool isEntraIdConfigured = !string.IsNullOrEmpty(tenantId) && tenantId != "YOUR-TENANT-ID-HERE";

if (isEntraIdConfigured)
{
    builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration);
}
else
{
    // Local developer authentication fallback
    builder.Services.AddAuthentication("DevAuthScheme")
        .AddScheme<AuthenticationSchemeOptions, DevAuthHandler>("DevAuthScheme", null);
}

// 5. Configure Swagger with JWT Security schema
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "GGMS New Project API", 
        Description = "API endpoints supporting the GGMS Business Control AI frontend dashboards.",
        Version = "v1" 
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {your_token}' in the input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            System.Array.Empty<string>()
        }
    });
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("At least one CORS origin must be configured in Cors:AllowedOrigins.");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Gulf Gadget Solutions API v1");
    c.RoutePrefix = "swagger";
});

// Ensure the local uploads folder is available in development and served statically
string uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});
app.UseRouting();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action=Index}/{id?}");

app.MapControllers();
app.MapFallbackToFile("index.html");

// Ensure the database is created and seeded automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        void AddColumnIfNotExists(string tableName, string columnName, string columnDef)
        {
            var conn = context.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open) conn.Open();
            using var cmd = conn.CreateCommand();

            if (context.Database.ProviderName?.Contains("Sqlite", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                cmd.CommandText = $"PRAGMA table_info('{tableName}');";
                using var reader = cmd.ExecuteReader();
                bool exists = false;
                while (reader.Read())
                {
                    var colName = reader["name"]?.ToString();
                    if (string.Equals(colName, columnName, System.StringComparison.OrdinalIgnoreCase))
                    {
                        exists = true;
                        break;
                    }
                }
                reader.Close();
                if (exists) return;
            }
            else if (context.Database.ProviderName?.Contains("SqlServer", System.StringComparison.OrdinalIgnoreCase) == true)
            {
                cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName AND COLUMN_NAME = @columnName;";
                var tableParameter = cmd.CreateParameter();
                tableParameter.ParameterName = "@tableName";
                tableParameter.Value = tableName;
                cmd.Parameters.Add(tableParameter);
                var columnParameter = cmd.CreateParameter();
                columnParameter.ParameterName = "@columnName";
                columnParameter.Value = columnName;
                cmd.Parameters.Add(columnParameter);
                if (System.Convert.ToInt32(cmd.ExecuteScalar()) > 0) return;
            }
            else
            {
                throw new System.NotSupportedException($"Database provider '{context.Database.ProviderName}' is not supported by schema initialization.");
            }

            using var alterCmd = conn.CreateCommand();
            var providerColumnDef = context.Database.ProviderName?.Contains("SqlServer", System.StringComparison.OrdinalIgnoreCase) == true
                ? columnDef.Replace("TEXT", "NVARCHAR(MAX)", System.StringComparison.OrdinalIgnoreCase)
                : columnDef;
            alterCmd.CommandText = $"ALTER TABLE {tableName} ADD COLUMN {columnName} {providerColumnDef};";
            alterCmd.ExecuteNonQuery();
        }

        AddColumnIfNotExists("Companies", "Address", "TEXT");
        AddColumnIfNotExists("Companies", "Branch", "TEXT");
        AddColumnIfNotExists("Companies", "CrNumber", "TEXT");
        AddColumnIfNotExists("Companies", "ContactNo", "TEXT");
        AddColumnIfNotExists("Companies", "Email", "TEXT");
        AddColumnIfNotExists("Companies", "Website", "TEXT");
        AddColumnIfNotExists("Companies", "LogoUrl", "TEXT");
        AddColumnIfNotExists("Companies", "CountryCode", "TEXT DEFAULT 'OM'");
        AddColumnIfNotExists("Companies", "CurrencyCode", "TEXT DEFAULT 'OMR'");
        AddColumnIfNotExists("Companies", "CurrencySymbol", "TEXT DEFAULT 'OMR'");
        AddColumnIfNotExists("Companies", "CurrencyDecimals", "INTEGER DEFAULT 3");
        AddColumnIfNotExists("Companies", "DefaultVatRate", "REAL DEFAULT 5.0");
        AddColumnIfNotExists("Users", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Users", "AllowedCompanyIds", "TEXT DEFAULT 'ggms-oman,ggms-uae'");
        AddColumnIfNotExists("Users", "Name", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("JournalEntries", "Creator", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("CostCentres", "Creator", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("CostCentres", "ProfitCentreCode", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("ProfitCentres", "Creator", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("Quotations", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Invoices", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Bills", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists(
            "Bills",
            "Vat",
            context.Database.ProviderName?.Contains("SqlServer", System.StringComparison.OrdinalIgnoreCase) == true
                ? "DECIMAL(18,2) NOT NULL DEFAULT 0"
                : "TEXT NOT NULL DEFAULT '0'");
        AddColumnIfNotExists("Bills", "SupplierVat", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("Bills", "InvoiceNumber", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("Bills", "InvoiceDate", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("Bills", "ReceiptUrl", "TEXT NOT NULL DEFAULT ''");
        AddColumnIfNotExists("Employees", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Renewals", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Assets", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("Credentials", "CompanyId", "TEXT DEFAULT 'ggms-oman'");
        AddColumnIfNotExists("TimelineEvents", "CompanyId", "TEXT DEFAULT 'ggms-oman'");

        try
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS EmployeeTasks (
                    Id TEXT NOT NULL PRIMARY KEY,
                    CompanyId TEXT NOT NULL DEFAULT 'ggms-oman',
                    Title TEXT NOT NULL,
                    Description TEXT,
                    AssigneeId TEXT,
                    AssigneeName TEXT,
                    ReporterName TEXT,
                    Status TEXT NOT NULL DEFAULT 'To Do',
                    Priority TEXT NOT NULL DEFAULT 'Medium',
                    TaskType TEXT NOT NULL DEFAULT 'Task',
                    CreatedAt TEXT NOT NULL,
                    DueDate TEXT,
                    CompletedAt TEXT,
                    EstimatedHours REAL NOT NULL DEFAULT 0,
                    LoggedHours REAL NOT NULL DEFAULT 0
                );
            ");
        }
        catch { }

        if (context.Database.ProviderName?.Contains("Sqlite", System.StringComparison.OrdinalIgnoreCase) == true)
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS SupplierPayments (
                    Id TEXT NOT NULL PRIMARY KEY,
                    CompanyId TEXT NOT NULL,
                    BillId TEXT NOT NULL,
                    Supplier TEXT NOT NULL,
                    Amount TEXT NOT NULL,
                    Method TEXT NOT NULL,
                    Reference TEXT NOT NULL,
                    PaymentDate TEXT NOT NULL,
                    Status TEXT NOT NULL
                );
            ");
        }
        else if (context.Database.ProviderName?.Contains("SqlServer", System.StringComparison.OrdinalIgnoreCase) == true)
        {
            context.Database.ExecuteSqlRaw(@"
                IF OBJECT_ID('dbo.SupplierPayments', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.SupplierPayments (
                        Id NVARCHAR(450) NOT NULL PRIMARY KEY,
                        CompanyId NVARCHAR(MAX) NOT NULL,
                        BillId NVARCHAR(MAX) NOT NULL,
                        Supplier NVARCHAR(MAX) NOT NULL,
                        Amount DECIMAL(18,2) NOT NULL,
                        Method NVARCHAR(MAX) NOT NULL,
                        Reference NVARCHAR(MAX) NOT NULL,
                        PaymentDate NVARCHAR(MAX) NOT NULL,
                        Status NVARCHAR(MAX) NOT NULL
                    );
                END
            ");
        }

        try { context.Database.ExecuteSqlRaw("UPDATE Quotations SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Invoices SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Bills SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Clients SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE ProductItems SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Suppliers SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE ProductGroups SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Uoms SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Employees SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Renewals SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Assets SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE Credentials SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("UPDATE TimelineEvents SET CompanyId = 'ggms-oman' WHERE CompanyId IS NULL OR CompanyId = '';"); } catch { }
        try { context.Database.ExecuteSqlRaw("DELETE FROM Companies WHERE Id IN ('pentagram-ksa', 'krativegrowth-uae', 'ggms-dubai-fz', 'ggms-trading-dubai', 'ggms-digital-dubai', 'ggms-realestate-dubai');"); } catch { }
    }
    catch (System.Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating or seeding the database.");
    }
}

app.Run();
