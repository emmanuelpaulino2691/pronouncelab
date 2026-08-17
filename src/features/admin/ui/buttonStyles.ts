import type { ButtonVariant } from "./Button";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  danger: "border border-red-700 bg-red-600 text-white shadow-sm hover:bg-red-700",
};

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return `admin-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;
}
