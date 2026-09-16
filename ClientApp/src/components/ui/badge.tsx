import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

const variants = {
  default: "border-slate-200/90 bg-slate-100/80 text-slate-700 shadow-2xs",
  success: "border-emerald-200/90 bg-emerald-50/90 text-emerald-800 shadow-2xs shadow-emerald-500/5",
  warning: "border-amber-200/90 bg-amber-50/90 text-amber-800 shadow-2xs shadow-amber-500/5",
  danger: "border-rose-200/90 bg-rose-50/90 text-rose-800 shadow-2xs shadow-rose-500/5",
  info: "border-blue-200/90 bg-blue-50/90 text-blue-800 shadow-2xs shadow-blue-500/5"
};

export function Badge({
  children,
  variant = "default",
  className
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight transition-all duration-150", variants[variant], className)}>
      {children}
    </span>
  );
}

