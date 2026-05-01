import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          TanStack Start Demo
        </h1>
        <p className="text-[var(--sea-ink-soft)]">
          A comprehensive web-based ERP solution for financial management,
          inventory control, sales, and purchases.
        </p>
        <div className="flex gap-3">
          <Link
            to="/sign-in"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}