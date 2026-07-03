import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, type UserInfo } from '@/services/api'

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const tokens = api.getStoredTokens()
    if (!tokens) {
      setIsLoading(false)
      return
    }

    try {
      const userData = await api.me()
      setUser(userData)
    } catch {
      api.clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password })
    api.storeTokens(response.access_token, response.refresh_token)
    setUser(response.user)
  }

  const logout = async () => {
    const tokens = api.getStoredTokens()
    if (tokens) {
      try {
        await api.logout(tokens.refreshToken)
      } catch {
        // Ignore logout errors
      }
    }
    api.clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}