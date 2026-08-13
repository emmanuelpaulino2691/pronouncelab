import type { Session, SupabaseClient } from "@supabase/supabase-js";

type AuthClient = Pick<SupabaseClient["auth"], "getUser" | "signOut">;

export async function verifyStoredSession(auth: AuthClient, session: Session | null) {
  if (!session) return null;
  const { data, error } = await auth.getUser(session.access_token);
  if (!error && data.user) return session;
  await auth.signOut({ scope: "local" });
  return null;
}
