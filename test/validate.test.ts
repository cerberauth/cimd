import { describe, it, expect } from 'vitest'
import { validateClientMetadata } from '../src/lib/validate'

describe('validateClientMetadata', () => {
  it('accepts a minimal valid public-client document', () => {
    const result = validateClientMetadata({
      client_name: 'Dev App',
      redirect_uris: ['http://localhost:3000/callback'],
      token_endpoint_auth_method: 'none',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('accepts a document with no fields at all', () => {
    const result = validateClientMetadata({})
    expect(result.valid).toBe(true)
  })

  it('rejects client_secret', () => {
    const result = validateClientMetadata({ client_secret: 'shh' })
    expect(result.valid).toBe(false)
    expect(result.errors.join()).toContain('client_secret MUST NOT be present')
  })

  it('rejects client_secret_expires_at', () => {
    const result = validateClientMetadata({ client_secret_expires_at: 12345 })
    expect(result.valid).toBe(false)
    expect(result.errors.join()).toContain('client_secret_expires_at MUST NOT be present')
  })

  it.each(['client_secret_post', 'client_secret_basic', 'client_secret_jwt'])(
    'rejects token_endpoint_auth_method=%s',
    (method) => {
      const result = validateClientMetadata({ token_endpoint_auth_method: method })
      expect(result.valid).toBe(false)
      expect(result.errors.join()).toContain('shared-secret method')
    },
  )

  it('rejects an unrecognized token_endpoint_auth_method', () => {
    const result = validateClientMetadata({ token_endpoint_auth_method: 'totally_made_up' })
    expect(result.valid).toBe(false)
  })

  it('accepts token_endpoint_auth_method=none', () => {
    const result = validateClientMetadata({ token_endpoint_auth_method: 'none' })
    expect(result.valid).toBe(true)
  })

  it('requires jwks or jwks_uri when private_key_jwt is used', () => {
    const result = validateClientMetadata({ token_endpoint_auth_method: 'private_key_jwt' })
    expect(result.valid).toBe(false)
    expect(result.errors.join()).toContain('requires jwks or jwks_uri')
  })

  it('accepts private_key_jwt with jwks_uri', () => {
    const result = validateClientMetadata({
      token_endpoint_auth_method: 'private_key_jwt',
      jwks_uri: 'https://example.com/jwks.json',
    })
    expect(result.valid).toBe(true)
  })

  it('accepts a well-formed public-key-only jwks', () => {
    const result = validateClientMetadata({
      token_endpoint_auth_method: 'private_key_jwt',
      jwks: { keys: [{ kty: 'RSA', n: '...', e: 'AQAB', kid: 'k1' }] },
    })
    expect(result.valid).toBe(true)
  })

  it.each(['d', 'p', 'q', 'dp', 'dq', 'qi', 'k'])(
    'rejects a jwks key containing private/symmetric member %s',
    (member) => {
      const result = validateClientMetadata({
        jwks: { keys: [{ kty: 'RSA', [member]: 'secret' }] },
      })
      expect(result.valid).toBe(false)
      expect(result.errors.join()).toContain(member)
    },
  )

  it('rejects a jwks.keys entry missing kty', () => {
    const result = validateClientMetadata({ jwks: { keys: [{}] } })
    expect(result.valid).toBe(false)
  })

  it("rejects jwks that isn't an object with a keys array", () => {
    const result = validateClientMetadata({ jwks: { notKeys: [] } })
    expect(result.valid).toBe(false)
  })

  it('accepts valid absolute redirect_uris', () => {
    const result = validateClientMetadata({
      redirect_uris: ['https://app.example.com/cb', 'http://localhost:5173/cb'],
    })
    expect(result.valid).toBe(true)
  })

  it('rejects a malformed redirect_uri', () => {
    const result = validateClientMetadata({ redirect_uris: ['not-a-uri'] })
    expect(result.valid).toBe(false)
  })

  it('rejects an empty redirect_uris array', () => {
    const result = validateClientMetadata({ redirect_uris: [] })
    expect(result.valid).toBe(false)
  })

  it('rejects a document over 5KB', () => {
    const result = validateClientMetadata({ client_name: 'x'.repeat(6000) })
    expect(result.valid).toBe(false)
    expect(result.errors.join()).toContain('exceeds max')
  })

  it('rejects unknown, non-namespaced top-level properties', () => {
    const result = validateClientMetadata({ totally_unknown_field: 'x' })
    expect(result.valid).toBe(false)
    expect(result.errors.join()).toContain('totally_unknown_field')
  })

  it('warns but allows a namespaced extension field', () => {
    const result = validateClientMetadata({ 'urn:example:custom': 'x' })
    expect(result.valid).toBe(true)
    expect(result.warnings.join()).toContain('urn:example:custom')
  })
})
