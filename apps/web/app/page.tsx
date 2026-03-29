import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold">Tally ERP</h1>
        <p className="text-muted-foreground">
          A comprehensive web-based ERP solution for financial management,
          inventory control, sales, and purchases.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
