"use client"

import { createAuthClient } from "better-auth/react"

// Better Auth client types require deep module resolution that pnpm hoisting
// doesn't fully expose. Using `any` here — the runtime API is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient()

export const signIn = authClient.signIn
export const signUp = authClient.signUp
export const signOut = authClient.signOut
export const useSession = authClient.useSession
