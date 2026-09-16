import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number, currency = "OMR", customDecimals?: number) {
  const displayCurrency = currency?.trim() || "OMR";
  const normCurrency = displayCurrency.toUpperCase();

  const decimals = typeof customDecimals === "number"
    ? customDecimals
    : ["OMR", "KWD", "BHD", "JOD"].includes(normCurrency)
      ? 3
      : 2;

  try {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
    return `${displayCurrency} ${formatted}`;
  } catch {
    return `${displayCurrency} ${value.toFixed(decimals)}`;
  }
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}
