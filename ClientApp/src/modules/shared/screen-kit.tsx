import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  DatabaseZap,
  FileScan,
  FileSpreadsheet,
  HardDrive,
  Landmark,
  Layers,
  LockKeyhole,
  NotepadText,
  Plus,
  ReceiptText,
  ShoppingCart,
  Users,
  UserCheck,
  X
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table } from "../../components/ui/table";

function getTitleMeta(title: string) {
  const t = title.toLowerCase();
  if (t.includes("client")) return { icon: Users, accent: "border-l-4 border-blue-600", iconBg: "bg-blue-50 text-blue-600 border-blue-100", pill: "CRM & Accounts" };
  if (t.includes("supplier")) return { icon: Building2, accent: "border-l-4 border-indigo-600", iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100", pill: "Procurement" };
  if (t.includes("lead")) return { icon: NotepadText, accent: "border-l-4 border-amber-500", iconBg: "bg-amber-50 text-amber-600 border-amber-100", pill: "Sales Pipeline" };
  if (t.includes("quotation")) return { icon: FileScan, accent: "border-l-4 border-sky-500", iconBg: "bg-sky-50 text-sky-600 border-sky-100", pill: "Commercial" };
  if (t.includes("tax invoice") || t.includes("invoice")) return { icon: ReceiptText, accent: "border-l-4 border-emerald-500", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", pill: "Billing & VAT" };
  if (t.includes("purchase")) return { icon: ShoppingCart, accent: "border-l-4 border-purple-600", iconBg: "bg-purple-50 text-purple-600 border-purple-100", pill: "Procurement & LPO" };
  if (t.includes("inventory") || t.includes("product") || t.includes("uom")) return { icon: Boxes, accent: "border-l-4 border-amber-600", iconBg: "bg-amber-50 text-amber-600 border-amber-100", pill: "Stock & Inventory" };
  if (t.includes("account") || t.includes("ledger")) return { icon: FileSpreadsheet, accent: "border-l-4 border-teal-600", iconBg: "bg-teal-50 text-teal-600 border-teal-100", pill: "Financial Ledger" };
  if (t.includes("hr") || t.includes("employee") || t.includes("user")) return { icon: UserCheck, accent: "border-l-4 border-cyan-600", iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100", pill: "Team & HR" };
  if (t.includes("payroll") || t.includes("wps")) return { icon: Landmark, accent: "border-l-4 border-emerald-600", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", pill: "WPS Banking" };
  if (t.includes("credential") || t.includes("vault")) return { icon: LockKeyhole, accent: "border-l-4 border-rose-600", iconBg: "bg-rose-50 text-rose-600 border-rose-100", pill: "Security Vault" };
  if (t.includes("asset")) return { icon: HardDrive, accent: "border-l-4 border-slate-700", iconBg: "bg-slate-100 text-slate-700 border-slate-200", pill: "Hardware & Assets" };
  if (t.includes("renewal")) return { icon: DatabaseZap, accent: "border-l-4 border-indigo-600", iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100", pill: "Contracts" };
  if (t.includes("workflow")) return { icon: ClipboardList, accent: "border-l-4 border-blue-600", iconBg: "bg-blue-50 text-blue-600 border-blue-100", pill: "Operations" };
  if (t.includes("finance") || t.includes("expense")) return { icon: CircleDollarSign, accent: "border-l-4 border-emerald-600", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", pill: "Finance" };
  if (t.includes("profitability")) return { icon: ChartNoAxesCombined, accent: "border-l-4 border-emerald-600", iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", pill: "Analytics" };
  return { icon: Layers, accent: "border-l-4 border-blue-600", iconBg: "bg-blue-50 text-blue-600 border-blue-100", pill: "GGMS Oman" };
}

export function SectionTitle({
  title,
  subtitle,
  icon: CustomIcon,
  badgeText,
  action
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  badgeText?: string;
  action?: ReactNode;
}) {
  const meta = getTitleMeta(title);
  const IconComponent = CustomIcon || meta.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm shadow-slate-200/40 mb-6 ${meta.accent}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.iconBg} shadow-sm`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">{title}</h2>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 border border-slate-200/60">
                {badgeText || meta.pill}
              </span>
            </div>
            {subtitle ? (
              <p className="text-xs font-medium text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function DataTable({ title, action, children, onAction }: { title: string; action: string; children: ReactNode; onAction?: () => void }) {
  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-md shadow-slate-200/50">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50/60 py-3.5 px-5 border-b border-slate-200/80">
        <CardTitle className="text-base font-extrabold text-slate-900">{title}</CardTitle>
        <Button size="sm" variant="primary" onClick={onAction}>
          <Plus className="h-4 w-4" /> {action}
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>{children}</Table>
      </CardContent>
    </Card>
  );
}

export function WorkflowTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden border-slate-200/90 shadow-md shadow-slate-200/50">
      <CardHeader className="bg-slate-50/60 py-3.5 px-5 border-b border-slate-200/80">
        <CardTitle className="text-base font-extrabold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>{children}</Table>
      </CardContent>
    </Card>
  );
}

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">{label}</span>
      <input
        className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function FlowStep({ icon, label, count }: { icon: ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80">{icon}</div>
        <span className="text-sm font-bold text-slate-800">{label}</span>
      </div>
      <span className="text-2xl font-black text-slate-950 tracking-tight">{count}</span>
    </div>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export function QuickRule({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">{body}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 self-center" />
    </div>
  );
}

export function ConfirmDeleteModal({
  isOpen,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  loading = false
}: {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-955/60 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4 animate-scale-up">
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-sm shadow-rose-500/10">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {description}
            {itemName && (
              <span className="block mt-1">
                Target item: <strong className="text-slate-800 font-extrabold">{itemName}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
            className="h-10 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="h-10 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition active:scale-98 flex items-center gap-2"
          >
            {loading ? "Deleting..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

