export type AdminAccessCheckTrigger =
  | "initial"
  | "window-focus"
  | "token-refresh"
  | "signed-in"
  | "user-updated";

export function shouldPreserveAdminContent(
  trigger: AdminAccessCheckTrigger,
  sameIdentity = true
): boolean {
  return trigger !== "initial" && sameIdentity;
}
