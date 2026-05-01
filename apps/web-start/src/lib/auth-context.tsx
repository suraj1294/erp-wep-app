import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshSession: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data?.user ?? null)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // ignore
    }
    setUser(null)
    window.location.href = "/sign-in"
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}