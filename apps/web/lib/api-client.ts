interface ApiErrorPayload {
  error?: string
  message?: string
}

export async function apiRequest<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers)
  const body = init?.body

  if (body && !(body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers,
  })

  const contentType = response.headers.get("content-type") ?? ""
  const isJson = contentType.includes("application/json")
  const payload = isJson
    ? ((await response.json()) as T | ApiErrorPayload)
    : null

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      ("error" in payload || "message" in payload)
        ? payload.error || payload.message || "Request failed."
        : "Request failed."

    throw new Error(message)
  }

  return payload as T
}
