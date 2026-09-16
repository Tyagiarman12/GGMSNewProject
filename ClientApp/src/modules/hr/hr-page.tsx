"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { AlertTriangle, CheckCircle2, CircleDollarSign, UserPlus } from "lucide-react";
import { KpiCard } from "../../components/command-center";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Td, Th } from "../../components/ui/table";
import type { Company } from "../../data/mock";
import { money } from "../../lib/utils";
import { DataTable, SectionTitle } from "../../modules/shared/screen-kit";

export function HrPage({ activeCompany }: { activeCompany: Company }) {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<any[]>("api/Employees")
      .then((data) => {
        if (active) {
          setEmployees(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
      });
    return () => { active = false; };
  }, []);

  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const monthlyPayroll = employees.reduce((sum, employee) => sum + employee.salary, 0);
  const missingIban = employees.filter((employee) => employee.iban === "Missing" || !employee.iban).length;

  return (
    <div className="space-y-4">
      <SectionTitle title="HR Lite" subtitle="Employee master, department visibility, bank readiness, and payroll handoff." />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Employees" value={String(employees.length)} icon={<UserPlus className="h-5 w-5" />} tone="info" />
        <KpiCard label="Active employees" value={String(activeCount)} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" />
        <KpiCard label="Monthly payroll" value={money(monthlyPayroll, activeCompany.currency)} icon={<CircleDollarSign className="h-5 w-5" />} tone="warning" />
      </div>
      {missingIban > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-bold text-slate-950">{missingIban} employee needs bank details before payroll export.</p>
              <p className="text-sm text-slate-600">Keep HR updates short: edit bank details, save, payroll becomes export-ready.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <DataTable title="Employee master" action="Add employee">
        <thead><tr><Th>ID</Th><Th>Employee</Th><Th>Role</Th><Th>Department</Th><Th>Salary</Th><Th>Bank</Th><Th>IBAN</Th><Th>Status</Th></tr></thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <Td>{employee.id}</Td>
              <Td><span className="font-semibold text-slate-900">{employee.name}</span></Td>
              <Td>{employee.role}</Td>
              <Td>{employee.department}</Td>
              <Td>{money(employee.salary, activeCompany.currency)}</Td>
              <Td>{employee.bank}</Td>
              <Td>{employee.iban}</Td>
              <Td><Badge variant={employee.status === "Active" ? "success" : "warning"}>{employee.status}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
