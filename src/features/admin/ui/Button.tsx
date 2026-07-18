import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "./AdminIcon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const variants = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};
function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return `admin-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;
}
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: AdminIconName; isLoading?: boolean; variant?: ButtonVariant;
};
export function Button({ children, className = "", icon, isLoading = false, variant = "primary", disabled, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} disabled={disabled || isLoading} {...props}>
    {isLoading ? <Spinner /> : icon ? <AdminIcon name={icon} className="h-4 w-4" /> : null}{children}
  </button>;
}
type ButtonLinkProps = LinkProps & { children: ReactNode; icon?: AdminIconName; variant?: ButtonVariant };
export function ButtonLink({ children, className = "", icon, variant = "primary", ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, className)} {...props}>{icon && <AdminIcon name={icon} className="h-4 w-4" />}{children}</Link>;
}
export function Spinner() {
  return <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}
