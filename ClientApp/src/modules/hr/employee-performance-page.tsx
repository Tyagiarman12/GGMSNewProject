"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Gauge,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
  TrendingUp,
  LayoutGrid,
  ListFilter
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Td, Th } from "../../components/ui/table";
import { KpiCard } from "../../components/command-center";
import { DataTable, SectionTitle } from "../../modules/shared/screen-kit";
import { money, percent } from "../../lib/utils";

export interface EmployeeTask {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName: string;
  reporterName: string;
  status: string; // "To Do" | "In Progress" | "In Review" | "Completed" | "Blocked"
  priority: string; // "Low" | "Medium" | "High" | "Urgent"
  taskType: string; // "Task" | "Bug" | "Feature" | "Maintenance"
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours: number;
  loggedHours: number;
}

const DEFAULT_EMPLOYEES = [
  { id: "EMP-001", name: "Abdullah", role: "Engineer", department: "Operations" },
  { id: "EMP-002", name: "Rizwan", role: "Project Manager", department: "Delivery" },
  { id: "EMP-003", name: "Sales Team", role: "Sales", department: "Sales" },
  { id: "EMP-004", name: "Accounts", role: "Accounts", department: "Finance" },
  { id: "EMP-005", name: "Project Coordinator", role: "Coordinator", department: "Delivery" }
];

export const getEmpId = (emp: any): string => emp?.id || emp?.Id || emp?.employeeId || "";
export const getEmpName = (emp: any): string => emp?.name || emp?.Name || "Unnamed Employee";
export const getEmpDept = (emp: any): string => emp?.department || emp?.Department || emp?.role || emp?.Role || "";

export function EmployeePerformancePage({ activeCompany }: { activeCompany: any }) {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [employees, setEmployees] = useState<any[]>(DEFAULT_EMPLOYEES);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "",
    taskType: "Task",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    estimatedHours: "4"
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tasksData, employeesData, perfData] = await Promise.all([
        apiFetch<EmployeeTask[]>("api/EmployeeTasks").catch(() => []),
        apiFetch<any[]>("api/Employees").catch(() => []),
        apiFetch<any[]>("api/Employees/performance").catch(() => [])
      ]);
      setTasks(tasksData || []);
      
      const loadedEmployees = employeesData && employeesData.length > 0 ? employeesData : DEFAULT_EMPLOYEES;
      setEmployees(loadedEmployees);
      setPerformance(perfData || []);
    } catch (err) {
      console.error("Error loading task and performance data:", err);
      setEmployees(DEFAULT_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }

  // Handle Quick Status Transition (Jira Drag/Drop or Dropdown Change)
  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await apiFetch(`api/EmployeeTasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      // Reload performance stats
      const updatedPerf = await apiFetch<any[]>("api/Employees/performance");
      setPerformance(updatedPerf);
    } catch (err) {
      console.error("Failed to update status:", err);
      loadData(); // revert on error
    }
  }

  // Handle Create Task
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      setIsSubmitting(true);
      const activeEmps = employees.length > 0 ? employees : DEFAULT_EMPLOYEES;
      const selectedEmp = activeEmps.find(
        (e) => getEmpId(e) === newTask.assigneeId || getEmpName(e) === newTask.assigneeId
      );
      
      let parsedDueDate: string | null = null;
      if (newTask.dueDate && !isNaN(Date.parse(newTask.dueDate))) {
        parsedDueDate = new Date(newTask.dueDate).toISOString();
      }

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assigneeId: getEmpId(selectedEmp) || newTask.assigneeId || "EMP-001",
        assigneeName: selectedEmp ? getEmpName(selectedEmp) : "Unassigned",
        priority: newTask.priority || "Medium",
        taskType: newTask.taskType || "Task",
        dueDate: parsedDueDate,
        estimatedHours: Number(newTask.estimatedHours) || 0,
        status: "To Do"
      };

      const savedTask = await apiFetch<EmployeeTask>("api/EmployeeTasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Optimistically update tasks list
      if (savedTask && savedTask.id) {
        setTasks((prev) => [savedTask, ...prev.filter((t) => t.id !== savedTask.id)]);
      }

      // Reset form & close modal immediately
      setNewTask({
        title: "",
        description: "",
        assigneeId: "",
        priority: "",
        taskType: "Task",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        estimatedHours: "4"
      });
      setShowCreateModal(false);

      // Refresh full list from DB in background
      loadData();
    } catch (err) {
      console.error("Error creating task:", err);
      alert(`Error saving task: ${(err as Error).message || "Failed to persist to database"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Task
  async function handleDeleteTask(taskId: string) {
    if (!window.confirm(`Are you sure you want to delete task ${taskId}?`)) return;
    try {
      await apiFetch(`api/EmployeeTasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesAssignee = selectedAssignee === "ALL" || t.assigneeId === selectedAssignee || t.assigneeName === selectedAssignee;
    const matchesPriority = selectedPriority === "ALL" || t.priority === selectedPriority;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAssignee && matchesPriority && matchesSearch;
  });

  // Calculate Metrics
  const totalTaskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const avgProductivity =
    performance.length > 0
      ? Math.round(performance.reduce((acc, curr) => acc + (curr.productivity || 0), 0) / performance.length)
      : 88;

  const statuses = ["To Do", "In Progress", "In Review", "Completed"];

  const getPriorityBadgeVariant = (priority: string): "default" | "danger" | "warning" | "success" | "info" => {
    switch (priority) {
      case "Urgent":
        return "danger";
      case "High":
        return "warning";
      case "Medium":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusColumnBorder = (status: string) => {
    switch (status) {
      case "To Do":
        return "border-amber-500/40 bg-amber-950/10";
      case "In Progress":
        return "border-blue-500/40 bg-blue-950/10";
      case "In Review":
        return "border-purple-500/40 bg-purple-950/10";
      case "Completed":
        return "border-emerald-500/40 bg-emerald-950/10";
      default:
        return "border-slate-800 bg-slate-900/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="Employee Performance & Work Items"
          subtitle="Jira-style task tracking, workflow status board, employee assignment, and output scorecards."
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" /> Task List
            </button>
          </div>

          <Button
            variant="primary"
            className="flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total Tasks"
          value={String(totalTaskCount)}
          icon={<Layers className="h-5 w-5" />}
          tone="info"
        />
        <KpiCard
          label="In Progress"
          value={String(inProgressCount)}
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <KpiCard
          label="Completed"
          value={String(completedCount)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
        />
        <KpiCard
          label="Overdue Tasks"
          value={String(overdueCount)}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={overdueCount > 0 ? "Act" : undefined}
          tone={overdueCount > 0 ? "danger" : "info"}
        />
        <KpiCard
          label="Avg Output Score"
          value={percent(avgProductivity)}
          icon={<Gauge className="h-5 w-5" />}
          tone="success"
        />
      </div>

      {/* Control Filter Bar */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks or assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Assignees</option>
                {(employees.length > 0 ? employees : DEFAULT_EMPLOYEES).map((emp, idx) => {
                  const id = getEmpId(emp) || `EMP-${idx}`;
                  const name = getEmpName(emp);
                  const dept = getEmpDept(emp);
                  return (
                    <option key={id} value={id}>
                      {name} {dept ? `(${dept})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Filter Summary */}
            <div className="text-right text-xs text-slate-400">
              Showing <span className="font-bold text-slate-200">{filteredTasks.length}</span> of {tasks.length} work items
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area: Kanban vs List View */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Sparkles className="h-5 w-5 animate-spin text-indigo-400" />
            <span>Loading task board...</span>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        /* Jira-Style Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statuses.map((columnStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === columnStatus);
            return (
              <div
                key={columnStatus}
                className={`flex flex-col gap-3 p-4 rounded-xl border ${getStatusColumnBorder(
                  columnStatus
                )} min-h-[480px] transition-all`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
                      {columnStatus}
                    </h3>
                  </div>
                  <Badge variant="default" className="px-2 py-0.5 text-xs font-semibold">
                    {colTasks.length}
                  </Badge>
                </div>

                {/* Column Task Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No tasks in {columnStatus}
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="bg-slate-900/90 border-slate-800 hover:border-indigo-500/60 transition-all shadow-md group relative"
                      >
                        <CardContent className="p-3.5 space-y-3">
                          {/* Task Top Badges */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                              {task.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                                {task.priority}
                              </Badge>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4 className="font-medium text-slate-100 text-sm leading-snug">
                            {task.title}
                          </h4>

                          {/* Description snippet */}
                          {task.description ? (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          ) : null}

                          {/* Task Metadata Footer */}
                          <div className="pt-2.5 border-t border-slate-800/80 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span className="flex items-center gap-1 font-medium text-slate-300">
                                <User className="h-3 w-3 text-indigo-400" />
                                {task.assigneeName || "Unassigned"}
                              </span>
                              {task.dueDate ? (
                                <span
                                  className={`flex items-center gap-1 text-[11px] ${
                                    new Date(task.dueDate) < new Date() && task.status !== "Completed"
                                      ? "text-rose-400 font-semibold"
                                      : "text-slate-400"
                                  }`}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric"
                                  })}
                                </span>
                              ) : null}
                            </div>

                            {/* Quick Status Transition Dropdown */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                Status
                              </span>
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    Move to {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <DataTable title="All Assigned Tasks" action="Create task" onAction={() => setShowCreateModal(true)}>
          <thead>
            <tr>
              <Th>Task ID</Th>
              <Th>Title</Th>
              <Th>Assignee</Th>
              <Th>Type</Th>
              <Th>Priority</Th>
              <Th>Due Date</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <Td colSpan={8} className="text-center text-slate-500 py-8">
                  No tasks match your filters.
                </Td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <Td className="font-mono text-xs font-bold text-indigo-400">{t.id}</Td>
                  <Td>
                    <div className="font-medium text-slate-100">{t.title}</div>
                    {t.description ? (
                      <div className="text-xs text-slate-400 truncate max-w-xs">{t.description}</div>
                    ) : null}
                  </Td>
                  <Td className="font-medium text-slate-200">{t.assigneeName}</Td>
                  <Td>
                    <Badge variant="default">{t.taskType}</Badge>
                  </Td>
                  <Td>
                    <Badge variant={getPriorityBadgeVariant(t.priority)}>{t.priority}</Badge>
                  </Td>
                  <Td className="text-xs text-slate-300">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}
                  </Td>
                  <Td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      )}

      {/* Employee Performance Breakdown Table */}
      <div className="mt-8 space-y-4">
        <SectionTitle
          title="Employee Performance & Output Scorecard"
          subtitle="Real-time completed tasks, overdue items, and productivity output scores per team member."
        />
        <DataTable title="Team Performance Master" action="Manage team">
          <thead>
            <tr>
              <Th>Employee</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Completed Tasks</Th>
              <Th>Overdue Tasks</Th>
              <Th>Follow-up Rate</Th>
              <Th>Revenue Impact</Th>
              <Th>Output Score</Th>
            </tr>
          </thead>
          <tbody>
            {(performance.length > 0 ? performance : DEFAULT_EMPLOYEES).map((emp, idx) => {
              const name = getEmpName(emp);
              const role = emp.role || emp.Role || "Staff";
              const dept = getEmpDept(emp) || "Delivery";
              return (
                <tr key={name || idx} className="hover:bg-slate-800/40">
                  <Td>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{name}</div>
                  </Td>
                  <Td>{role}</Td>
                  <Td>{dept}</Td>
                  <Td className="font-bold text-emerald-400">{emp.completed ?? 0}</Td>
                  <Td className={(emp.overdue ?? 0) > 0 ? "font-bold text-rose-400" : "text-slate-400"}>
                    {emp.overdue ?? 0}
                  </Td>
                  <Td>{percent(emp.followUp ?? 85)}</Td>
                  <Td>{money(emp.revenue ?? 0, activeCompany?.currency)}</Td>
                  <Td>
                    <Badge variant={(emp.productivity ?? 85) < 70 ? "warning" : "success"}>
                      {percent(emp.productivity ?? 85)}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>

      {/* Create Task Modal */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-lg">Create & Assign Work Item</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Task Summary / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Configure Fortinet Firewall Rules"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, client requirements, or details..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Assign Employee *
                  </label>
                  <select
                    required
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="">-- Select Employee --</option>
                    {(employees.length > 0 ? employees : DEFAULT_EMPLOYEES).map((emp, idx) => {
                      const id = getEmpId(emp) || `EMP-${idx}`;
                      const name = getEmpName(emp);
                      const dept = getEmpDept(emp);
                      return (
                        <option key={id} value={id}>
                          {name} {dept ? `(${dept})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Priority *
                  </label>
                  <select
                    required
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="">-- Select Priority --</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 4"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? "Saving..." : "Create Task"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
