import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30",
  secondary: "border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
  danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 hover:from-red-600 hover:to-rose-700 hover:shadow-lg hover:shadow-red-500/30"
};

export function Button({
  asChild,
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "icon";
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.97]",
        variants[variant],
        size === "sm" && "h-8.5 rounded-lg px-3 text-xs",
        size === "md" && "h-10 rounded-xl px-4 text-sm",
        size === "icon" && "h-10 w-10 rounded-xl",
        className
      )}
      {...props}
    />
  );
}

