import { NextResponse } from "next/server"

function getErrorStatus(message: string) {
  if (message === "Unauthorized") {
    return 401
  }

  if (
    message === "Insufficient permissions" ||
    message.includes("do not have access")
  ) {
    return 403
  }

  if (message.includes("not found")) {
    return 404
  }

  if (
    message.includes("required") ||
    message.includes("already") ||
    message.includes("inactive") ||
    message.includes("must keep")
  ) {
    return 400
  }

  return 500
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleRouteError(
  error: unknown,
  fallbackMessage = "Something went wrong."
) {
  const message = error instanceof Error ? error.message : fallbackMessage
  const status = getErrorStatus(message)

  return NextResponse.json(
    {
      error: status >= 500 ? fallbackMessage : message,
    },
    { status }
  )
}
