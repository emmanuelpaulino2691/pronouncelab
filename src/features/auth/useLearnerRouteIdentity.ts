import { useEffect, useRef, useState } from "react";
import { supabase } from "../../shared/lib/supabaseClient";
import { resolveLearnerRouteIdentity, type LearnerRouteIdentity } from "./learnerRouteIdentity";

export function useLearnerRouteIdentity() {
  const [identity, setIdentity] = useState<LearnerRouteIdentity>({ kind: "anonymous", session: null });
  const requestRef = useRef(0);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    const update = async (session: Parameters<typeof resolveLearnerRouteIdentity>[0]) => {
      const request = ++requestRef.current;
      if (session) setIdentity({ kind: "checking", session });
      else setIdentity({ kind: "anonymous", session: null });
      try {
        const resolved = await resolveLearnerRouteIdentity(session, client);
        if (active && request === requestRef.current) setIdentity(resolved);
      } catch {
        if (active && request === requestRef.current) setIdentity(session ? { kind: "staff", session } : { kind: "anonymous", session: null });
      }
    };
    void client.auth.getSession().then(({ data }) => update(data.session));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => { void update(session); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return identity;
}
