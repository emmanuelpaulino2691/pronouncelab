import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  isSupabaseConfigured,
  supabase,
} from "../../../shared/lib/supabaseClient";
import type { AdminPermissions } from "../permissions/AdminPermissionsContext";
import AdminPermissionsProvider from "../permissions/AdminPermissionsProvider";
import { shouldPreserveAdminContent } from "./adminAccessRecheck";
import {
  isMissingAuthorizationRpcError,
  legacyOwnershipPermissions,
} from "./adminAuthorizationCompatibility";

type AccessState =
  | "checking"
  | "allowed"
  | "signed-out"
  | "forbidden"
  | "unavailable";

function AdminRoute() {
  const location = useLocation();
  const [accessState, setAccessState] =
    useState<AccessState>(() =>
      isSupabaseConfigured
        ? "checking"
        : "unavailable"
    );
  const [permissions, setPermissions] =
    useState<AdminPermissions | null>(null);
  const isMountedRef = useRef(false);
  const authorizationCheckRef = useRef(0);
  const authorizedUserIdRef = useRef<string | null>(null);
  const ownershipRpcSupportRef = useRef<
    "unknown" | "available" | "legacy"
  >("unknown");

  const checkAccess = useCallback(
    async (
      knownSession?: Awaited<
        ReturnType<
          NonNullable<
            typeof supabase
          >["auth"]["getSession"]
        >
      >["data"]["session"],
      preserveContent = false
    ) => {
      const checkId =
        ++authorizationCheckRef.current;

      if (isMountedRef.current && !preserveContent) {
        setPermissions(null);
        setAccessState("checking");
      }

      if (!isSupabaseConfigured || !supabase) {
        if (
          isMountedRef.current &&
          checkId ===
            authorizationCheckRef.current
        ) {
          setAccessState("unavailable");
        }
        return;
      }

      let session = knownSession;
      let sessionError = null;

      if (session === undefined) {
        const result =
          await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
      }

      if (
        !isMountedRef.current ||
        checkId !==
          authorizationCheckRef.current
      ) {
        return;
      }

      if (sessionError || !session) {
        authorizedUserIdRef.current = null;
        setPermissions(null);
        setAccessState("signed-out");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(
        session.access_token
      );

      if (
        !isMountedRef.current ||
        checkId !==
          authorizationCheckRef.current
      ) {
        return;
      }

      if (userError || !user) {
        authorizedUserIdRef.current = null;
        setPermissions(null);
        setAccessState("signed-out");
        return;
      }

      const ownershipChecks =
        ownershipRpcSupportRef.current === "legacy"
          ? null
          : Promise.all([
              supabase.rpc("can_view_all_courses"),
              supabase.rpc("is_platform_admin"),
            ]);

      const [
        accessResult,
        editResult,
        publishResult,
      ] = await Promise.all([
        supabase.rpc("can_manage_content"),
        supabase.rpc("can_edit_drafts"),
        supabase.rpc("can_publish_content"),
      ]);
      const ownershipResults = ownershipChecks
        ? await ownershipChecks
        : null;

      if (
        !isMountedRef.current ||
        checkId !==
          authorizationCheckRef.current
      ) {
        return;
      }

      if (
        accessResult.error ||
        editResult.error ||
        publishResult.error
      ) {
        setPermissions(null);
        setAccessState("unavailable");
        return;
      }

      let ownershipPermissions:
        Pick<
          AdminPermissions,
          "canViewAllCourses" | "isAdmin"
        >;
      if (!ownershipResults) {
        ownershipPermissions =
          legacyOwnershipPermissions(
            accessResult.data === true
          );
      } else {
        const [viewAllResult, adminResult] =
          ownershipResults;
        const viewAllMissing =
          isMissingAuthorizationRpcError(
            viewAllResult.error
          );
        const adminMissing =
          isMissingAuthorizationRpcError(
            adminResult.error
          );

        if (
          (viewAllResult.error && !viewAllMissing) ||
          (adminResult.error && !adminMissing)
        ) {
          setPermissions(null);
          setAccessState("unavailable");
          return;
        }

        if (viewAllMissing || adminMissing) {
          ownershipRpcSupportRef.current = "legacy";
          ownershipPermissions =
            legacyOwnershipPermissions(
              accessResult.data === true
            );
        } else {
          ownershipRpcSupportRef.current = "available";
          ownershipPermissions = {
            canViewAllCourses:
              viewAllResult.data === true,
            isAdmin: adminResult.data === true,
          };
        }
      }

      const nextPermissions: AdminPermissions = {
        canAccessAdmin:
          accessResult.data === true,
        canEditDrafts: editResult.data === true,
        canPublish: publishResult.data === true,
        ...ownershipPermissions,
      };

      authorizedUserIdRef.current = user.id;

      setPermissions(nextPermissions);
      setAccessState(
        nextPermissions.canAccessAdmin
          ? "allowed"
          : "forbidden"
      );
    },
    []
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        isMountedRef.current = false;
        authorizationCheckRef.current += 1;
      };
    }

    const initialCheckTimer = window.setTimeout(
      () => {
        if (isMountedRef.current) {
          void checkAccess();
        }
      },
      0
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authorizationCheckRef.current += 1;

        if (
          event === "SIGNED_OUT" ||
          !session
        ) {
          authorizedUserIdRef.current = null;
          setAccessState("signed-out");
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED" ||
          event === "INITIAL_SESSION"
        ) {
          const trigger = event === "TOKEN_REFRESHED"
            ? "token-refresh"
            : event === "SIGNED_IN"
              ? "signed-in"
              : event === "USER_UPDATED"
                ? "user-updated"
                : "initial";
          const preserveContent = shouldPreserveAdminContent(
            trigger,
            authorizedUserIdRef.current === session.user.id
          );

          if (!preserveContent) {
            setPermissions(null);
            setAccessState("checking");
          }

          window.setTimeout(() => {
            if (isMountedRef.current) {
              void checkAccess(session, preserveContent);
            }
          }, 0);
        }
      }
    );

    function handleWindowFocus() {
      void checkAccess(
        undefined,
        shouldPreserveAdminContent("window-focus")
      );
    }

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      isMountedRef.current = false;
      authorizationCheckRef.current += 1;
      window.clearTimeout(initialCheckTimer);
      subscription.unsubscribe();
      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [checkAccess]);

  if (accessState === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6">
        <p
          className="text-sm font-medium text-slate-300"
          role="status"
        >
          Checking admin access…
        </p>
      </main>
    );
  }

  if (accessState === "signed-out") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  if (accessState === "forbidden") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
            Access restricted
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Content manager access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your account does not have an editor,
            publisher, or administrator role.
          </p>
        </section>
      </main>
    );
  }

  if (accessState === "unavailable") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
            Admin unavailable
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Supabase could not verify access
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Check the Supabase configuration and try
            again.
          </p>
        </section>
      </main>
    );
  }

  if (!permissions) {
    return null;
  }

  return (
    <AdminPermissionsProvider
      permissions={permissions}
    >
      <Outlet />
    </AdminPermissionsProvider>
  );
}

export default AdminRoute;
