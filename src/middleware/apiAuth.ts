import type { Context, MiddlewareHandler } from 'hono'
import { Jwt } from 'hono/utils/jwt'
import type { Env } from '../types'
import { jsonError } from '../lib/responses'

const ALLOWED_ALGORITHMS = ['RS256', 'ES256'] as const

function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
  return match ? match[1]!.trim() : null
}

/**
 * Gates /api/* behind a service-level JWT, verified against the JWKS
 * published at CIMD_API_JWKS_URI. This is separate from the per-client
 * owner_token used by PUT/DELETE/GET on a provisioned resource — this
 * middleware controls who may call the provisioning API at all.
 */
export function apiAuth(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const token = extractBearerToken(c.req.header('Authorization') ?? null)
    if (!token) {
      return jsonError(401, 'missing bearer token')
    }

    try {
      await Jwt.verifyWithJwks(token, {
        jwks_uri: c.env.CIMD_API_JWKS_URI,
        allowedAlgorithms: ALLOWED_ALGORITHMS,
        verification: {
          iss: c.env.CIMD_API_ISSUER,
          aud: c.env.CIMD_API_AUDIENCE,
        },
      })
    } catch {
      return jsonError(401, 'invalid or expired token')
    }

    await next()
  }
}
