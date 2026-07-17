import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  isSupabaseConfigured,
  supabase,
} from "../../shared/lib/supabaseClient";

type LoginLocationState = {
  from?: unknown;
};

function getSafeReturnPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const target = new URL(
      value,
      window.location.origin
    );

    if (target.origin !== window.location.origin) {
      return null;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

function getAuthenticationError(
  message: string
) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes(
      "invalid login credentials"
    )
  ) {
    return "The email or password is incorrect.";
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  ) {
    return "Please confirm your email address before signing in.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network")
  ) {
    return "Unable to reach the authentication service. Check your connection and try again.";
  }

  return "We could not sign you in. Please try again.";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = useMemo(
    () =>
      getSafeReturnPath(
        (location.state as
          | LoginLocationState
          | null)?.from
      ) ?? "/admin",
    [location.state]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [isRestoring, setIsRestoring] =
    useState(isSupabaseConfigured);
  const [isSigningIn, setIsSigningIn] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        isActive = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          isActive &&
          event === "SIGNED_IN" &&
          session
        ) {
          navigate(returnPath, { replace: true });
        }
      }
    );

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error) {
          setErrorMessage(
            "Your existing session could not be restored. Please sign in again."
          );
          setIsRestoring(false);
          return;
        }

        if (data.session) {
          navigate(returnPath, { replace: true });
          return;
        }

        setIsRestoring(false);
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [navigate, returnPath]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSigningIn) {
      return;
    }

    const normalizedEmail = email.trim();
    setErrorMessage(null);
    setRecoveryMessage(null);

    if (!normalizedEmail) {
      setErrorMessage("Enter your email address.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(
        "Enter a valid email address."
      );
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Enter your password.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage(
        "Authentication is not configured for this environment."
      );
      return;
    }

    setIsSigningIn(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        setErrorMessage(
          getAuthenticationError(error.message)
        );
        return;
      }

      navigate(returnPath, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? getAuthenticationError(error.message)
          : "We could not sign you in. Please try again."
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  if (isRestoring) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6">
        <div
          role="status"
          className="flex items-center gap-3 text-sm font-medium text-slate-200"
        >
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-r-transparent"
          />
          Restoring your session…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.72fr)]">
      <section className="relative hidden overflow-hidden px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div
          aria-hidden="true"
          className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            PronounceLab
          </p>
          <p className="mt-2 text-sm text-slate-400">
            with Emmanuel Paulino
          </p>
        </div>

        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-400">
            Content Studio
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
            Improve your English every day.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Create thoughtful pronunciation lessons
            and manage the learning experience from one
            secure workspace.
          </p>
        </div>

        <p className="relative text-sm text-slate-500">
          PronounceLab administration
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              PronounceLab
            </p>
            <p className="mt-1 text-sm text-slate-500">
              with Emmanuel Paulino
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-9">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Content Studio
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Welcome back
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in with your PronounceLab staff
                account.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
              >
                Authentication is not configured for
                this environment.
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
              >
                {errorMessage}
              </div>
            )}

            {recoveryMessage && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
              >
                {recoveryMessage}
              </div>
            )}

            <form
              className="mt-7 space-y-5"
              noValidate
              onSubmit={(event) =>
                void handleSubmit(event)
              }
            >
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  disabled={isSigningIn}
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    autoComplete="current-password"
                    required
                    disabled={isSigningIn}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-24 pl-4 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    disabled={isSigningIn}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-xs font-semibold text-blue-700 transition hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 disabled:opacity-50"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRecoveryMessage(
                      "Password recovery is not available in the app yet. Contact your PronounceLab administrator for help."
                    );
                  }}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={
                  isSigningIn ||
                  !isSupabaseConfigured
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSigningIn && (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
                  />
                )}
                {isSigningIn
                  ? "Signing in…"
                  : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Access is limited to authorized editors,
            publishers, and administrators.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
