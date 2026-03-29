"use client"

import { usePathname } from "next/navigation"
import { useRouter } from "next/router"

// This a client component, still prerendered
export function Pathname({
  children,
  haveCompany,
}: {
  children: React.ReactNode
  haveCompany: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()

  if (!haveCompany && pathname !== "/create-company") {
    router.push("/create-company")
  }

  return (
    <div>
      <p>Path: {pathname}</p>
      {children}
    </div>
  )
}
