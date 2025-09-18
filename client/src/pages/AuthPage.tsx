import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useLogin, useSignup } from "../hooks/useAuth";

const AuthPage = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const login = useLogin();
  const signup = useSignup();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (mode === "signup") {
      const name = String(formData.get("name") ?? "").trim();
      if (!name) {
        setError("Please provide your name");
        return;
      }
      signup.mutate(
        { name, email, password },
        {
          onError: (err) => {
            console.error(err);
            setError("Unable to sign up. Please try again.");
          }
        }
      );
    } else {
      login.mutate(
        { email, password },
        {
          onError: (err) => {
            console.error(err);
            setError("Invalid email or password");
          }
        }
      );
    }
  };

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome to CourseSphere</h1>
          <p className="text-sm text-slate-500">
            {mode === "login"
              ? "Log in to continue learning and collaborating."
              : "Create a student account to start exploring courses."}
          </p>
        </div>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Jane Doe"
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={login.isPending || signup.isPending}
            className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {mode === "login"
              ? login.isPending
                ? "Signing in..."
                : "Sign in"
              : signup.isPending
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                className="font-medium text-indigo-600"
                onClick={() => {
                  setError(null);
                  setMode("signup");
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already a student?{' '}
              <button
                type="button"
                className="font-medium text-indigo-600"
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="text-center text-xs text-slate-400">
          Admin accounts are provisioned separately. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
