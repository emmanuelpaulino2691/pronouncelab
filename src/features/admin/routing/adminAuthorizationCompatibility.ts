type PostgrestErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

export function isMissingAuthorizationRpcError(
  error: unknown
): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as PostgrestErrorLike;
  if (candidate.code === "PGRST202") return true;
  if (candidate.status === 404) return true;

  if (typeof candidate.message !== "string") return false;
  const message = candidate.message.toLocaleLowerCase();
  return (
    message.includes("function") &&
    (
      message.includes("not found") ||
      message.includes("schema cache")
    )
  );
}

export function legacyOwnershipPermissions(
  canManageContent: boolean
) {
  return {
    // Before ownership exists, the old RLS model exposes one shared staff
    // catalog. This preserves that behavior without claiming an admin role.
    canViewAllCourses: canManageContent,
    isAdmin: false,
  };
}
