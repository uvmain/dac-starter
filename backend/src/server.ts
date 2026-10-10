/* eslint-disable antfu/no-top-level-await */
import { createServer } from 'node:http'
import process from 'node:process'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { loadEnvironmentVariables } from './core/config'
import { closeDatabase, initialiseDatabase } from './core/database'
import { colourLog, loggerMiddleware } from './core/logger'
import { createRoutes, useAuth, useCompression } from './core/router'

await loadEnvironmentVariables()

const app = new Hono()

loggerMiddleware(app)
initialiseDatabase()
createRoutes(app)
useAuth(app)
useCompression(app)

const server = serve({
  fetch: app.fetch,
  port: 8080,
  createServer,
}, () => {
  colourLog('green', 'Server is running on http://localhost:8080')
})

function shutdown(signal: NodeJS.Signals) {
  colourLog('yellow', `Received ${signal}, starting graceful shutdown`)

  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    closeDatabase()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
