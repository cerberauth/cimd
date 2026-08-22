# CIMD — Client ID Metadata Documents

> **Note:** CIMD is currently an [IETF Internet-Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/). The specification may change before final adoption.

## What is CIMD?

Client ID Metadata Documents let an OAuth client identify itself with a URL. The URL points to a JSON document containing the client’s registration metadata, such as its name, redirect URIs, and authentication method.

That URL becomes the OAuth `client_id`. An authorization server can fetch the document when it needs the client’s metadata, so the client does not need to be registered separately with every authorization server first.

In practice:

1. Host a JSON document at a stable HTTPS URL.
2. Set its `client_id` property to that exact URL.
3. Pass the URL as `client_id` in the authorization request.
4. The authorization server fetches and validates the document.

```json
{
  "client_id": "https://example.com/oauth/client-metadata.json",
  "client_name": "My OAuth app",
  "client_uri": "https://example.com",
  "redirect_uris": ["https://example.com/oauth/callback"],
  "token_endpoint_auth_method": "none"
}
```

The document must be served over HTTPS, return `200 OK`, and contain a `client_id` that exactly matches the URL used to fetch it. CIMD does not use shared client secrets; public-key methods such as `private_key_jwt` can be used when client authentication is required. Authorization servers must explicitly support CIMD, and may apply their own trust and security policies.

Read the [OAuth Client ID Metadata Document draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/) for the complete protocol and security considerations.

## CIMD templates

[`cimd.cerberauth.com`](https://cimd.cerberauth.com) provides a small catalog of CIMD templates for common OAuth clients. Use them as starting points during local development, then update them for your application and production environment.

Templates are public JSON documents, available without cloning the repository:

- [`react-client.json`](https://cimd.cerberauth.com/react-client.json) — React / Vite
- [`nextjs-client.json`](https://cimd.cerberauth.com/nextjs-client.json) — Next.js
- [`vanilla-spa-client.json`](https://cimd.cerberauth.com/vanilla-spa-client.json) — plain browser JavaScript

Copy a template and replace its example values, especially `client_id`, `client_name`, `client_uri`, and `redirect_uris`. For production, publish the updated document at a permanent HTTPS URL on a domain you control. Do not use a localhost redirect, an example template unchanged, or an expiring development document as a production client identity.

These files are served as public static documents. The repository also contains the corresponding framework examples in [`templates/`](templates/).

## Development service

The service can provision temporary HTTPS Client Identifier URLs for local OAuth development:

```bash
curl -X POST https://cimd.cerberauth.com/api/clients \
  -H "Authorization: Bearer $CIMD_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "My Dev App",
    "redirect_uris": ["http://localhost:5173/callback"],
    "token_endpoint_auth_method": "none"
  }'
```

The returned `client_id` can be used directly in development. Provisioned documents expire by default after 7 days and are intended for development and testing only. Authorization servers are not required to support CIMD or service-provisioned clients.

## API reference

| Endpoint                  | Method | Auth                     | Description                           |
| ------------------------- | ------ | ------------------------ | ------------------------------------- |
| `/api/clients`            | POST   | Bearer JWT (JWKS)        | Provision a temporary client document |
| `/api/clients/:id`        | GET    | Bearer JWT + owner token | Read a provisioned document           |
| `/api/clients/:id`        | PUT    | Bearer JWT + owner token | Update a provisioned document         |
| `/api/clients/:id`        | DELETE | Bearer JWT + owner token | Revoke a provisioned document         |
| `/c/:id`                  | GET    | None                     | Serve a provisioned CIMD document     |
| `/:framework-client.json` | GET    | None                     | Serve a static starter template       |

## Local development

```bash
npm install
npm run dev
npm test
npm run typecheck
```

Configure a KV namespace in `wrangler.json` before deploying. The landing page is styled with [`@cerberauth/tokens`](https://github.com/cerberauth/design-system); `npm run build:css` regenerates `public/output.css`.

Licensed MIT.
