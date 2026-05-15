import createRouter from '../../lib/create-router'
import { uploadFile } from './storage.handlers'
import * as routes from './storage.routes'

const router = createRouter().openapi(routes.uploadFile, uploadFile)
export default router
