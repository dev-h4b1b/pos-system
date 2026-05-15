import createRouter from '../../lib/create-router'
import { login, me } from './auth.handlers'
import * as routes from './auth.routes'

const router = createRouter().openapi(routes.login, login).openapi(routes.me, me)
export default router
