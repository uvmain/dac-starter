import type { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { compress } from 'hono/compress'
import { Config } from './config'
import * as handlers from './handlers'

export function useAuth(app: Hono) {
  app.use('/kv/*', bearerAuth({ token: Config.BEARER_TOKEN }))
}

export function useCompression(app: Hono) {
  app.use(compress({ encoding: 'gzip', threshold: 4096 }))
}

export function createRoutes(app: Hono) {
  app.get('/kv/:key', c => handlers.handleGetRequest(c))

  app.get('/kv', c => handlers.handleGetAllRequest(c))

  app.put('/kv', c => handlers.handlePutRequest(c))

  app.delete('/kv/:key', c => handlers.handleDeleteRequest(c))

  app.delete('/kv', c => handlers.handleDeleteAllRequest(c))

  app.get('/health', c => handlers.handleHealthCheckRequest(c))
}
