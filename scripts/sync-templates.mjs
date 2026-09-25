import { readdirSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const templatesDirectory = resolve(root, 'templates')
const publicDirectory = resolve(root, 'public')
const srcDirectory = resolve(root, 'src')

mkdirSync(publicDirectory, { recursive: true })

// The public files are generated deployment assets. Remove stale generated
// files first so deleting a source template also removes its public URL.
const publicTemplatesDirectory = resolve(publicDirectory, 't')
mkdirSync(publicTemplatesDirectory, { recursive: true })

for (const filename of readdirSync(publicTemplatesDirectory)) {
  if (filename.endsWith('.json')) {
    unlinkSync(resolve(publicTemplatesDirectory, filename))
  }
}

const templates = []
const filenames = readdirSync(templatesDirectory)
  .filter((filename) => filename.endsWith('.json'))
  .sort()

for (const filename of filenames) {
  const filePath = resolve(templatesDirectory, filename)
  copyFileSync(filePath, resolve(publicTemplatesDirectory, filename))

  const content = JSON.parse(readFileSync(filePath, 'utf8'))
  templates.push(content)
}

templates.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''))

const templatesJson = JSON.stringify(templates, null, 2) + '\n'
writeFileSync(resolve(srcDirectory, 'templates.json'), templatesJson)
