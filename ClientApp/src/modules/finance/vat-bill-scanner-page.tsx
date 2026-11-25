"use client";

import { useState } from "react";
import { FileScan, Loader2, Upload } from "lucide-react";
import type { Company } from "../../data/mock";
import { apiFetch } from "../../lib/api";
import { money } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Field, SectionTitle } from "../shared/screen-kit";

type ScanResult = {
  supplierName: string;
  supplierVat: string;
  invoiceNumber: string;
  invoiceDate: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  category: string;
  confidence: number;
};

type ScanResponse = {
  scanResult: ScanResult;
  receiptUrl: string;
};

export function VatBillScannerPage({ activeCompany }: { activeCompany: Company }) {
  const [file, setFile] = useState<File | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [project, setProject] = useState("");
  const [due, setDue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  const updateScan = (key: keyof ScanResult, value: string) => {
    if (!scan) return;
    const numericFields: Array<keyof ScanResult> = ["netAmount", "vatAmount", "totalAmount"];
    setScan({
      ...scan,
      scanResult: {
        ...scan.scanResult,
        [key]: numericFields.includes(key) ? Number(value) : value
      }
    });
  };

  const scanBill = async () => {
    if (!file) {
      setFeedback({ type: "error", text: "Choose an invoice or bill file first." });
      return;
    }
    setScanning(true);
    setFeedback(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await apiFetch<ScanResponse>("api/Expenses/scan", { method: "POST", body: formData });
      setScan(result);
      setFeedback({ type: "info", text: "Preview ready. The current OCR service returns sample values, so verify every field before saving." });
    } catch (error) {
      console.error("Bill scan failed:", error);
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to scan bill." });
    } finally {
      setScanning(false);
    }
  };

  const saveReviewedBill = async () => {
    if (!scan) return;
    const { scanResult } = scan;
    if (!scanResult.supplierName.trim() || !scanResult.invoiceNumber.trim()
      || !Number.isFinite(scanResult.netAmount) || !Number.isFinite(scanResult.vatAmount)
      || !Number.isFinite(scanResult.totalAmount) || scanResult.netAmount <= 0
      || scanResult.vatAmount < 0
      || Math.abs(scanResult.netAmount + scanResult.vatAmount - scanResult.totalAmount) > 0.005) {
      setFeedback({ type: "error", text: "Check supplier, invoice number, and amounts. Net plus VAT must equal the total." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await apiFetch("api/Bills/confirm-scan", {
        method: "POST",
        body: JSON.stringify({
          companyId: activeCompany.id,
          supplier: scanResult.supplierName,
          supplierVat: scanResult.supplierVat,
          invoiceNumber: scanResult.invoiceNumber,
          invoiceDate: scanResult.invoiceDate,
          netAmount: scanResult.netAmount,
          vatAmount: scanResult.vatAmount,
          totalAmount: scanResult.totalAmount,
          category: scanResult.category,
          project: project.trim() || "Overhead",
          due,
          receiptUrl: scan.receiptUrl
        })
      });
      setFeedback({ type: "success", text: "Bill and pending expense saved. The expense is ready for approval." });
      setScan(null);
      setFile(null);
      setProject("");
      setDue("");
    } catch (error) {
      console.error("Unable to save reviewed bill:", error);
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Unable to save bill." });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ScanResult, type: "text" | "number" | "date" = "text") => (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      {label}
      <input
        type={type}
        step={type === "number" ? "0.001" : undefined}
        value={scan ? String(scan.scanResult[key] ?? "") : ""}
        onChange={(event) => updateScan(key, event.target.value)}
        className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <SectionTitle title="VAT Bill Scanner" subtitle="Upload a supplier bill, verify extracted values, then save it to payables and expenses." />
      {feedback && <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{feedback.text}</div>}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        OCR is currently a demo provider that returns sample data, not a real extraction. Review and correct all fields before saving.
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileScan className="h-4 w-4" /> Upload supplier document</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-xs font-semibold text-slate-600">
            Invoice or bill (PDF/image)
            <input type="file" accept=".pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="rounded-xl border border-slate-200 p-2 text-sm" />
          </label>
          <Button variant="primary" disabled={scanning || !file} onClick={() => void scanBill()}>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {scanning ? "Scanning…" : "Scan document"}
          </Button>
        </CardContent>
      </Card>
      {scan && (
        <Card>
          <CardHeader><CardTitle>Review extracted details <span className="ml-2 text-xs font-normal text-slate-500">Demo confidence: {scan.scanResult.confidence}%</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {scan.receiptUrl && <a className="text-sm text-blue-700 underline" href={scan.receiptUrl} target="_blank" rel="noreferrer">Open uploaded document</a>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {field("Supplier", "supplierName")}
              {field("Supplier VAT number", "supplierVat")}
              {field("Supplier invoice number", "invoiceNumber")}
              {field("Invoice date", "invoiceDate", "date")}
              {field(`Net amount (${activeCompany.currency})`, "netAmount", "number")}
              {field(`VAT amount (${activeCompany.currency})`, "vatAmount", "number")}
              {field(`Total amount (${activeCompany.currency})`, "totalAmount", "number")}
              {field("Expense category", "category")}
              <Field label="Project (optional)" value={project} onChange={setProject} />
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Payment due date
                <input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
              </label>
            </div>
            <p className="text-sm text-slate-600">
              Expected total: {money(scan.scanResult.netAmount + scan.scanResult.vatAmount, activeCompany.currency)}
            </p>
            <Button variant="primary" disabled={saving} onClick={() => void saveReviewedBill()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save reviewed bill and expense
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
