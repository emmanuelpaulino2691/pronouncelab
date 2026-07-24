import type { AdminPermissions } from "./permissions/AdminPermissionsContext";

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

export const futureWorkspaceSections = ["Classes", "Students", "Assignments"] as const;
