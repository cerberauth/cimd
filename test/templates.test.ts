import { describe, it, expect } from 'vitest'
import app from '../src/index'
import { makeTestEnv } from './testKv'
import type { ClientTemplate } from '../src/types'

describe('CIMD templates endpoint (/t/ and /t)', () => {
  it('does not route root template filenames through Hono', async () => {
    const env = makeTestEnv()
    const res = await app.request('/react-spa-client.json', {}, env)
    expect(res.status).toBe(404)
  })

  it('serves HTML page when requested without Accept or with text/html at /t/', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/t/',
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      env,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('CIMD Templates Catalog')
    expect(html).toContain('template-search-input')
    expect(html).toContain('templates-grid')
    expect(html).toContain('templates-data')
    expect(html).toContain('React SPA')
    expect(html).toContain('Next.js App')
    expect(html).toContain('Terraform')
    expect(html).toContain('Native / CLI')
  })

  it('serves HTML page at /t', async () => {
    const env = makeTestEnv()
    const res = await app.request('/t', {}, env)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const html = await res.text()
    expect(html).toContain('CIMD Templates Catalog')
  })

  it('returns JSON array of templates when Accept is application/json at /t/', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/t/',
      {
        headers: {
          Accept: 'application/json',
        },
      },
      env,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')

    const templates = (await res.json()) as ClientTemplate[]
    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(50)

    const reactSpa = templates.find((t) => t.identifier === 'react-spa')
    expect(reactSpa).toBeDefined()
    expect(reactSpa?.client_name).toBe('React SPA')
    expect(reactSpa?.client_id).toBe('https://cimd.cerberauth.com/t/react-spa-client.json')
    expect(reactSpa?.application_type).toBe('spa')
    expect(reactSpa?.redirect_uris).toBeDefined()

    const terraform = templates.find((t) => t.identifier === 'terraform')
    expect(terraform).toBeDefined()
    expect(terraform?.client_name).toBe('Terraform')
    expect(terraform?.client_id).toBe('https://cimd.cerberauth.com/t/terraform-client.json')
    expect(terraform?.application_type).toBe('native')
    expect(terraform?.redirect_uris).toBeDefined()

    const opentofu = templates.find((t) => t.identifier === 'opentofu')
    expect(opentofu).toBeDefined()
    expect(opentofu?.client_name).toBe('OpenTofu')
    expect(opentofu?.application_type).toBe('native')

    const pulumi = templates.find((t) => t.identifier === 'pulumi')
    expect(pulumi).toBeDefined()
    expect(pulumi?.client_name).toBe('Pulumi')
    expect(pulumi?.application_type).toBe('native')

    const ansible = templates.find((t) => t.identifier === 'ansible')
    expect(ansible).toBeDefined()
    expect(ansible?.client_name).toBe('Ansible')
    expect(ansible?.application_type).toBe('native')

    const kubectl = templates.find((t) => t.identifier === 'kubectl')
    expect(kubectl).toBeDefined()
    expect(kubectl?.client_name).toBe('Kubectl')
    expect(kubectl?.application_type).toBe('native')
  })

  it('returns JSON array of templates when Accept is application/json at /t', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/t',
      {
        headers: {
          Accept: 'application/json',
        },
      },
      env,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')

    const templates = (await res.json()) as ClientTemplate[]
    expect(Array.isArray(templates)).toBe(true)
    expect(templates.length).toBeGreaterThan(50)
  })

  it('returns JSON when ?format=json query parameter is present', async () => {
    const env = makeTestEnv()
    const res = await app.request('/t/?format=json', {}, env)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')

    const templates = (await res.json()) as ClientTemplate[]
    expect(Array.isArray(templates)).toBe(true)
  })

  it('returns HTML when ?format=html is specified even if Accept contains application/json', async () => {
    const env = makeTestEnv()
    const res = await app.request(
      '/t/?format=html',
      {
        headers: {
          Accept: 'application/json',
        },
      },
      env,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })
})
