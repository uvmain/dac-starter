import type { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { bearerAuth } from 'hono/bearer-auth'
import { compress } from 'hono/compress'
import { Config } from './config.js'
import * as handlers from './handlers.js'

export function useAuth(app: Hono) {
  app.use('/kv/*', bearerAuth({ token: Config.BEARER_TOKEN }))
}

export function useCompression(app: Hono) {
  app.use(compress({ encoding: 'gzip', threshold: 4096 }))
}

export function createRoutes(app: Hono) {
  app.get('/api/kv/:key', c => handlers.handleGetRequest(c))

  app.get('/api/kv', c => handlers.handleGetAllRequest(c))

  app.put('/api/kv', c => handlers.handlePutRequest(c))

  app.delete('/api/kv/:key', c => handlers.handleDeleteRequest(c))

  app.delete('/api/kv', c => handlers.handleDeleteAllRequest(c))

  app.get('/api/health', c => handlers.handleHealthCheckRequest(c))

  // any other path, return the frontend index.html file
  app.get('*', serveStatic({ root: './dist/dist', index: 'index.html' }))
}
