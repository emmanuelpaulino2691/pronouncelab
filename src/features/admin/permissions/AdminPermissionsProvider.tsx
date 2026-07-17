import type { ReactNode } from "react";

import {
  AdminPermissionsContext,
  type AdminPermissions,
} from "./AdminPermissionsContext";

type AdminPermissionsProviderProps = {
  permissions: AdminPermissions;
  children: ReactNode;
};

function AdminPermissionsProvider({
  permissions,
  children,
}: AdminPermissionsProviderProps) {
  return (
    <AdminPermissionsContext.Provider
      value={permissions}
    >
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export default AdminPermissionsProvider;
