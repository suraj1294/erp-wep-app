import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setError("Sign in failed")
        setLoading(false)
        return
      }
      window.location.href = "/app"
    } catch {
      setError("Sign in failed")
      setLoading(false)
    }
  }

  async function handleDemo() {
    window.location.href = "/app/acme-corp-ltd?demo=1"
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md">
        <div className="island-shell rounded-2xl p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--sea-ink)]">
              Sign in to Tally ERP
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[var(--sea-ink)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[var(--sea-ink)]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--lagoon)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <button
                type="button"
                onClick={handleDemo}
                className="w-full rounded-lg border border-[var(--line)] bg-white/50 px-4 py-2.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
              >
                Continue with Demo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}