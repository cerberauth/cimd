import { readdirSync, mkdirSync, unlinkSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const templatesDirectory = resolve(root, 'templates')
const publicDirectory = resolve(root, 'public')

mkdirSync(publicDirectory, { recursive: true })

// The public files are generated deployment assets. Remove stale generated
// files first so deleting a source template also removes its public URL.
for (const filename of readdirSync(publicDirectory)) {
  if (filename.endsWith('-client.json')) unlinkSync(resolve(publicDirectory, filename))
}

for (const entry of readdirSync(templatesDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const source = resolve(templatesDirectory, entry.name, 'client-metadata.template.json')
  const target = resolve(publicDirectory, `${entry.name}-client.json`)
  copyFileSync(source, target)
}
