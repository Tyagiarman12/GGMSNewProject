"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, FileText, Plus, ReceiptText, RefreshCw, TrendingUp } from "lucide-react";
import type { Company } from "../../data/mock";
import { apiFetch } from "../../lib/api";
import { money } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable, Field, FlowStep, Info, SectionTitle } from "../shared/screen-kit";
import { Td, Th } from "../../components/ui/table";

type ExpenseRecord = {
  id: string;
  category: string;
  project: string;
  amount: number;
  vat: number;
  status: string;
};

type InvoiceRecord = {
  id: string;
  customer: string;
  amount: number;
  vat: number;
  status: string;
  due?: string;
};

type PaymentRecord = {
  id: string;
  invoiceId: string;
  customer: string;
  amount: number;
  method: string;
  reference: string;
};

const asNumber = (value: unknown) => typeof value === "number" ? value : Number(value) || 0;

export function FinanceFlowPage({ activeCompany }: { activeCompany: Company }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseProject, setExpenseProject] = useState("");
  const [expenseNet, setExpenseNet] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const vatRate = activeCompany.defaultVatRate ?? 5;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseData, invoiceData, paymentData] = await Promise.all([
        apiFetch<any[]>(`api/Expenses?companyId=${encodeURIComponent(activeCompany.id)}`),
        apiFetch<any[]>(`api/Invoices?companyId=${encodeURIComponent(activeCompany.id)}`),
        apiFetch<any[]>(`api/Payments?companyId=${encodeURIComponent(activeCompany.id)}`)
      ]);
      setExpenses((expenseData || []).map((item) => ({
        id: item.id,
        category: item.category || "General expense",
        project: item.project || "Overhead",
        amount: asNumber(item.amount),
        vat: asNumber(item.vat),
        status: item.status || "Pending"
      })));
      setInvoices((invoiceData || []).map((item) => ({
        id: item.id,
        customer: item.customer || "Walk-in customer",
        amount: asNumber(item.amount),
        vat: asNumber(item.vat),
        status: item.status || "Draft"
      })));
      setPayments((paymentData || []).map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        customer: item.customer,
        amount: asNumber(item.amount),
        method: item.method || "Bank transfer",
        reference: item.reference || ""
      })));
    } catch (error) {
      console.error("Error loading finance flow:", error);
      setFeedback("Unable to load Finance Flow data.");
    } finally {
      setLoading(false);
    }
  }, [activeCompany.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalCosts = expenses.filter((item) => item.status === "Posted").reduce((sum, item) => sum + item.amount, 0);
  const totalInputVat = expenses.filter((item) => item.status === "Posted").reduce((sum, item) => sum + item.vat, 0);
  const validInvoices = invoices.filter((item) => !["Draft", "Cancelled", "Void"].includes(item.status));
  const totalOutputVat = validInvoices.reduce((sum, item) => sum + item.vat, 0);
  const paidByInvoice = useMemo(() => payments.reduce<Record<string, number>>((result, payment) => {
    result[payment.invoiceId] = (result[payment.invoiceId] || 0) + payment.amount;
    return result;
  }, {}), [payments]);
  const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
  const receivable = validInvoices.reduce((sum, invoice) => sum + Math.max(invoice.amount - (paidByInvoice[invoice.id] || 0), 0), 0);
  const vatPayable = totalOutputVat - totalInputVat;
  const netProfit = validInvoices.reduce((sum, item) => sum + item.amount - item.vat, 0)
    - expenses.filter((item) => item.status === "Posted").reduce((sum, item) => sum + item.amount - item.vat, 0);

  const runAction = async (action: () => Promise<void>) => {
    setSaving(true);
    setFeedback(null);
    try {
      await action();
      await loadData();
    } catch (error: any) {
      console.error("Finance Flow action failed:", error);
      setFeedback(error?.message || "Finance action failed.");
    } finally {
      setSaving(false);
    }
  };

  const createExpense = () => {
    const netAmount = Number(expenseNet);
    if (!expenseCategory.trim() || !Number.isFinite(netAmount) || netAmount <= 0) {
      setFeedback("Enter an expense category and a positive net amount.");
      return;
    }
    const vatAmount = Math.round(netAmount * vatRate) / 100;
    return runAction(async () => {
      await apiFetch("api/Expenses", {
        method: "POST",
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          category: expenseCategory.trim(),
          amount: Math.round((netAmount + vatAmount) * 1000) / 1000,
          vat: vatAmount,
          status: "Pending",
          receipt: false,
          project: expenseProject.trim() || "Overhead",
          companyId: activeCompany.id
        })
      });
      setExpenseCategory("");
      setExpenseProject("");
      setExpenseNet("");
    });
  };

  const postExpense = (expense: ExpenseRecord) => runAction(async () => {
    await apiFetch(`api/Expenses/${encodeURIComponent(expense.id)}/status`, {
      method: "PUT",
      body: JSON.stringify("Posted")
    });
  });

  const sendInvoice = (invoice: InvoiceRecord) => runAction(async () => {
    await apiFetch(`api/Invoices/${encodeURIComponent(invoice.id)}/status`, {
      method: "PUT",
      body: JSON.stringify("Sent")
    });
  });

  const recordPayment = () => {
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    const balance = Math.max(paymentTarget.amount - (paidByInvoice[paymentTarget.id] || 0), 0);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      setFeedback(`Enter a payment greater than zero and no more than ${money(balance, activeCompany.currency)}.`);
      return;
    }
    return runAction(async () => {
      await apiFetch("api/Payments/customer", {
        method: "POST",
        body: JSON.stringify({
          companyId: activeCompany.id,
          invoiceId: paymentTarget.id,
          amount,
          method: paymentMethod,
          reference: paymentReference.trim()
        })
      });
      setPaymentTarget(null);
      setPaymentAmount("");
      setPaymentReference("");
    });
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading Finance Flow...</div>;
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Finance Flow"
        subtitle="Approve expenses, post VAT, record invoice payments, and monitor balances from Revenue invoices."
        action={<Button variant="secondary" onClick={loadData}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />
      {feedback && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{feedback}</div>}

      <div className="grid gap-3 md:grid-cols-5">
        <FlowStep icon={<ReceiptText className="h-4 w-4" />} label="Expenses" count={expenses.length} />
        <FlowStep icon={<FileText className="h-4 w-4" />} label="Posted VAT" count={expenses.filter((item) => item.status === "Posted").length} />
        <FlowStep icon={<FileText className="h-4 w-4" />} label="Invoices" count={invoices.length} />
        <FlowStep icon={<CircleDollarSign className="h-4 w-4" />} label="Payments" count={payments.length} />
        <FlowStep icon={<TrendingUp className="h-4 w-4" />} label="Operating result" count={Math.round(netProfit)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Create expense</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" value={expenseCategory} onChange={setExpenseCategory} />
            <Field label="Project" value={expenseProject} onChange={setExpenseProject} />
            <Field label={`Net amount (${activeCompany.currency})`} value={expenseNet} onChange={setExpenseNet} />
            <Button className="self-end" variant="primary" disabled={saving} onClick={createExpense}><Plus className="h-4 w-4" /> Add expense</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sales invoices</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">
            Create and issue customer invoices from Revenue → Invoice Builder. Issued invoices appear here for payment tracking.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Info label="Cost incl. VAT" value={money(totalCosts, activeCompany.currency)} />
        <Info label="Input VAT" value={money(totalInputVat, activeCompany.currency)} />
        <Info label="Output VAT" value={money(totalOutputVat, activeCompany.currency)} />
        <Info label="Receivable" value={money(receivable, activeCompany.currency)} />
        <Info label="Net profit" value={money(netProfit, activeCompany.currency)} />
      </div>

      <DataTable title="Expenses" action="">
        <thead><tr><Th>ID</Th><Th>Category</Th><Th>Project</Th><Th>Total</Th><Th>VAT</Th><Th>Status</Th><Th>Action</Th></tr></thead>
        <tbody>
          {expenses.map((expense) => <tr key={expense.id}>
            <Td>{expense.id}</Td><Td>{expense.category}</Td><Td>{expense.project}</Td>
            <Td>{money(expense.amount, activeCompany.currency)}</Td><Td>{money(expense.vat, activeCompany.currency)}</Td>
            <Td><Badge variant={expense.status === "Posted" ? "success" : expense.status === "Rejected" ? "danger" : expense.status === "Approved" ? "info" : "warning"}>{expense.status}</Badge></Td>
            <Td className="space-x-1">
              {expense.status === "Pending" && <>
                <Button size="sm" disabled={saving} onClick={() => runAction(async () => {
                  await apiFetch(`api/Expenses/${encodeURIComponent(expense.id)}/status`, { method: "PUT", body: JSON.stringify("Approved") });
                })}>Approve</Button>
                <Button size="sm" variant="secondary" disabled={saving} onClick={() => runAction(async () => {
                  await apiFetch(`api/Expenses/${encodeURIComponent(expense.id)}/status`, { method: "PUT", body: JSON.stringify("Rejected") });
                })}>Reject</Button>
              </>}
              {expense.status === "Approved" && <Button size="sm" disabled={saving} onClick={() => postExpense(expense)}>Post VAT</Button>}
              {["Posted", "Rejected"].includes(expense.status) && <span className="text-xs text-slate-500">Closed</span>}
            </Td>
          </tr>)}
        </tbody>
      </DataTable>

      <DataTable title="Invoices" action="">
        <thead><tr><Th>ID</Th><Th>Customer</Th><Th>Total</Th><Th>VAT</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {invoices.map((invoice) => {
            const paid = paidByInvoice[invoice.id] || 0;
            const balance = Math.max(invoice.amount - paid, 0);
            return <tr key={invoice.id}>
              <Td>{invoice.id}</Td><Td>{invoice.customer}</Td><Td>{money(invoice.amount, activeCompany.currency)}</Td>
              <Td>{money(invoice.vat, activeCompany.currency)}</Td>
              <Td><Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Sent" || invoice.status === "Partially Paid" ? "info" : "warning"}>{invoice.status}</Badge><span className="ml-2 text-xs text-slate-500">Bal. {money(balance, activeCompany.currency)}</span></Td>
              <Td className="space-x-2">
                <Button size="sm" disabled={saving || invoice.status !== "Draft"} onClick={() => sendInvoice(invoice)}>Send</Button>
                <Button size="sm" disabled={saving || balance <= 0 || invoice.status === "Draft" || invoice.status === "Cancelled" || invoice.status === "Void"} onClick={() => {
                  setPaymentTarget(invoice);
                  setPaymentAmount(balance.toFixed(activeCompany.currencyDecimals ?? 3));
                  setPaymentMethod("Bank transfer");
                  setPaymentReference("");
                }}>Record payment</Button>
              </Td>
            </tr>;
          })}
        </tbody>
      </DataTable>

      <DataTable title="Payments" action="">
        <thead><tr><Th>ID</Th><Th>Invoice</Th><Th>Customer</Th><Th>Amount</Th><Th>Method</Th><Th>Reference</Th></tr></thead>
        <tbody>{payments.map((payment) => <tr key={payment.id}><Td>{payment.id}</Td><Td>{payment.invoiceId}</Td><Td>{payment.customer}</Td><Td>{money(payment.amount, activeCompany.currency)}</Td><Td>{payment.method}</Td><Td>{payment.reference}</Td></tr>)}</tbody>
      </DataTable>

      <Card>
        <CardHeader><CardTitle>Profit and VAT summary</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Info label="Payments received" value={money(totalPaid, activeCompany.currency)} />
          <Info label="Receivables" value={money(receivable, activeCompany.currency)} />
          <Info label="VAT payable/refundable" value={money(vatPayable, activeCompany.currency)} />
          <Info label="Operating result (posted records)" value={money(netProfit, activeCompany.currency)} />
        </CardContent>
      </Card>
      {paymentTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="finance-payment-title">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <h2 id="finance-payment-title" className="text-lg font-bold text-slate-950">Record invoice payment</h2>
              <p className="text-sm text-slate-500">{paymentTarget.id} · {paymentTarget.customer}</p>
            </div>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Amount ({activeCompany.currency})
              <input type="number" min="0.001" step="0.001" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Method
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option>Bank transfer</option><option>Cash</option><option>Card</option><option>Cheque</option>
              </select>
            </label>
            <Field label="Reference" value={paymentReference} onChange={setPaymentReference} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={saving} onClick={() => setPaymentTarget(null)}>Cancel</Button>
              <Button variant="primary" disabled={saving} onClick={() => void recordPayment()}>{saving ? "Saving…" : "Save payment"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
