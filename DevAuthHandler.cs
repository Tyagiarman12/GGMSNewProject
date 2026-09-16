using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT
{
    public class DevAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public DevAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Set up developer claims with full access rights so that local testing of controllers works out of the box
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, "DeveloperUser"),
                new Claim(ClaimTypes.NameIdentifier, "dev-user-id"),
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim(ClaimTypes.Role, "Sales"),
                new Claim(ClaimTypes.Role, "HR"),
                new Claim(ClaimTypes.Role, "Finance"),
                new Claim(ClaimTypes.Role, "Manager")
            };

            var identity = new ClaimsIdentity(claims, "DevAuthScheme");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "DevAuthScheme");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
