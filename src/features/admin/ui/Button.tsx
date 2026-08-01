import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "./AdminIcon";
import { buttonClassName } from "./buttonStyles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
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
