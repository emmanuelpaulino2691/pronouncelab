import type { LearnerRouteIdentity } from "./learnerRouteIdentity";

export type LearnerAccountPresentation =
  | { kind: "guest"; label: "Guest mode"; detail: "Progress is saved on this device" }
  | { kind: "synced"; label: "Progress synced"; detail: string }
  | { kind: "staff"; label: "Staff preview"; detail: string }
  | { kind: "checking"; label: "Checking account"; detail: string };

export function learnerAccountPresentation(identity: LearnerRouteIdentity): LearnerAccountPresentation {
  if (identity.kind === "anonymous") {
    return { kind: "guest", label: "Guest mode", detail: "Progress is saved on this device" };
  }
  const email = identity.session.user.email ?? "Signed-in account";
  if (identity.kind === "learner") return { kind: "synced", label: "Progress synced", detail: email };
  if (identity.kind === "staff") return { kind: "staff", label: "Staff preview", detail: email };
  return { kind: "checking", label: "Checking account", detail: email };
}

export const learnerSignOutDestination = "/";
