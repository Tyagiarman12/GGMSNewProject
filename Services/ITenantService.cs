using Microsoft.AspNetCore.Http;
using System.Linq;

namespace GGMSNEWPROJECT.Services
{
    public interface ITenantService
    {
        string GetCurrentTenantId();
    }

    public class TenantService : ITenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string GetCurrentTenantId()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                return "ggms-oman";
            }

            // 1. Check HTTP Header: X-Company-ID or X-Tenant-ID
            if (httpContext.Request.Headers.TryGetValue("X-Company-ID", out var headerCompanyId) && !string.IsNullOrWhiteSpace(headerCompanyId))
            {
                var val = headerCompanyId.ToString().Trim();
                if (!string.IsNullOrWhiteSpace(val) && val != "undefined")
                {
                    return val;
                }
            }

            if (httpContext.Request.Headers.TryGetValue("X-Tenant-ID", out var headerTenantId) && !string.IsNullOrWhiteSpace(headerTenantId))
            {
                var val = headerTenantId.ToString().Trim();
                if (!string.IsNullOrWhiteSpace(val) && val != "undefined")
                {
                    return val;
                }
            }

            // 2. Check Query String: ?companyId=...
            if (httpContext.Request.Query.TryGetValue("companyId", out var queryCompanyId) && !string.IsNullOrWhiteSpace(queryCompanyId))
            {
                var val = queryCompanyId.ToString().Trim();
                if (!string.IsNullOrWhiteSpace(val) && val != "undefined")
                {
                    return val;
                }
            }

            // 3. Check User Claims (if authenticated)
            var claimCompanyId = httpContext.User?.Claims?.FirstOrDefault(c => c.Type == "companyId" || c.Type == "tenant_id")?.Value;
            if (!string.IsNullOrWhiteSpace(claimCompanyId) && claimCompanyId != "undefined")
            {
                return claimCompanyId;
            }

            // Fallback default tenant
            return "ggms-oman";
        }
    }
}
