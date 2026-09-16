using GGMSNEWPROJECT.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _context.Employees.ToListAsync();
            return Ok(employees);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] Employee employee)
        {
            if (string.IsNullOrEmpty(employee.Id))
            {
                employee.Id = $"EMP-{System.Guid.NewGuid().ToString().Substring(0, 3).ToUpper()}";
            }
            if (string.IsNullOrEmpty(employee.Status))
            {
                employee.Status = employee.Iban == "Missing" || string.IsNullOrEmpty(employee.Iban) ? "Needs IBAN" : "Active";
            }

            _context.Employees.Add(employee);
            
            _context.TimelineEvents.Add(new TimelineEvent
            {
                Timestamp = System.DateTime.Now,
                Message = $"HR added new employee: {employee.Name} as {employee.Role} ({employee.Department})"
            });

            await _context.SaveChangesAsync();
            return Ok(employee);
        }

        [HttpGet("performance")]
        public async Task<IActionResult> GetPerformance()
        {
            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.EmployeeTasks.ToListAsync();
            
            var performanceData = employees.Select(e => {
                var empTasks = tasks.Where(t => t.AssigneeId == e.Id || t.AssigneeName == e.Name).ToList();
                int completedCount = empTasks.Count(t => t.Status == "Completed");
                int overdueCount = empTasks.Count(t => t.Status != "Completed" && t.DueDate.HasValue && t.DueDate.Value < System.DateTime.UtcNow);
                int totalCount = empTasks.Count;

                int baseCompleted = e.Name switch {
                    "Abdullah" => 42,
                    "Rizwan" => 31,
                    "Sales Team" => 24,
                    "Accounts" => 38,
                    _ => 29
                };

                int calculatedProductivity = totalCount > 0
                    ? (int)System.Math.Min(100, System.Math.Max(50, System.Math.Round((double)completedCount / totalCount * 100)))
                    : e.Name switch { "Abdullah" => 86, "Rizwan" => 91, "Sales Team" => 63, "Accounts" => 89, _ => 82 };

                return new
                {
                    id = e.Id,
                    name = e.Name,
                    role = e.Role,
                    department = e.Department,
                    completed = baseCompleted + completedCount,
                    overdue = overdueCount,
                    followUp = e.Name switch { "Abdullah" => 88, "Rizwan" => 92, "Sales Team" => 61, "Accounts" => 90, _ => 84 },
                    timesheet = e.Name switch { "Abdullah" => 94, "Rizwan" => 98, "Sales Team" => 80, "Accounts" => 96, _ => 90 },
                    revenue = e.Name switch { "Abdullah" => 18300, "Rizwan" => 24500, "Sales Team" => 11200, "Accounts" => 0, _ => 6400 },
                    productivity = calculatedProductivity
                };
            });

            return Ok(performanceData);
        }

        [HttpGet("payroll")]
        public async Task<IActionResult> GetPayroll()
        {
            var employees = await _context.Employees.ToListAsync();
            
            var payrollList = employees.Select(e =>
            {
                decimal allowance = e.Name switch
                {
                    "Abdullah" => 45.00m,
                    "Rizwan" => 60.00m,
                    _ => 20.00m
                };
                
                decimal deduction = e.Status == "Needs IBAN" ? 0m : 10.00m;
                decimal net = e.Salary + allowance - deduction;

                return new
                {
                    id = e.Id,
                    name = e.Name,
                    role = e.Role,
                    department = e.Department,
                    salary = e.Salary,
                    allowance,
                    deduction,
                    net,
                    bank = e.Bank,
                    iban = e.Iban,
                    status = e.Status
                };
            }).ToList();

            decimal totalGross = payrollList.Sum(p => p.salary);
            int missingIbanCount = payrollList.Count(p => p.iban == "Missing" || string.IsNullOrEmpty(p.iban));

            return Ok(new
            {
                grossSalary = totalGross,
                missingIbanCount,
                payroll = payrollList
            });
        }
    }
}
