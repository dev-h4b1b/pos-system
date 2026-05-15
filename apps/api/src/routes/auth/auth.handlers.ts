import type { AppRouteHandler } from '../../lib/types'
import type { LoginRoute, MeRoute } from './auth.routes'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { signToken, verifyToken } from '../../lib/jwt'

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length)
    return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { password } = c.req.valid('json')
  const stored = (c.env as any)?.DASHBOARD_PASSWORD ?? process.env.DASHBOARD_PASSWORD ?? ''
  if (!stored || !constantTimeEquals(password, stored)) {
    return c.json({ message: 'Invalid password' }, HttpStatusCodes.UNAUTHORIZED)
  }
  const token = await signToken(c.env)
  return c.json({ token }, HttpStatusCodes.OK)
}

export const me: AppRouteHandler<MeRoute> = async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token)
    return c.json({ message: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED)
  const payload = await verifyToken(c.env, token)
  if (!payload)
    return c.json({ message: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED)
  return c.json({ sub: payload.sub }, HttpStatusCodes.OK)
}
