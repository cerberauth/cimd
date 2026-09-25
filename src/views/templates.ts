import { layout, escapeHtml } from './layout.js'
import type { ClientTemplate } from '../types.js'

function templateCard(template: ClientTemplate, origin: string): string {
  const filename = template.client_id.split('/').pop() || `${template.identifier || 'client'}.json`
  const localTemplateUrl = `${origin}/t/${filename}`
  const keywords = template.keywords || []
  const exampleRepo = template.example?.repository?.url
  const exampleUrl = template.example?.url

  const logoHtml = template.logo_uri
    ? `<img src="${escapeHtml(template.logo_uri)}" alt="${escapeHtml(template.client_name || '')} logo" class="w-8 h-8 object-contain shrink-0 rounded" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')" /><div class="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold hidden font-mono">${escapeHtml((template.client_name || 'C').charAt(0))}</div>`
    : `<div class="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold font-mono">${escapeHtml((template.client_name || 'C').charAt(0))}</div>`

  const appTypeBadge = template.application_type
    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
        template.application_type === 'spa'
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-muted text-muted-fg border border-border'
      }">${escapeHtml(template.application_type)}</span>`
    : ''

  const keywordChips = keywords
    .slice(0, 4)
    .map(
      (kw) =>
        `<button type="button" class="tag-filter-btn text-xs px-2 py-0.5 rounded bg-muted/60 text-muted-fg hover:bg-muted hover:text-on-surface transition-colors cursor-pointer" data-tag="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`,
    )
    .join('')

  return `
    <article class="template-card bg-card text-card-fg border border-border rounded-xl p-5 hover:border-outline-variant transition-all flex flex-col justify-between"
      data-id="${escapeHtml(template.identifier || '')}"
      data-name="${escapeHtml((template.client_name || '').toLowerCase())}"
      data-type="${escapeHtml((template.application_type || '').toLowerCase())}"
      data-keywords="${escapeHtml(keywords.join(' ').toLowerCase())}"
      data-description="${escapeHtml((template.description || '').toLowerCase())}">
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            ${logoHtml}
            <div class="min-w-0">
              <h2 class="font-semibold text-base tracking-tight truncate">${escapeHtml(template.client_name || 'Unnamed Client')}</h2>
              ${template.identifier ? `<p class="font-mono text-xs text-muted-fg truncate">${escapeHtml(template.identifier)}</p>` : ''}
            </div>
          </div>
          ${appTypeBadge}
        </div>

        <p class="text-muted-fg text-sm leading-relaxed mb-4 line-clamp-2">${escapeHtml(template.description || '')}</p>

        ${keywords.length ? `<div class="flex flex-wrap gap-1.5 mb-4">${keywordChips}</div>` : ''}
      </div>

      <div class="pt-4 border-t border-border flex items-center justify-between gap-2 flex-wrap text-xs">
        <div class="flex items-center gap-3">
          <a href="${escapeHtml(localTemplateUrl)}" target="_blank" rel="noopener" class="font-mono text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 font-medium">
            JSON template ↗
          </a>
          ${
            exampleRepo
              ? `<a href="${escapeHtml(exampleRepo)}" target="_blank" rel="noopener nofollow" class="text-muted-fg hover:text-on-surface-variant transition-colors inline-flex items-center gap-1">
                  Example repo ↗
                </a>`
              : exampleUrl
                ? `<a href="${escapeHtml(exampleUrl)}" target="_blank" rel="noopener nofollow" class="text-muted-fg hover:text-on-surface-variant transition-colors inline-flex items-center gap-1">
                    Example ↗
                  </a>`
                : ''
          }
        </div>
        <button type="button" class="copy-client-id-btn text-xs px-2.5 py-1 rounded border border-border bg-surface hover:bg-accent text-on-surface-variant transition-colors cursor-pointer" data-copy="${escapeHtml(template.client_id)}">
          Copy client_id
        </button>
      </div>
    </article>`
}

export function templatesPage(templates: ClientTemplate[], origin: string): string {
  const description =
    'Browse and search reusable OAuth 2.0 Client ID Metadata Document (CIMD) templates for over 70 web and SPA frameworks and languages.'
  const canonicalUrl = `${origin}/t/`

  const cardsHtml = templates.map((t) => templateCard(t, origin)).join('')

  return layout(
    'CIMD Templates',
    `
    <section class="max-w-6xl mx-auto px-6 pt-16 pb-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full border border-primary/20 mb-6 font-medium uppercase tracking-wider">
          OAuth Client ID Metadata Documents
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold mb-4 tracking-tight leading-tight">
          CIMD Templates Catalog
        </h1>
        <p class="text-lg text-muted-fg leading-relaxed mb-6">
          Browse and search ready-to-use Client ID Metadata Document templates. Filter by framework, language, or application type, and use them as starting points for local development.
        </p>
      </div>

      <!-- Search and Filter Controls -->
      <div class="bg-card border border-border rounded-xl p-5 mb-8 space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-fg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input id="template-search-input" type="search" autocomplete="off" spellcheck="false"
              placeholder="Search templates by framework, keyword, or language (press '/' to focus)..."
              class="w-full pl-10 pr-10 py-2.5 text-sm bg-surface border border-border rounded-lg text-on-surface placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-ring" />
            <button id="template-search-clear" type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-fg hover:text-on-surface hidden cursor-pointer" aria-label="Clear search">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 shrink-0" role="group" aria-label="Application Type Filter">
            <button type="button" data-filter-type="all" class="type-filter-btn px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-fg transition-colors" aria-pressed="true">All</button>
            <button type="button" data-filter-type="spa" class="type-filter-btn px-3 py-1.5 rounded-md text-xs font-medium text-muted-fg hover:text-on-surface transition-colors" aria-pressed="false">SPA</button>
            <button type="button" data-filter-type="web" class="type-filter-btn px-3 py-1.5 rounded-md text-xs font-medium text-muted-fg hover:text-on-surface transition-colors" aria-pressed="false">Web App</button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-muted-fg flex-wrap gap-2 pt-2 border-t border-border">
          <div class="flex items-center gap-2 flex-wrap" id="popular-tags">
            <span class="font-medium">Popular:</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="javascript">JavaScript</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="react">React</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="python">Python</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="golang">Go</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="java">Java</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="php">PHP</button>
            <span>·</span>
            <button type="button" class="tag-filter-btn hover:text-primary transition-colors cursor-pointer" data-tag="dotnet">.NET</button>
          </div>

          <div class="flex items-center gap-2">
            <span id="template-count" class="font-medium">${templates.length} templates</span>
            <a href="/t/?format=json" class="text-primary hover:text-primary/80 transition-colors font-mono">View raw JSON</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Templates Grid Section -->
    <section class="max-w-6xl mx-auto px-6 pb-20">
      <div id="templates-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${cardsHtml}
      </div>

      <!-- Empty Search State -->
      <div id="templates-empty" class="hidden text-center py-16 bg-card border border-border rounded-xl p-8 max-w-xl mx-auto">
        <svg class="w-12 h-12 text-muted-fg mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 class="text-lg font-bold mb-2">No templates found</h2>
        <p class="text-muted-fg text-sm mb-6" id="empty-message">No templates matched your search criteria.</p>
        <button id="reset-search-btn" type="button" class="inline-flex items-center gap-2 bg-primary text-primary-fg font-semibold hover:bg-primary/90 px-4 py-2 rounded-lg transition-all text-xs cursor-pointer">
          Clear search & filters
        </button>
      </div>
    </section>

    <!-- Embedded templates JSON for browser-side search -->
    <script id="templates-data" type="application/json">
      ${JSON.stringify(templates)}
    </script>

    <script>
      (function () {
        var rawDataEl = document.getElementById('templates-data')
        var templates = []
        try {
          templates = JSON.parse(rawDataEl.textContent || '[]')
        } catch (e) {
          templates = []
        }

        var searchInput = document.getElementById('template-search-input')
        var clearBtn = document.getElementById('template-search-clear')
        var countEl = document.getElementById('template-count')
        var emptyEl = document.getElementById('templates-empty')
        var emptyMsgEl = document.getElementById('empty-message')
        var resetBtn = document.getElementById('reset-search-btn')
        var gridEl = document.getElementById('templates-grid')
        var cardEls = Array.from(document.querySelectorAll('.template-card'))
        var typeButtons = Array.from(document.querySelectorAll('.type-filter-btn'))
        var tagButtons = Array.from(document.querySelectorAll('.tag-filter-btn'))

        var currentType = 'all'
        var currentQuery = ''

        // Map identifier/filename to DOM element
        var cardMap = new Map()
        cardEls.forEach(function (card) {
          var id = card.getAttribute('data-id')
          if (id) cardMap.set(id, card)
        })

        function filterTemplates() {
          var q = currentQuery.trim().toLowerCase()
          var tokens = q ? q.split(/\\s+/).filter(Boolean) : []
          var visibleCount = 0

          templates.forEach(function (template) {
            var card = cardMap.get(template.identifier) || document.querySelector('.template-card[data-id="' + template.identifier + '"]')
            if (!card) return

            // 1. Check application type filter
            if (currentType !== 'all') {
              var appType = (template.application_type || '').toLowerCase()
              if (appType !== currentType) {
                card.classList.add('hidden')
                return
              }
            }

            // 2. Check query search tokens
            if (tokens.length > 0) {
              var name = (template.client_name || '').toLowerCase()
              var desc = (template.description || '').toLowerCase()
              var id = (template.identifier || '').toLowerCase()
              var kws = Array.isArray(template.keywords) ? template.keywords.join(' ').toLowerCase() : ''
              var scopes = (template.scope || '').toLowerCase()
              var grants = Array.isArray(template.grant_types) ? template.grant_types.join(' ').toLowerCase() : ''
              var searchable = name + ' ' + desc + ' ' + id + ' ' + kws + ' ' + scopes + ' ' + grants

              var allMatched = tokens.every(function (token) {
                return searchable.indexOf(token) !== -1
              })

              if (!allMatched) {
                card.classList.add('hidden')
                return
              }
            }

            // If it passed all filters:
            card.classList.remove('hidden')
            visibleCount++
          })

          // Update count and empty state
          if (countEl) {
            countEl.textContent = 'Showing ' + visibleCount + ' of ' + templates.length + ' template' + (templates.length === 1 ? '' : 's')
          }

          if (clearBtn) {
            clearBtn.classList.toggle('hidden', !q)
          }

          if (emptyEl && gridEl) {
            if (visibleCount === 0) {
              emptyEl.classList.remove('hidden')
              gridEl.classList.add('hidden')
              if (emptyMsgEl) {
                emptyMsgEl.textContent = 'No templates matching "' + currentQuery + '"' + (currentType !== 'all' ? ' in ' + currentType.toUpperCase() : '') + '.'
              }
            } else {
              emptyEl.classList.add('hidden')
              gridEl.classList.remove('hidden')
            }
          }
        }

        // Search Input Listener
        if (searchInput) {
          searchInput.addEventListener('input', function () {
            currentQuery = searchInput.value
            filterTemplates()
          })

          // Press '/' to focus search input
          window.addEventListener('keydown', function (e) {
            if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
              e.preventDefault()
              searchInput.focus()
            }
            if (e.key === 'Escape' && document.activeElement === searchInput) {
              searchInput.value = ''
              currentQuery = ''
              filterTemplates()
              searchInput.blur()
            }
          })
        }

        // Clear Search Button
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            if (searchInput) {
              searchInput.value = ''
              searchInput.focus()
            }
            currentQuery = ''
            filterTemplates()
          })
        }

        // Reset Button in Empty State
        if (resetBtn) {
          resetBtn.addEventListener('click', function () {
            if (searchInput) searchInput.value = ''
            currentQuery = ''
            currentType = 'all'
            updateTypeButtons()
            filterTemplates()
          })
        }

        function updateTypeButtons() {
          typeButtons.forEach(function (btn) {
            var active = btn.getAttribute('data-filter-type') === currentType
            btn.setAttribute('aria-pressed', active ? 'true' : 'false')
            btn.classList.toggle('bg-primary', active)
            btn.classList.toggle('text-primary-fg', active)
            btn.classList.toggle('text-muted-fg', !active)
          })
        }

        // Type filter buttons
        typeButtons.forEach(function (btn) {
          btn.addEventListener('click', function () {
            currentType = btn.getAttribute('data-filter-type') || 'all'
            updateTypeButtons()
            filterTemplates()
          })
        })

        // Keyword tag buttons
        document.addEventListener('click', function (e) {
          var tagBtn = e.target.closest('.tag-filter-btn')
          if (tagBtn) {
            var tag = tagBtn.getAttribute('data-tag')
            if (tag && searchInput) {
              searchInput.value = tag
              currentQuery = tag
              filterTemplates()
              searchInput.focus()
            }
          }
        })

        // Copy client_id button
        document.addEventListener('click', function (e) {
          var copyBtn = e.target.closest('.copy-client-id-btn')
          if (!copyBtn) return
          var textToCopy = copyBtn.getAttribute('data-copy')
          if (!textToCopy) return

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function () {
              var prevText = copyBtn.textContent
              copyBtn.textContent = 'Copied!'
              copyBtn.classList.add('text-success', 'border-success/30')
              setTimeout(function () {
                copyBtn.textContent = prevText
                copyBtn.classList.remove('text-success', 'border-success/30')
              }, 2000)
            })
          }
        })

        // Check URL search params for deep linking (e.g. ?q=react or ?type=spa)
        var params = new URLSearchParams(window.location.search)
        var initialQ = params.get('q')
        var initialType = params.get('type')
        if (initialType && (initialType === 'spa' || initialType === 'web')) {
          currentType = initialType
          updateTypeButtons()
        }
        if (initialQ && searchInput) {
          searchInput.value = initialQ
          currentQuery = initialQ
        }
        if (initialQ || initialType) {
          filterTemplates()
        }
      })()
    </script>
  `,
    description,
    canonicalUrl,
  )
}
