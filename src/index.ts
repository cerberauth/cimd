import { Hono } from 'hono'
import type { Env } from './types'
import { serveClientDocument } from './routes/serve'
import { createClient } from './routes/create'
import { updateClient } from './routes/update'
import { deleteClient } from './routes/delete'
import { getClient } from './routes/get'
import { apiAuth } from './middleware/apiAuth'
import { jsonError } from './lib/responses'
import { homePage } from './views/home'

const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => c.html(homePage(c.env.CIMD_SERVICE_ORIGIN)))

// Document-serving path: kept trivial and cacheable, separate from /api/*.
app.get('/c/:id', serveClientDocument)

// All provisioning endpoints require a JWT verified against the configured JWKS.
app.use('/api/*', apiAuth())

app.post('/api/clients', createClient)
app.get('/api/clients/:id', getClient)
app.put('/api/clients/:id', updateClient)
app.delete('/api/clients/:id', deleteClient)

app.notFound(() => jsonError(404, 'not found'))

export default app
