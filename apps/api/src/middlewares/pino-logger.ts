import { pinoLogger as honoPino } from 'hono-pino'
import pino from 'pino'

export function pinoLogger() {
  return honoPino({ pino: pino({ level: 'info' }) })
}
