import createRouter from '../../lib/create-router'
import { healthCheck } from './health.handlers'
import * as routes from './health.routes'

const router = createRouter().openapi(routes.healthCheck, healthCheck)
export default router
