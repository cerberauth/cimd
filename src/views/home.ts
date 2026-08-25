import { layout, escapeHtml } from './layout.js'

const TEMPLATES = [
  { name: 'React SPA', file: 'react-spa-client.json', note: 'Browser application starter' },
  { name: 'Next.js App', file: 'nextjs-app-client.json', note: 'Server-side application starter' },
  { name: 'SPA Starter', file: 'spa-client.json', note: 'Single Page Application with OpenID Connect' },
]

export function homePage(origin: string): string {
  const templateCards = TEMPLATES.map(
    ({ name, file, note }) => `
      <article class="bg-card text-card-fg border border-border rounded-xl p-5 hover:border-outline-variant transition-colors">
        <h3 class="font-semibold mb-1">${escapeHtml(name)}</h3>
        <p class="text-muted-fg text-sm leading-relaxed mb-4">${escapeHtml(note)}</p>
        <div class="flex items-center gap-3 text-xs">
          <a href="https://github.com/cerberauth/cimd/blob/main/templates/${file}" target="_blank" rel="noopener nofollow" class="text-primary hover:text-primary/80 transition-colors">Example code →</a>
          <a href="${escapeHtml(origin)}/t/${file}" target="_blank" rel="noopener" class="font-mono text-muted-fg hover:text-on-surface-variant transition-colors">JSON template</a>
        </div>
      </article>`,
  ).join('')

  const description =
    'CIMD lets OAuth clients identify themselves with a URL. Browse reusable CIMD templates for local development and production.'

  return layout(
    'What is CIMD?',
    `
    <section class="max-w-4xl mx-auto px-6 pt-24 pb-20">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full border border-primary/20 mb-8 font-medium uppercase tracking-wider">
          OAuth Client ID Metadata Documents
        </div>
        <h1 class="text-5xl sm:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
          OAuth client identity,<br/><span class="text-primary">served as a URL.</span>
        </h1>
        <p class="text-xl text-muted-fg mb-8 max-w-2xl leading-relaxed">
          CIMD lets an OAuth client identify itself with a URL instead of a pre-registered client ID. The URL points to a JSON document containing the client's metadata.
        </p>
        <div class="flex items-center gap-3 flex-wrap">
          <a href="#templates" class="inline-flex items-center gap-2 bg-primary text-primary-fg font-semibold hover:bg-primary/90 px-6 py-3 rounded-lg transition-all text-sm">Browse templates →</a>
          <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/" target="_blank" rel="noopener" class="inline-flex items-center gap-2 border border-border bg-surface hover:bg-accent text-on-surface-variant px-6 py-3 rounded-lg transition-colors text-sm">Read the IETF draft</a>
        </div>
      </div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-card text-card-fg border border-border rounded-xl p-6">
          <h2 class="text-2xl font-bold mb-3">What is a CIMD?</h2>
          <p class="text-muted-fg leading-relaxed">A Client ID Metadata Document is a JSON document served at a stable HTTPS URL. It contains familiar OAuth registration metadata such as <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_name</code>, <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_uri</code>, and <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">redirect_uris</code>.</p>
        </div>
        <div class="bg-card text-card-fg border border-border rounded-xl p-6">
          <h2 class="text-2xl font-bold mb-3">Why use one?</h2>
          <p class="text-muted-fg leading-relaxed">The URL is the <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_id</code>. An authorization server can fetch and validate the document when needed, removing the need to register the same client separately with every server.</p>
        </div>
      </div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-20">
      <h2 class="text-2xl font-bold mb-2">How CIMD works</h2>
      <p class="text-muted-fg text-sm mb-8">The metadata document is the registration.</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-card text-card-fg border border-border rounded-xl p-6"><div class="text-primary font-mono text-xs font-semibold mb-3">01</div><h3 class="font-semibold mb-2">Host metadata</h3><p class="text-muted-fg text-sm leading-relaxed">Serve a JSON document at an HTTPS URL. Its <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_id</code> must exactly match that URL.</p></div>
        <div class="bg-card text-card-fg border border-border rounded-xl p-6"><div class="text-primary font-mono text-xs font-semibold mb-3">02</div><h3 class="font-semibold mb-2">Use the URL</h3><p class="text-muted-fg text-sm leading-relaxed">Pass the metadata URL as <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_id</code> in the OAuth authorization request.</p></div>
        <div class="bg-card text-card-fg border border-border rounded-xl p-6"><div class="text-primary font-mono text-xs font-semibold mb-3">03</div><h3 class="font-semibold mb-2">Server validates it</h3><p class="text-muted-fg text-sm leading-relaxed">The authorization server fetches the JSON, checks its fields, and can display the client identity during consent.</p></div>
      </div>
      <pre class="mt-4 bg-surface-container border border-border rounded-xl px-6 py-5 text-sm text-success overflow-x-auto leading-7"><code>{
  "client_id": "https://example.com/oauth/client-metadata.json",
  "client_name": "My OAuth app",
  "redirect_uris": ["https://example.com/oauth/callback"],
  "token_endpoint_auth_method": "none"
}</code></pre>
    </section>

    <section id="templates" class="max-w-4xl mx-auto px-6 pb-20">
      <h2 class="text-2xl font-bold mb-2">CIMD templates</h2>
      <p class="text-muted-fg text-sm mb-6 max-w-2xl">${escapeHtml(origin)} lists reusable templates for common OAuth clients. Start with one locally, then update its values for your application.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${templateCards}</div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-20">
      <div class="flex gap-4 items-start bg-primary/5 border border-primary/20 rounded-xl px-6 py-5">
        <span class="text-primary text-lg shrink-0">↗</span>
        <div>
          <p class="font-medium text-on-surface text-sm">From local development to production</p>
          <p class="text-on-surface-variant text-sm mt-1 leading-relaxed">Copy a template and replace the example metadata, especially <code class="bg-muted border border-border px-1 py-0.5 rounded text-xs">client_id</code>, redirect URIs, and application details. For production, serve the updated document from a permanent HTTPS URL on a domain you control. Development templates and expiring service URLs are not production client identities.</p>
        </div>
      </div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-20">
      <h2 class="text-2xl font-bold mb-2">Need a URL for local OAuth?</h2>
      <p class="text-muted-fg text-sm mb-5 max-w-2xl">The CIMD service can provision a temporary document for development, including localhost redirect URIs. Provisioned documents expire and are for development and testing only.</p>
      <pre class="bg-card border border-border rounded-xl px-6 py-5 text-sm text-success overflow-x-auto leading-7"><code>curl -X POST ${escapeHtml(origin)}/api/clients \\
  -H "Authorization: Bearer $CIMD_API_TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"client_name":"My Dev App","redirect_uris":["http://localhost:5173/callback"],"token_endpoint_auth_method":"none"}'</code></pre>
    </section>
  `,
    description,
    origin,
  )
}
