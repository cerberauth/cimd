export interface Env {
  CIMD_CLIENTS: KVNamespace
  CIMD_SERVICE_ORIGIN: string
  CIMD_DEFAULT_TTL_SECONDS: string
  CIMD_MAX_TTL_SECONDS: string
  // JWKS endpoint of the issuer trusted to call /api/*. Callers must present
  // a Bearer JWT signed by a key published there — this gates provisioning
  // access, separate from the per-client owner_token used for PUT/DELETE/GET.
  CIMD_API_JWKS_URI: string
  CIMD_API_ISSUER?: string
  CIMD_API_AUDIENCE?: string
}

export type TokenEndpointAuthMethod = 'none' | 'private_key_jwt'

export interface JsonWebKey {
  kty: string
  use?: string
  key_ops?: string[]
  alg?: string
  kid?: string
  [k: string]: unknown
}

export interface JsonWebKeySet {
  keys: JsonWebKey[]
}

/**
 * RFC 7591 metadata fields we accept, plus the non-normative
 * client_id_expires_at extension from Appendix A of the CIMD draft.
 */
export interface ClientMetadataDocument {
  client_id: string
  client_id_expires_at?: number
  client_name?: string
  redirect_uris?: string[]
  token_endpoint_auth_method?: TokenEndpointAuthMethod
  grant_types?: string[]
  response_types?: string[]
  scope?: string
  jwks?: JsonWebKeySet
  jwks_uri?: string
  logo_uri?: string
  client_uri?: string
  policy_uri?: string
  tos_uri?: string
  contacts?: string[]
  [k: string]: unknown
}

/** What a caller may submit; server always overwrites client_id + client_id_expires_at. */
export type ClientMetadataInput = Omit<ClientMetadataDocument, 'client_id' | 'client_id_expires_at'>

export interface StoredRecord {
  document: ClientMetadataDocument
  createdAt: number
  expiresAt: number
  ownerTokenHash: string
}
