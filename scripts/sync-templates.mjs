import { readdirSync, mkdirSync, unlinkSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const templatesDirectory = resolve(root, 'templates')
const publicDirectory = resolve(root, 'public')

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

for (const filename of readdirSync(templatesDirectory)) {
  if (!filename.endsWith('.json')) {
    continue
  }

  copyFileSync(resolve(templatesDirectory, filename), resolve(publicTemplatesDirectory, filename))
}
