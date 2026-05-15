import { createContext, useCallback, useContext, useState } from 'react'

export type Role = 'admin' | 'user'

export interface AuthUser {
  username: string
  role: Role
}

export interface StoredUser {
  username: string
  password: string
  role: Role
}

interface AuthContextValue {
  user: AuthUser | null
  users: StoredUser[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (username: string, password: string, role: Role) => string | null
  updateUser: (username: string, data: { password?: string, role?: Role }) => void
  deleteUser: (username: string) => void
}

const SESSION_KEY = 'pos_auth'
const USERS_KEY = 'pos_users_v1'

const DEFAULT_USERS: StoredUser[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' },
]

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : DEFAULT_USERS
  }
  catch { return DEFAULT_USERS }
}

function saveUsers(users: StoredUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }
  catch { /* quota */ }
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  }
  catch { return null }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [users, setUsers] = useState<StoredUser[]>(loadUsers)

  const applyUsers = useCallback((updater: (prev: StoredUser[]) => StoredUser[]) => {
    setUsers((prev) => {
      const next = updater(prev)
      saveUsers(next)
      return next
    })
  }, [])

  const login = useCallback((username: string, password: string): boolean => {
    const stored = loadUsers()
    const cred = stored.find(u => u.username === username.toLowerCase())
    if (!cred || cred.password !== password)
      return false
    const authUser: AuthUser = { username: cred.username, role: cred.role }
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser))
    setUser(authUser)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const addUser = useCallback((username: string, password: string, role: Role): string | null => {
    const name = username.trim().toLowerCase()
    if (!name || !password)
      return 'Username and password are required.'
    let err: string | null = null
    applyUsers((prev) => {
      if (prev.find(u => u.username === name)) {
        err = 'Username already exists.'
        return prev
      }
      return [...prev, { username: name, password, role }]
    })
    return err
  }, [applyUsers])

  const updateUser = useCallback((username: string, data: { password?: string, role?: Role }) => {
    applyUsers(prev => prev.map(u =>
      u.username === username ? { ...u, ...data } : u,
    ))
    // If updating own role, refresh session
    if (data.role && user?.username === username) {
      const updated: AuthUser = { username, role: data.role }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      setUser(updated)
    }
  }, [applyUsers, user])

  const deleteUser = useCallback((username: string) => {
    applyUsers(prev => prev.filter(u => u.username !== username))
  }, [applyUsers])

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx)
    throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
