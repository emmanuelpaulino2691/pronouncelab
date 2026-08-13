import type { Session } from "@supabase/supabase-js";

export type AuthenticatedIdentityKind = "learner" | "staff";
export type IdentityRpcClient = {
  rpc(name: "can_manage_content" | "is_platform_admin"): PromiseLike<{ data: unknown; error: unknown }>;
};

export function authenticatedDestination(kind: AuthenticatedIdentityKind, requestedPath?: string | null) {
  if (kind === "staff") return requestedPath?.startsWith("/admin") ? requestedPath : "/admin";
  return requestedPath && !requestedPath.startsWith("/admin") ? requestedPath : "/";
}

export async function resolveAuthenticatedIdentity(session: Session, client: IdentityRpcClient) {
  const [manageResult, adminResult] = await Promise.all([
    client.rpc("can_manage_content"),
    client.rpc("is_platform_admin"),
  ]);
  if (manageResult.error || adminResult.error) throw new Error("Unable to verify account access.");
  return {
    session,
    kind: manageResult.data === true || adminResult.data === true
      ? "staff" as const
      : "learner" as const,
  };
}
