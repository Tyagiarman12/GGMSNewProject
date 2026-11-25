"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Plus, RefreshCw } from "lucide-react";
import type { Company } from "../../data/mock";
import { apiFetch } from "../../lib/api";
import { money } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, Field, Info, SectionTitle } from "../shared/screen-kit";
import { Td, Th } from "../../components/ui/table";

type ExpenseRecord = {
  id: string;
  date: string;
  category: string;
  project: string;
  amount: number;
  vat: number;
  receipt: boolean;
  receiptUrl: string;
  status: string;
};

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const asNumber = (value: string) => Number(value);

export function ExpensesPage({ activeCompany }: { activeCompany: Company }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [category, setCategory] = useState("");
  const [project, setProject] = useState("");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [vat, setVat] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const records = await apiFetch<ExpenseRecord[]>(`api/Expenses?companyId=${encodeURIComponent(activeCompany.id)}`);
      setExpenses(records);
    } catch (error) {
      console.error("Unable to load expenses:", error);
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to load expenses." });
    } finally {
      setLoading(false);
    }
  }, [activeCompany.id]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const createExpense = async () => {
    const total = asNumber(amount);
    const vatAmount = asNumber(vat || "0");
    if (!category.trim() || !date || !Number.isFinite(total) || total <= 0
      || !Number.isFinite(vatAmount) || vatAmount < 0 || vatAmount > total) {
      setFeedback({ type: "error", text: "Enter a category, valid date, positive total, and VAT between zero and the total." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      let uploadedReceiptUrl = "";
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);
        const upload = await apiFetch<{ receiptUrl: string }>("api/Expenses/receipt", {
          method: "POST",
          body: formData
        });
        uploadedReceiptUrl = upload.receiptUrl;
      }
      await apiFetch<ExpenseRecord>("api/Expenses", {
        method: "POST",
        body: JSON.stringify({
          date,
          category: category.trim(),
          project: project.trim() || "Overhead",
          amount: total,
          vat: vatAmount,
          status: "Pending",
          receipt: Boolean(uploadedReceiptUrl),
          receiptUrl: uploadedReceiptUrl,
          companyId: activeCompany.id
        })
      });
      setCategory("");
      setProject("");
      setDate(today());
      setAmount("");
      setVat("");
      setReceiptFile(null);
      setFeedback({ type: "success", text: "Expense submitted for approval." });
      await loadExpenses();
    } catch (error) {
      console.error("Unable to submit expense:", error);
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to submit expense." });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (expense: ExpenseRecord, status: "Approved" | "Rejected" | "Posted") => {
    setSaving(true);
    setFeedback(null);
    try {
      await apiFetch<ExpenseRecord>(`api/Expenses/${encodeURIComponent(expense.id)}/status`, {
        method: "PUT",
        body: JSON.stringify(status)
      });
      setFeedback({ type: "success", text: `Expense ${expense.id} marked ${status.toLowerCase()}.` });
      await loadExpenses();
    } catch (error) {
      console.error("Unable to update expense:", error);
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to update expense." });
    } finally {
      setSaving(false);
    }
  };

  const pendingTotal = expenses.filter((item) => item.status === "Pending").reduce((sum, item) => sum + item.amount, 0);
  const approvedTotal = expenses.filter((item) => item.status === "Approved").reduce((sum, item) => sum + item.amount, 0);
  const postedVat = expenses.filter((item) => item.status === "Posted").reduce((sum, item) => sum + item.vat, 0);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Expenses & Petty Cash"
        subtitle="Submit expenses, review approvals, and post input VAT. Petty cash balances require a configured cash account."
        action={<Button variant="secondary" onClick={() => void loadExpenses()}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />
      {feedback && (
        <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {feedback.text}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Info label="Pending approval" value={money(pendingTotal, activeCompany.currency)} />
        <Info label="Approved to post" value={money(approvedTotal, activeCompany.currency)} />
        <Info label="Posted input VAT" value={money(postedVat, activeCompany.currency)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Submit an expense</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Category" value={category} onChange={setCategory} />
          <Field label="Project (optional)" value={project} onChange={setProject} />
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <Field label={`Total (${activeCompany.currency})`} value={amount} onChange={setAmount} />
          <Field label={`VAT included (${activeCompany.currency})`} value={vat} onChange={setVat} />
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Receipt (optional, PDF/JPEG/PNG)
            <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} className="h-10 rounded-xl border border-slate-200 px-2 py-1 text-xs" />
          </label>
          <Button className="self-end" variant="primary" disabled={saving} onClick={() => void createExpense()}>
            <Plus className="h-4 w-4" /> Submit for approval
          </Button>
        </CardContent>
      </Card>

      <DataTable title="Expense register" action="">
        <thead><tr><Th>ID</Th><Th>Date</Th><Th>Category</Th><Th>Project</Th><Th>Total</Th><Th>VAT</Th><Th>Receipt</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {loading && <tr><Td colSpan={9}>Loading expenses…</Td></tr>}
          {!loading && expenses.map((expense) => (
            <tr key={expense.id}>
              <Td>{expense.id}</Td><Td>{expense.date}</Td><Td>{expense.category}</Td><Td>{expense.project || "Overhead"}</Td>
              <Td>{money(expense.amount, activeCompany.currency)}</Td><Td>{money(expense.vat, activeCompany.currency)}</Td>
              <Td>{expense.receiptUrl ? <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">View <ExternalLink className="h-3 w-3" /></a> : <span className="text-slate-400">Missing</span>}</Td>
              <Td><Badge variant={expense.status === "Posted" ? "success" : expense.status === "Rejected" ? "danger" : expense.status === "Approved" ? "info" : "warning"}>{expense.status}</Badge></Td>
              <Td className="space-x-1 whitespace-nowrap">
                {expense.status === "Pending" && <>
                  <Button size="sm" disabled={saving} onClick={() => void changeStatus(expense, "Approved")}>Approve</Button>
                  <Button size="sm" variant="secondary" disabled={saving} onClick={() => void changeStatus(expense, "Rejected")}>Reject</Button>
                </>}
                {expense.status === "Approved" && <Button size="sm" disabled={saving} onClick={() => void changeStatus(expense, "Posted")}>Post VAT</Button>}
                {expense.status === "Posted" && <span className="text-xs text-slate-500">Posted</span>}
                {expense.status === "Rejected" && <span className="text-xs text-slate-500">Closed</span>}
              </Td>
            </tr>
          ))}
          {!loading && expenses.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-sm text-slate-500">No expenses recorded for this company.</td></tr>}
        </tbody>
      </DataTable>
      <p className="text-xs text-slate-500">Petty cash balance is not displayed until cash account opening balances and movements are tracked.</p>
    </div>
  );
}
