import { test as base, expect } from "@playwright/test"

// ---------------------------------------------------------------------------
// AppConfig — per-app behaviour that differs between Next.js and TanStack Start
// ---------------------------------------------------------------------------

export interface AppConfig {
  /** URL prefix before the company slug: "" for Next.js, "/app" for TanStack Start */
  urlPrefix: string
  /** How to resolve the company slug for authenticated tests */
  companySlug: "dynamic" | string
  /** Whether the app supports demo mode (?demo=1) for unauthenticated access */
  hasDemoMode: boolean
}

export const nextjsConfig: AppConfig = {
  urlPrefix: "",
  companySlug: "dynamic",
  hasDemoMode: false,
}

export const startConfig: AppConfig = {
  urlPrefix: "/app",
  companySlug: "acme-corp-ltd",
  hasDemoMode: true,
}

// ---------------------------------------------------------------------------
// Custom test fixture
// ---------------------------------------------------------------------------

type MyFixtures = {
  appConfig: AppConfig
  companySlug: string
}

export const test = base.extend<MyFixtures>({
  // appConfig is selected by the Playwright project (option:true)
  appConfig: [nextjsConfig, { option: true }],

  // Resolve company slug — dynamic apps discover it via redirect,
  // hardcoded apps use the value from appConfig.
  companySlug: async ({ appConfig, page }, use) => {
    if (appConfig.companySlug !== "dynamic") {
      await use(appConfig.companySlug)
      return
    }

    // Dynamic: navigate to /app and capture the slug from the redirect
    await page.goto(`${appConfig.urlPrefix || "/"}`)
    const url = page.url()
    const match = url.match(/\/([a-z0-9]+(?:-[a-z0-9]+)+)(?:\/|$)/)
    const slug = match?.[1]
    if (slug) {
      await use(slug)
    } else {
      throw new Error(`Could not resolve company slug from URL: ${url}`)
    }
  },
})

export { expect }

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Build a URL path for the current app config. */
export function appUrl(config: AppConfig, slug: string, path?: string): string {
  const base = config.urlPrefix ? `${config.urlPrefix}/${slug}` : `/${slug}`
  return path ? `${base}/${path}` : base
}

/** Build a masters URL: /{prefix}/{slug}/masters/{segment} */
export function mastersUrl(config: AppConfig, slug: string, segment: string): string {
  return appUrl(config, slug, `masters/${segment}`)
}