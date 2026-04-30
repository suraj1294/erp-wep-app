export const E2E_EMAIL =
  process.env.E2E_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@example.com"

export const E2E_PASSWORD =
  process.env.E2E_PASSWORD ??
  process.env.DEMO_USER_PASSWORD ??
  "password123"
