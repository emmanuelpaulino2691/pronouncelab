import { createContext } from "react";

export type AdminPermissions = {
  canAccessAdmin: boolean;
  canEditDrafts: boolean;
  canPublish: boolean;
  canViewAllCourses: boolean;
  isAdmin: boolean;
};

export const AdminPermissionsContext =
  createContext<AdminPermissions | null>(null);
