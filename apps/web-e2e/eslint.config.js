import globals from "globals"

import { config as baseConfig } from "@workspace/eslint-config/base"

/** @type {import("eslint").Linter.Config} */
export default [
  ...baseConfig,
  {
    files: ["playwright.config.ts", "e2e/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["playwright-report/**", "test-results/**", "e2e/.auth/**"],
  },
]
