import type { Context } from 'hono'
import { deleteAllRows, deleteRow, getAllRows, getRow, putRow } from './database.js'

interface PutJson {
  key: string
  value: string
  ttl?: number
}

export async function handlePutRequest(c: Context): Promise<Response> {
  const { key, value, ttl } = (await c.req.json()) as PutJson
  if (ttl !== undefined && ttl < 0) {
    return c.text('ttl must be a non-negative integer', 400)
  }
  putRow(key, value, ttl)
  return c.text('OK')
}

export async function handleGetRequest(c: Context): Promise<Response> {
  const key = c.req.param('key') as string
  const value = getRow(key)
  if (value === null) {
    return c.notFound()
  }
  else {
    return c.text(value)
  }
}

export async function handleGetAllRequest(c: Context): Promise<Response> {
  const rows = getAllRows()
  return c.json(rows)
}

export async function handleDeleteRequest(c: Context): Promise<Response> {
  const key = c.req.param('key') as string
  deleteRow(key)
  return c.text('OK')
}

export async function handleDeleteAllRequest(c: Context): Promise<Response> {
  deleteAllRows()
  return c.text('OK')
}

export async function handleHealthCheckRequest(c: Context): Promise<Response> {
  return c.text('OK')
}
