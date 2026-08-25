import { layout, escapeHtml } from './layout.js'

interface FieldRow {
  name: string
  type: string
  note: string
}

const REQUIRED_FIELDS: FieldRow[] = [
  {
    name: 'client_id',
    type: 'string (URL)',
    note: 'Always required. Must be the exact https URL the document is served from — no userinfo, has a path, no "." / ".." segments, no fragment.',
  },
  {
    name: 'redirect_uris',
    type: 'array of URIs',
    note: 'Required when the client uses the authorization code or implicit flow. Absolute redirect URIs.',
  },
  {
    name: 'jwks or jwks_uri',
    type: 'object / string (URL)',
    note: 'Required (one of the two) when token_endpoint_auth_method is private_key_jwt, to publish the public key used to verify the client assertion.',
  },
]

const RECOMMENDED_FIELDS: FieldRow[] = [
  { name: 'client_name', type: 'string', note: 'Human-readable name shown to end users during consent.' },
  {
    name: 'token_endpoint_auth_method',
    type: 'string',
    note: '"none" or "private_key_jwt" only. Shared-secret methods (client_secret_post/basic/jwt) are forbidden for CIMD clients.',
  },
  { name: 'client_uri', type: 'string (URL)', note: "The client application's homepage." },
  {
    name: 'logo_uri',
    type: 'string (URL)',
    note: 'Authorization servers are expected to prefetch and cache this, not hotlink it.',
  },
]

const OPTIONAL_FIELDS: FieldRow[] = [
  {
    name: 'grant_types',
    type: 'array of strings',
    note: 'From the OAuth Dynamic Client Registration grant type registry.',
  },
  {
    name: 'response_types',
    type: 'array of strings',
    note: 'From the OAuth Dynamic Client Registration response type registry.',
  },
  {
    name: 'scope',
    type: 'string (space-delimited)',
    note: 'Requested scopes; the authorization server may restrict these regardless.',
  },
  { name: 'policy_uri', type: 'string (URL)', note: 'Privacy policy link.' },
  { name: 'tos_uri', type: 'string (URL)', note: 'Terms of service link.' },
  { name: 'contacts', type: 'array of strings', note: 'Contact addresses for the client operator.' },
  {
    name: 'software_id',
    type: 'string',
    note: 'Identifier for the client software, shared across instances/versions.',
  },
  { name: 'software_version', type: 'string', note: 'Version of the client software.' },
  {
    name: 'client_id_expires_at',
    type: 'number (unix time)',
    note: 'Non-normative extension for ephemeral/provisioned clients; server-assigned, informative only.',
  },
]

const FORBIDDEN_FIELDS: FieldRow[] = [
  {
    name: 'client_secret',
    type: '—',
    note: 'MUST NOT be present. CIMD clients are public or use asymmetric auth, never a shared secret.',
  },
  { name: 'client_secret_expires_at', type: '—', note: 'MUST NOT be present, for the same reason.' },
  {
    name: 'token_endpoint_auth_method = client_secret_*',
    type: '—',
    note: 'client_secret_post, client_secret_basic, and client_secret_jwt are all forbidden.',
  },
  {
    name: 'private/symmetric members inside jwks',
    type: '—',
    note: '"d", "p", "q", "dp", "dq", "qi", "k" must never appear — jwks is public-key-only.',
  },
]

const CHECKLIST = [
  'client_id uses the https scheme, with no userinfo component.',
  'client_id has a path component, and that path contains no "." or ".." segments.',
  'client_id has no fragment; a query component is discouraged but not forbidden.',
  'The document\'s own "client_id" field matches the URL it was fetched from, via exact string comparison.',
  'The fetch is not redirected automatically — a non-200 response (including 3xx) is treated as invalid.',
  'The response body is capped at 5&nbsp;KB; oversized responses are rejected.',
  'The document is well-formed JSON and a top-level object (RFC&nbsp;8259).',
  'No client_secret, client_secret_expires_at, or shared-secret auth method is present.',
  'Any jwks entries are public keys only — no private or symmetric key members.',
  'Unrecognized top-level fields are rejected unless namespaced (contain a ":") as an extension.',
  'private_key_jwt as token_endpoint_auth_method is paired with a jwks or jwks_uri.',
]

function fieldTable(rows: FieldRow[]): string {
  return `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr class="border-b border-border last:border-0">
              <td class="py-2.5 pr-4 align-top font-mono text-xs whitespace-nowrap text-on-surface">${escapeHtml(row.name)}</td>
              <td class="py-2.5 pr-4 align-top whitespace-nowrap text-xs text-muted-fg">${escapeHtml(row.type)}</td>
              <td class="py-2.5 align-top text-muted-fg leading-relaxed">${escapeHtml(row.note)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`
}

export function validatorPage(origin: string): string {
  const description =
    'Validate a CIMD client_id URL or raw JSON document against the RFC 7591 registry and the CIMD draft rules.'

  return layout(
    'CIMD Validator',
    `
    <section class="max-w-4xl mx-auto px-6 pt-16 pb-10">
      <h1 class="text-4xl font-bold mb-3 tracking-tight">CIMD Validator</h1>
      <p class="text-muted-fg text-lg leading-relaxed max-w-2xl">
        Check a Client ID Metadata Document against the
        <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/" target="_blank" rel="noopener" class="text-primary hover:text-primary/80">CIMD draft</a>
        and the RFC&nbsp;7591 metadata registry. Paste a client_id URL to fetch and check it live, or paste raw JSON to check a document before you host it.
      </p>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-16">
      <div class="bg-card text-card-fg border border-border rounded-xl p-6">
        <div class="flex gap-2 mb-4" role="tablist">
          <button type="button" data-tab="url" class="cimd-tab inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-border bg-primary text-primary-fg transition-colors" aria-pressed="true">client_id URL</button>
          <button type="button" data-tab="json" class="cimd-tab inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface text-on-surface-variant hover:bg-accent transition-colors" aria-pressed="false">Raw JSON</button>
        </div>

        <div data-panel="url">
          <label for="cimd-url-input" class="block text-xs font-medium text-muted-fg mb-2">client_id URL</label>
          <input id="cimd-url-input" type="text" inputmode="url" autocomplete="off" spellcheck="false"
            placeholder="https://example.com/oauth/client-metadata.json"
            class="w-full font-mono text-sm bg-surface border border-border rounded-lg px-4 py-3 text-on-surface placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring" />
          <p class="text-xs text-muted-fg mt-2">Fetched server-side. Redirects are not followed, per the draft.</p>
        </div>

        <div data-panel="json" class="hidden">
          <label for="cimd-json-input" class="block text-xs font-medium text-muted-fg mb-2">Raw JSON document</label>
          <textarea id="cimd-json-input" rows="8" spellcheck="false"
            placeholder='{
  "client_id": "https://example.com/oauth/client-metadata.json",
  "client_name": "My OAuth app",
  "redirect_uris": ["https://example.com/oauth/callback"],
  "token_endpoint_auth_method": "none"
}'
            class="w-full font-mono text-sm bg-surface border border-border rounded-lg px-4 py-3 text-on-surface placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button type="button" id="cimd-validate-btn" class="inline-flex items-center gap-2 bg-primary text-primary-fg font-semibold hover:bg-primary/90 px-5 py-2.5 rounded-lg transition-all text-sm disabled:opacity-50">Validate</button>
          <span id="cimd-validate-status" class="text-xs text-muted-fg"></span>
        </div>

        <div id="cimd-result" class="mt-6 hidden"></div>
      </div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-12">
      <h2 class="text-2xl font-bold mb-2">Fields</h2>
      <p class="text-muted-fg text-sm mb-6 max-w-2xl">What this validator checks against the RFC&nbsp;7591 registry and the CIMD draft's restrictions on top of it.</p>

      <div class="mb-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-destructive mb-2">Required</h3>
        <div class="bg-card border border-border rounded-xl px-5">${fieldTable(REQUIRED_FIELDS)}</div>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-warning mb-2">Recommended</h3>
        <div class="bg-card border border-border rounded-xl px-5">${fieldTable(RECOMMENDED_FIELDS)}</div>
      </div>

      <div class="mb-6">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-fg mb-2">Optional</h3>
        <div class="bg-card border border-border rounded-xl px-5">${fieldTable(OPTIONAL_FIELDS)}</div>
      </div>

      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-destructive mb-2">Forbidden</h3>
        <div class="bg-card border border-border rounded-xl px-5">${fieldTable(FORBIDDEN_FIELDS)}</div>
      </div>
    </section>

    <section class="max-w-4xl mx-auto px-6 pb-20">
      <h2 class="text-2xl font-bold mb-2">Checklist</h2>
      <p class="text-muted-fg text-sm mb-6 max-w-2xl">What an authorization server is expected to check before it trusts a client_id URL and the document behind it — and what this validator applies.</p>
      <div class="bg-card border border-border rounded-xl p-6">
        <ul class="space-y-3">
          ${CHECKLIST.map(
            (item) => `
          <li class="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed">
            <span class="text-success shrink-0 mt-0.5">✓</span>
            <span>${item}</span>
          </li>`,
          ).join('')}
        </ul>
      </div>
    </section>

    <script>
      (function () {
        var tabs = document.querySelectorAll('.cimd-tab')
        var panels = { url: document.querySelector('[data-panel="url"]'), json: document.querySelector('[data-panel="json"]') }
        tabs.forEach(function (tab) {
          tab.addEventListener('click', function () {
            var target = tab.getAttribute('data-tab')
            tabs.forEach(function (t) {
              var active = t === tab
              t.setAttribute('aria-pressed', active ? 'true' : 'false')
              t.classList.toggle('bg-primary', active)
              t.classList.toggle('text-primary-fg', active)
              t.classList.toggle('bg-surface', !active)
              t.classList.toggle('text-on-surface-variant', !active)
            })
            Object.keys(panels).forEach(function (key) {
              panels[key].classList.toggle('hidden', key !== target)
            })
          })
        })

        function escapeHtml(str) {
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
        }

        function renderList(items, colorClass, icon) {
          if (!items.length) return ''
          return (
            '<ul class="space-y-2 mb-4">' +
            items
              .map(function (item) {
                return (
                  '<li class="flex items-start gap-2 text-sm ' +
                  colorClass +
                  '"><span class="shrink-0 mt-0.5">' +
                  icon +
                  '</span><span>' +
                  escapeHtml(item) +
                  '</span></li>'
                )
              })
              .join('') +
            '</ul>'
          )
        }

        var btn = document.getElementById('cimd-validate-btn')
        var status = document.getElementById('cimd-validate-status')
        var resultEl = document.getElementById('cimd-result')
        var urlInput = document.getElementById('cimd-url-input')
        var jsonInput = document.getElementById('cimd-json-input')

        btn.addEventListener('click', function () {
          var activeTab = document.querySelector('.cimd-tab[aria-pressed="true"]').getAttribute('data-tab')
          var value = activeTab === 'url' ? urlInput.value.trim() : jsonInput.value.trim()
          if (!value) {
            status.textContent = activeTab === 'url' ? 'Enter a client_id URL first.' : 'Paste a JSON document first.'
            return
          }

          btn.disabled = true
          status.textContent = activeTab === 'url' ? 'Fetching and validating…' : 'Validating…'
          resultEl.classList.add('hidden')

          fetch('/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: activeTab, value: value }),
          })
            .then(function (res) {
              return res.json().then(function (body) {
                return { ok: res.ok, body: body }
              })
            })
            .then(function (result) {
              status.textContent = ''
              btn.disabled = false
              resultEl.classList.remove('hidden')

              if (!result.ok) {
                resultEl.innerHTML =
                  '<div class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">' +
                  escapeHtml(result.body.error || 'Request failed.') +
                  '</div>'
                return
              }

              var body = result.body
              var banner = body.valid
                ? '<div class="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium mb-4">Valid CIMD document.</div>'
                : '<div class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium mb-4">' +
                  body.errors.length +
                  ' error' +
                  (body.errors.length === 1 ? '' : 's') +
                  ' found.</div>'

              var errorsHtml = renderList(body.errors || [], 'text-destructive', '✗')
              var warningsHtml = renderList(body.warnings || [], 'text-warning', '⚠')
              var docHtml = body.document
                ? '<div class="mt-2"><p class="text-xs font-medium text-muted-fg mb-2">Resolved document</p><pre class="bg-surface-container border border-border rounded-lg px-4 py-3 text-xs overflow-x-auto leading-6">' +
                  escapeHtml(JSON.stringify(body.document, null, 2)) +
                  '</pre></div>'
                : ''

              resultEl.innerHTML = banner + errorsHtml + warningsHtml + docHtml
            })
            .catch(function (err) {
              btn.disabled = false
              status.textContent = ''
              resultEl.classList.remove('hidden')
              resultEl.innerHTML =
                '<div class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">' +
                escapeHtml(err && err.message ? err.message : 'Request failed.') +
                '</div>'
            })
        })
      })()
    </script>
  `,
    description,
    origin + '/validate',
  )
}
