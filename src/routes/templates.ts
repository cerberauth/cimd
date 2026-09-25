import type { Context } from 'hono'
import type { Env, ClientTemplate } from '../types.js'
import templatesData from '../templates.json'
import { templatesPage } from '../views/templates.js'

const templates = templatesData as ClientTemplate[]

export function listTemplates(c: Context<{ Bindings: Env }>) {
  const accept = c.req.header('accept') || ''
  const format = c.req.query('format')

  let isJson = false
  if (format === 'json') {
    isJson = true
  } else if (format === 'html') {
    isJson = false
  } else if (accept.includes('application/json') && !accept.includes('text/html')) {
    isJson = true
  }

  if (isJson) {
    return c.json(templates)
  }

  const origin = c.env?.CIMD_SERVICE_ORIGIN || 'https://cimd.cerberauth.com'
  return c.html(templatesPage(templates, origin))
}
