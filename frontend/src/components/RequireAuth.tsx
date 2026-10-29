import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getSession } from '../auth'
import type { Role } from '../types'

export default function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (role && session.role !== role) return <Navigate to="/admin" replace />
  return <>{children}</>
}
