export async function handleAuthRequest(request: Request) {
  const { auth } = await import("@/lib/auth");

  return auth.handler(request);
}
