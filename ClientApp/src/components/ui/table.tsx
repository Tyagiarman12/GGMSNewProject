import React from "react";
import { cn } from "../../lib/utils";
import type { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-left text-sm font-medium", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b border-slate-300 bg-slate-200/80 px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-800", className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-slate-100/90 px-4 py-3.5 text-slate-700 transition-colors duration-150 group-hover:bg-slate-200/60", className)} {...props} />;
}

