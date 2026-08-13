import type { Session } from "@supabase/supabase-js";

export type LearnerRouteIdentity =
  | { kind: "anonymous"; session: null }
  | { kind: "checking"; session: Session }
  | { kind: "learner"; session: Session }
  | { kind: "staff"; session: Session };

type LearnerIdentityClient = {
  rpc(name: "is_learner_identity"): PromiseLike<{ data: unknown; error: unknown }>;
};

export async function resolveLearnerRouteIdentity(
  session: Session | null,
  client: LearnerIdentityClient,
): Promise<LearnerRouteIdentity> {
  if (!session) return { kind: "anonymous", session: null };
  const result = await client.rpc("is_learner_identity");
  if (result.error) throw new Error("Unable to verify learner account access.");
  return { kind: result.data === true ? "learner" : "staff", session };
}
