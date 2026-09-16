"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CircleDollarSign, Plus, ReceiptText, TrendingUp } from "lucide-react";
import { KpiCard } from "../../components/command-center";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Td, Th } from "../../components/ui/table";
import { apiFetch } from "../../lib/api";
import { DataTable, Info, SectionTitle } from "../../modules/shared/screen-kit";
import { useCompany } from "../../context/company-context";

export function PayrollPanel() {
  const { formatMoney } = useCompany();
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<any>("api/Employees/payroll")
      .then((data) => {
        if (active) {
          setPayrollData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching payroll data:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  if (loading || !payrollData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-slate-500">Loading payroll data...</span>
      </div>
    );
  }

  const { grossSalary, allowances, deductions, netSalary, payroll } = payrollData;

  const missingIbanList = payroll.filter((employee: any) => employee.iban === "Missing" || !employee.iban);

  return (
    <div className="space-y-6">
      <SectionTitle title="Payroll / WPS" subtitle="Corporate payroll run with validation and configurable export placeholder." />
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Gross salary" value={formatMoney(grossSalary)} icon={<CircleDollarSign className="h-5 w-5" />} tone="info" />
        <KpiCard label="Allowances" value={formatMoney(allowances)} icon={<Plus className="h-5 w-5" />} tone="success" />
        <KpiCard label="Deductions" value={formatMoney(deductions)} icon={<ReceiptText className="h-5 w-5" />} tone="warning" />
        <KpiCard label="Net payroll" value={formatMoney(netSalary)} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Export generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Info label="Selected month" value="June 2026" />
            <Info label="Payroll status" value="Pending approval" />
            <Info label="Export format" value="Payroll CSV / WPS placeholder" />
            <Info label="Validation checks" value="IBAN, bank code, employee ID, salary, approval" />
            <div className="grid gap-2 sm:grid-cols-3">
              <Button>Oman CSV</Button>
              <Button>UAE WPS</Button>
              <Button>Saudi CSV</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pre-export issues</CardTitle>
            <Badge variant={missingIbanList.length ? "warning" : "success"}>{missingIbanList.length ? "Needs review" : "Ready"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {[`${missingIbanList.length} employee missing IBAN`, "June payroll not approved", "Bank-specific SIF format pending connection"].map((issue) => (
              <div key={issue} className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                {issue}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <DataTable title="Payroll run - June 2026" action="Approve payroll">
        <thead><tr><Th>Employee</Th><Th>Bank</Th><Th>Basic</Th><Th>Allowance</Th><Th>Deduction</Th><Th>Net</Th><Th>Status</Th></tr></thead>
        <tbody>
          {payroll.map((row: any) => (
            <tr key={row.id}>
              <Td>{row.name}<span className="block text-xs text-slate-500">{row.department}</span></Td>
              <Td>{row.bank}<span className="block text-xs text-slate-500">{row.iban}</span></Td>
              <Td>{formatMoney(row.salary)}</Td>
              <Td>{formatMoney(row.allowance)}</Td>
              <Td>{formatMoney(row.deduction)}</Td>
              <Td>{formatMoney(row.net)}</Td>
              <Td><Badge variant={row.iban === "Missing" ? "warning" : "success"}>{row.iban === "Missing" ? "Missing IBAN" : "Valid"}</Badge></Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
