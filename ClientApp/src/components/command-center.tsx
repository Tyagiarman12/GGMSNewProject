"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Copy,
  Eye,
  FileScan,
  FileUp,
  HardDrive,
  LockKeyhole,
  MessageSquareText,
  QrCode,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  XCircle
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, Td, Th } from "../components/ui/table";
import { cn, money, percent } from "../lib/utils";

export function KpiCard({
  label,
  value,
  icon,
  trend,
  tone = "default"
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    default: "bg-slate-100/80 text-slate-700 border border-slate-200/60",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-500/10",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-500/10",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm shadow-rose-500/10",
    info: "bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm shadow-blue-500/10"
  }[tone];

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/5">
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105", toneClass)}>
            {icon}
          </div>
          {trend ? (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-transform duration-200 group-hover:scale-105",
              trend.startsWith("+") ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70" : trend.startsWith("-") ? "bg-rose-50 text-rose-700 border border-rose-200/70" : "bg-blue-50 text-blue-700 border border-blue-200/70"
            )}>
              {trend.startsWith("+") ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : trend.startsWith("-") ? <TrendingDown className="h-3.5 w-3.5 text-rose-600" /> : <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />}
              {trend}
            </span>
          ) : null}
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AttentionPanel({ items }: { items: ReadonlyArray<{ type: string; label: string; severity: "danger" | "warning" | "success" | "info" | "default"; owner: string }> }) {
  return (
    <Card className="border-amber-200/90 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/50 shadow-md shadow-amber-500/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-extrabold text-amber-950">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
          </div>
          Attention Required
        </CardTitle>
        <Badge variant="warning">Priority Queue</Badge>
      </CardHeader>
      <CardContent className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.label} className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={item.severity}>{item.type}</Badge>
              <span className="text-[11px] font-bold text-slate-400">P{index + 1}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-950 group-hover:text-amber-900 transition-colors">{item.label}</p>
            <p className="mt-1.5 text-xs font-semibold text-slate-500">Owner: <span className="text-slate-800">{item.owner}</span></p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


export function ClientHealthCard({
  name,
  industry,
  profitability,
  tasks,
  invoices,
  notes
}: {
  name: string;
  industry: string;
  profitability: number;
  tasks: number;
  invoices: number;
  notes: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-950">{name}</p>
            <p className="text-sm text-slate-500">{industry}</p>
          </div>
          <Badge variant={profitability < 20 ? "warning" : "success"}>{percent(profitability)} margin</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{notes}</p>
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Open tasks" value={String(tasks)} />
          <MiniMetric label="Invoices due" value={String(invoices)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectProfitTable({ projects, currency }: { projects: Array<{ name: string; client: string; revenue: number; cost: number; margin: number; status: string; delayed: boolean }>; currency: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Profitability</CardTitle>
        <Badge variant="info">Live margin view</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <thead><tr><Th>Project</Th><Th>Client</Th><Th>Revenue</Th><Th>Cost</Th><Th>Margin</Th><Th>Health</Th></tr></thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.name} className="transition hover:bg-slate-50/80">
                <Td><span className="font-semibold text-slate-900">{project.name}</span></Td>
                <Td>{project.client}</Td>
                <Td>{money(project.revenue, currency)}</Td>
                <Td>{money(project.cost, currency)}</Td>
                <Td>{percent(project.margin)}</Td>
                <Td><Badge variant={project.margin < 20 || project.delayed ? "danger" : "success"}>{project.margin < 20 ? "Low margin" : project.delayed ? "Delayed" : "Healthy"}</Badge></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function UploadDropzone({ title = "Drop files here", subtitle = "Images, PDFs, receipts, voice notes, WhatsApp text, and documents." }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
        <UploadCloud className="h-7 w-7" />
      </div>
      <p className="mt-4 text-base font-black text-slate-950">{title}</p>
      <p className="mt-1 max-w-xl text-sm text-slate-500">{subtitle}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="primary"><FileUp className="h-4 w-4" /> Upload</Button>
        <Button><Sparkles className="h-4 w-4" /> Classify with mock AI</Button>
      </div>
    </div>
  );
}

export function VatScannerCard({ scan }: { scan: Record<string, string | number> }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><FileScan className="h-5 w-5 text-blue-600" /> VAT Bill Scanner</CardTitle>
        <Badge variant="success">{scan.confidence}% confidence</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <div className="text-center">
              <FileScan className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">Invoice preview</p>
              <p className="text-xs text-slate-400">Image/PDF placeholder</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(scan).map(([key, value]) => (
            <MiniMetric key={key} label={key.replace(/([A-Z])/g, " $1")} value={String(value)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeeScoreCard({ name, role, productivity, completed, overdue }: { name: string; role: string; productivity: number; completed: number; overdue: number }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">{name.slice(0, 2).toUpperCase()}</div>
            <div>
              <p className="font-bold text-slate-950">{name}</p>
              <p className="text-sm text-slate-500">{role}</p>
            </div>
          </div>
          <Badge variant={productivity < 70 ? "danger" : "success"}>{percent(productivity)}</Badge>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className={cn("h-2 rounded-full", productivity < 70 ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${productivity}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Completed" value={String(completed)} />
          <MiniMetric label="Overdue" value={String(overdue)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function RenewalCard({ client, type, due, value, status, margin }: { client: string; type: string; due: string; value: number; status: string; margin: number }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-slate-950">{client}</p>
            <p className="text-sm text-slate-500">{type}</p>
          </div>
          <Badge variant={status.includes("15") ? "danger" : "warning"}>{status}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniMetric label="Due" value={due} />
          <MiniMetric label="Value" value={money(value)} />
          <MiniMetric label="Margin" value={percent(margin)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetCard({ code, client, category, brand, warranty, location, status }: { code: string; client: string; category: string; brand: string; warranty: string; location: string; status: string }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><HardDrive className="h-5 w-5" /></div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400"><QrCode className="h-5 w-5" /></div>
        </div>
        <div>
          <p className="font-black text-slate-950">{category} - {brand}</p>
          <p className="text-sm text-slate-500">{client} / {location}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">{code}</span>
          <Badge variant={status === "Healthy" ? "success" : "warning"}>{status}</Badge>
        </div>
        <MiniMetric label="Warranty" value={warranty} />
      </CardContent>
    </Card>
  );
}

export function CredentialVaultCard({ name, username, password }: { name: string; username?: string; password?: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"><LockKeyhole className="h-5 w-5" /></div>
          <div>
            <p className="font-bold text-slate-950">{name}</p>
            <p className="text-sm text-slate-500">{username || "admin"} / {revealed ? (password || "") : "************"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="icon" aria-label="Reveal" onClick={() => setRevealed(!revealed)}><Eye className="h-4 w-4" /></Button>
          <Button size="icon" aria-label="Copy" onClick={() => { if (password) navigator.clipboard.writeText(password); }}><Copy className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityTimeline({ events }: { events: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event, index) => (
          <div key={event} className="flex gap-3">
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">{index === 0 ? <Bot className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{event}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ChatPreview() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-blue-600" /> Internal Chat</CardTitle>
        <Badge variant="info">Client room</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          ["Operations", "Engineer uploaded site photo and marked firewall rack cleanup done."],
          ["Accounts", "Invoice follow-up needed before Thursday."],
          ["AI", "Summary updated from quotation, AMC, and payment notes."]
        ].map(([sender, body]) => (
          <div key={sender} className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">{sender}</p>
            <p className="text-sm text-slate-700">{body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <XCircle className="mx-auto h-9 w-9 text-slate-300" />
      <p className="mt-3 font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
