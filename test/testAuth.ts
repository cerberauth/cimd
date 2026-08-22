import { vi } from 'vitest'
import { Jwt } from 'hono/utils/jwt'

export interface TestKeyPair {
  privateJwk: JsonWebKey & { kid: string; alg: string }
  publicJwk: JsonWebKey & { kid: string; alg: string }
}

export async function generateTestKeyPair(kid = 'test-key'): Promise<TestKeyPair> {
  const { privateKey, publicKey } = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const privateJwk = (await crypto.subtle.exportKey('jwk', privateKey)) as JsonWebKey
  const publicJwk = (await crypto.subtle.exportKey('jwk', publicKey)) as JsonWebKey
  return {
    privateJwk: { ...privateJwk, alg: 'RS256', kid },
    publicJwk: { ...publicJwk, alg: 'RS256', kid },
  }
}

export function signTestJwt(payload: Record<string, unknown>, keyPair: TestKeyPair): Promise<string> {
  return Jwt.sign(payload, keyPair.privateJwk, 'RS256')
}

/** Stubs global fetch so jwks_uri resolves to the given test public key. Returns a restore function. */
export function mockJwks(jwksUri: string, keyPair: TestKeyPair): () => void {
  const original = globalThis.fetch
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (url === jwksUri) {
      return new Response(JSON.stringify({ keys: [keyPair.publicJwk] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return original(input, init)
  }) as typeof fetch
  return () => {
    globalThis.fetch = original
  }
}
