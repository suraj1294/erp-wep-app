import { auth } from "./auth"

export async function getServerSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  return session
}

export async function requireSession(request: Request) {
  const session = await getServerSession(request)
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}