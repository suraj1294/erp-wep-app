import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") {
      return;
    }

    const hasDemoMode = location.href.includes("demo=");
    if (hasDemoMode) {
      return;
    }

    const res = await fetch("/api/auth/get-session", {
      credentials: "include",
    });
    const session = res.ok ? await res.json().catch(() => null) : null;

    if (!session?.user) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const hasDemoMode = location.href.includes("demo=");
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !hasDemoMode && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate({
        to: "/sign-in",
        search: { redirect: location.href },
        replace: true,
      });
    }
  }, [hasDemoMode, isAuthenticated, loading, location.href, navigate]);

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-center">
          <div className="mb-3 size-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasDemoMode) {
    return null;
  }

  return <Outlet />;
}
