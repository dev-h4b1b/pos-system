import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'

export const uploadFile = createRoute({
  tags: ['Storage'],
  method: 'post',
  path: '/storage/upload',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ key: z.string(), url: z.string() }), 'Uploaded'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(createMessageObjectSchema('No file'), 'Bad request'),
  },
})
export type UploadFileRoute = typeof uploadFile
