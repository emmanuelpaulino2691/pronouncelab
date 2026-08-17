import type { ReactNode } from "react";
import { pendingBackendOperation } from "../../../domain/content-operations";
import { Alert, Button, Dialog } from "../ui";

export function ContentOperationDialog({ open, title, description, children, valid, onClose, actionLabel = "Continue" }: { open: boolean; title: string; description: string; children: ReactNode; valid: boolean; onClose: () => void; actionLabel?: string }) {
  return <Dialog isOpen={open} onClose={onClose} title={title} description={description} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled title={pendingBackendOperation.reason}>{actionLabel}</Button></>}>
    <div className="space-y-5">{children}<Alert tone="warning">{pendingBackendOperation.reason}</Alert><p className="text-sm text-slate-600">{valid ? "Your choices are ready, but nothing has been changed." : "Complete the required fields to prepare this operation."}</p></div>
  </Dialog>;
}

export function UnavailableOperationDialog({ open, operation, onClose }: { open: boolean; operation: string; onClose: () => void }) {
  return <Dialog isOpen={open} onClose={onClose} title={`${operation} unavailable`} footer={<Button onClick={onClose}>Close</Button>}><Alert tone="warning">{pendingBackendOperation.reason}</Alert></Dialog>;
}
