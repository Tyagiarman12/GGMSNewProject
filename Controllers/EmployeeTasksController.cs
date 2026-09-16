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
    public class EmployeeTasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeTasksController(AppDbContext context)
        {
            _context = context;
        }

        private async Task EnsureTableCreatedAsync()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"
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
        }

        // GET: api/EmployeeTasks
        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] string? assigneeId, [FromQuery] string? status, [FromQuery] string? priority)
        {
            await EnsureTableCreatedAsync();

            var query = _context.EmployeeTasks.AsQueryable();

            if (!string.IsNullOrWhiteSpace(assigneeId) && assigneeId != "ALL")
            {
                query = query.Where(t => t.AssigneeId == assigneeId);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                query = query.Where(t => t.Priority == priority);
            }

            var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
            return Ok(tasks);
        }

        // GET: api/EmployeeTasks/TSK-1001
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(string id)
        {
            await EnsureTableCreatedAsync();
            var task = await _context.EmployeeTasks.FindAsync(id);
            if (task == null) return NotFound(new { message = $"Task {id} not found." });
            return Ok(task);
        }

        // POST: api/EmployeeTasks
        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] EmployeeTask task)
        {
            await EnsureTableCreatedAsync();

            if (string.IsNullOrWhiteSpace(task.Title))
            {
                return BadRequest(new { message = "Task title is required." });
            }

            if (string.IsNullOrWhiteSpace(task.CompanyId))
            {
                task.CompanyId = "ggms-oman";
            }

            if (string.IsNullOrWhiteSpace(task.Id))
            {
                string newId;
                do
                {
                    newId = $"TSK-{Random.Shared.Next(1000, 9999)}";
                } while (await _context.EmployeeTasks.AnyAsync(t => t.Id == newId));
                
                task.Id = newId;
            }

            if (string.IsNullOrWhiteSpace(task.Status))
            {
                task.Status = "To Do";
            }

            if (string.IsNullOrWhiteSpace(task.Priority))
            {
                task.Priority = "Medium";
            }

            if (string.IsNullOrWhiteSpace(task.TaskType))
            {
                task.TaskType = "Task";
            }

            // Resolve Assignee Name if AssigneeId provided
            if (!string.IsNullOrWhiteSpace(task.AssigneeId))
            {
                var employee = await _context.Employees.FindAsync(task.AssigneeId);
                if (employee != null)
                {
                    task.AssigneeName = employee.Name;
                }
            }

            if (string.IsNullOrWhiteSpace(task.AssigneeName))
            {
                task.AssigneeName = "Unassigned";
            }

            task.CreatedAt = DateTime.UtcNow;
            if (task.Status == "Completed" && task.CompletedAt == null)
            {
                task.CompletedAt = DateTime.UtcNow;
            }

            _context.EmployeeTasks.Add(task);

            try
            {
                _context.TimelineEvents.Add(new TimelineEvent
                {
                    Timestamp = DateTime.Now,
                    Message = $"New Task Created & Saved to DB: '{task.Title}' assigned to {task.AssigneeName} ({task.Priority} Priority)"
                });
            }
            catch { }

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        // PUT: api/EmployeeTasks/TSK-1001
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(string id, [FromBody] EmployeeTask updatedTask)
        {
            await EnsureTableCreatedAsync();
            var existingTask = await _context.EmployeeTasks.FindAsync(id);
            if (existingTask == null) return NotFound(new { message = $"Task {id} not found." });

            existingTask.Title = updatedTask.Title;
            existingTask.Description = updatedTask.Description;
            existingTask.AssigneeId = updatedTask.AssigneeId;
            existingTask.AssigneeName = updatedTask.AssigneeName;
            existingTask.Status = updatedTask.Status;
            existingTask.Priority = updatedTask.Priority;
            existingTask.TaskType = updatedTask.TaskType;
            existingTask.DueDate = updatedTask.DueDate;
            existingTask.EstimatedHours = updatedTask.EstimatedHours;
            existingTask.LoggedHours = updatedTask.LoggedHours;

            if (updatedTask.Status == "Completed" && existingTask.CompletedAt == null)
            {
                existingTask.CompletedAt = DateTime.UtcNow;
            }
            else if (updatedTask.Status != "Completed")
            {
                existingTask.CompletedAt = null;
            }

            await _context.SaveChangesAsync();
            return Ok(existingTask);
        }

        // PATCH: api/EmployeeTasks/TSK-1001/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(string id, [FromBody] TaskStatusUpdateRequest request)
        {
            await EnsureTableCreatedAsync();
            var task = await _context.EmployeeTasks.FindAsync(id);
            if (task == null) return NotFound(new { message = $"Task {id} not found." });

            task.Status = request.Status;
            if (request.Status == "Completed")
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                task.CompletedAt = null;
            }

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        // DELETE: api/EmployeeTasks/TSK-1001
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            await EnsureTableCreatedAsync();
            var task = await _context.EmployeeTasks.FindAsync(id);
            if (task == null) return NotFound();

            _context.EmployeeTasks.Remove(task);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Task {id} deleted successfully." });
        }

        // GET: api/EmployeeTasks/performance-summary
        [HttpGet("performance-summary")]
        public async Task<IActionResult> GetPerformanceSummary()
        {
            await EnsureTableCreatedAsync();
            var employees = await _context.Employees.ToListAsync();
            var tasks = await _context.EmployeeTasks.ToListAsync();

            var summary = employees.Select(emp =>
            {
                var empTasks = tasks.Where(t => t.AssigneeId == emp.Id || t.AssigneeName == emp.Name).ToList();
                var completed = empTasks.Count(t => t.Status == "Completed");
                var total = empTasks.Count;
                var inProgress = empTasks.Count(t => t.Status == "In Progress");
                var overdue = empTasks.Count(t => t.Status != "Completed" && t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow);

                double productivity = total > 0 
                    ? Math.Min(100, Math.Max(50, Math.Round((double)completed / total * 100))) 
                    : 85;

                return new
                {
                    employeeId = emp.Id,
                    name = emp.Name,
                    role = emp.Role,
                    department = emp.Department,
                    totalTasks = total,
                    completedTasks = completed,
                    inProgressTasks = inProgress,
                    overdueTasks = overdue,
                    productivity = (int)productivity
                };
            });

            return Ok(summary);
        }
    }

    public class TaskStatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
