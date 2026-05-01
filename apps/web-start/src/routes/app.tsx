import { createFileRoute, Outlet, redirect, useNavigate, useSearch } from "@tanstack/react-router"
import { useAuth } from "#/lib/auth-context"
import { useEffect } from "react"

export const Route = createFileRoute("/app")({
  component: AppLayout,
})

function AppLayout() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const isDemo = "demo" in search

  useEffect(() => {
    if (!loading && !isAuthenticated && !isDemo) {
      navigate({ to: "/sign-in" })
    }
  }, [isAuthenticated, loading, isDemo, navigate])

  // Show nothing while checking auth
  if (loading) {
    return null
  }

  if (!isAuthenticated && !isDemo) {
    return null
  }

  return <Outlet />
}