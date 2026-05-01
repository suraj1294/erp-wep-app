import { auth } from "./auth"

export async function handleAuthRequest(request: Request) {
  return auth.handler(request)
}