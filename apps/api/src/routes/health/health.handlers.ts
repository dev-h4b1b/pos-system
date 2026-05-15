import type { AppRouteHandler } from '../../lib/types'
import type { HealthCheckRoute } from './health.routes'
import * as HttpStatusCodes from 'stoker/http-status-codes'

export const healthCheck: AppRouteHandler<HealthCheckRoute> = c =>
  c.json({ status: 'ok' as const, timestamp: new Date().toISOString() }, HttpStatusCodes.OK)
