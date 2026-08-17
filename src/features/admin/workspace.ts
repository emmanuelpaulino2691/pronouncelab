import type { AdminPermissions } from "./permissions/AdminPermissionsContext";
import type { PermissionContext } from "../../domain/permissions/predicates";

export type WorkspaceRole = "administrator" | "teacher" | "publisher" | "editor" | "viewer";

export function getWorkspaceRole(permissions: Pick<AdminPermissions, "canEditDrafts" | "canPublish" | "isAdmin">): WorkspaceRole {
  if (permissions.isAdmin) return "administrator";
  if (permissions.canEditDrafts && permissions.canPublish) return "teacher";
  if (permissions.canPublish) return "publisher";
  if (permissions.canEditDrafts) return "editor";
  return "viewer";
}

export function getWorkspaceHeading(role: WorkspaceRole): string {
  return role === "administrator" ? "Platform overview" : "Teacher Dashboard";
}

export function permissionContextFromAdmin(permissions: Pick<AdminPermissions, "canEditDrafts" | "canPublish" | "isAdmin">): PermissionContext {
  const role = getWorkspaceRole(permissions);
  return { role: role === "administrator" ? "administrator" : role === "viewer" ? "student" : role };
}

export const futureWorkspaceSections = ["Classes", "Students", "Assignments"] as const;
