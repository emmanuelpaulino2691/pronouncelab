import { useContext } from "react";

import { AdminPermissionsContext } from "./AdminPermissionsContext";

export function useAdminPermissions() {
  const permissions = useContext(
    AdminPermissionsContext
  );

  if (!permissions) {
    throw new Error(
      "Admin permissions must be used inside AdminRoute."
    );
  }

  return permissions;
}
