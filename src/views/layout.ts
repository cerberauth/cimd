export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function layout(title: string, body: string, description?: string, url?: string): string {
  const desc =
    description || 'CIMD Service — provisions temporary, real HTTPS client_id URLs for local OAuth development.'
  const ogUrl = url || 'https://cimd.cerberauth.com'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script>
    (function () {
      var mql = window.matchMedia('(prefers-color-scheme: dark)')
      var apply = function (matches) {
        document.documentElement.setAttribute('data-theme', matches ? 'dark' : 'light')
      }
      apply(mql.matches)
      mql.addEventListener('change', function (e) {
        apply(e.matches)
      })
    })()
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta name="keywords" content="CIMD, OAuth 2.0, client id metadata document, dynamic client registration, OIDC" />
  <meta property="og:title" content="${escapeHtml(title)} — cimd" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)} — cimd" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${escapeHtml(ogUrl)}" />
  <title>${escapeHtml(title)} — cimd</title>
  <link rel="stylesheet" href="/output.css" />
</head>
<body class="min-h-screen flex flex-col antialiased">
  <header class="border-b border-border shrink-0">
    <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/" class="text-xl font-bold tracking-tight text-on-surface hover:text-on-surface hover:no-underline">
        c<span class="text-primary">imd</span>
      </a>
      <div class="flex items-center gap-4">
        <a href="/validate" class="text-sm text-muted-fg hover:text-on-surface-variant hover:no-underline transition-colors">Validator</a>
        <span class="inline-flex items-center justify-center rounded-full border border-transparent bg-warning text-warning-fg px-2.5 py-1 text-xs font-medium">
          DEV ONLY
        </span>
      </div>
    </div>
  </header>
  <div class="flex-1">
    ${body}
  </div>
  <footer class="border-t border-border shrink-0">
    <div class="max-w-5xl mx-auto px-6 py-4 text-center text-muted-fg text-xs">
      <a href="https://github.com/cerberauth/cimd" target="_blank" rel="noopener" class="text-muted-fg hover:text-on-surface-variant hover:no-underline transition-colors">Open Source</a>
      &nbsp;·&nbsp; cimd by <a href="https://www.cerberauth.com" target="_blank" class="text-muted-fg hover:text-on-surface-variant hover:no-underline transition-colors">CerberAuth</a>
      &nbsp;·&nbsp; <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/" target="_blank" rel="noopener" class="text-muted-fg hover:text-on-surface-variant hover:no-underline transition-colors">IETF draft</a>
      &nbsp;·&nbsp; For development and testing only
    </div>
  </footer>
</body>
</html>`
}
