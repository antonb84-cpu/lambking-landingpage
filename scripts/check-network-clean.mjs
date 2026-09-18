import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const targetDirectory = path.resolve(process.argv[2] || 'dist')
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml',
])

// Nur echte externe Hosts sperren. Sichtbare Begriffe wie "TikTok" in einem
// Formular sind erlaubt und stellen noch keine Netzwerkverbindung dar.
const forbiddenHosts = [
  { label: 'Google Fonts API', pattern: /\bfonts\.googleapis\.com\b/i },
  { label: 'Google Fonts Dateien', pattern: /\bfonts\.gstatic\.com\b/i },
  {
    label: 'TikTok',
    pattern: /\b(?:[a-z0-9-]+\.)*(?:tiktok\.com|tiktokcdn\.com|tiktokcdn-us\.com|tiktokv\.com)\b/i,
  },
  { label: 'Ko-fi-Widget', pattern: /\bstorage\.ko-fi\.com\b/i },
]

async function listTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listTextFiles(entryPath))
    } else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath)
    }
  }

  return files
}

const matches = []

for (const file of await listTextFiles(targetDirectory)) {
  const contents = await readFile(file, 'utf8')
  for (const host of forbiddenHosts) {
    if (host.pattern.test(contents)) {
      matches.push(`${host.label}: ${path.relative(process.cwd(), file)}`)
    }
  }
}

if (matches.length > 0) {
  console.error('Unzulässige externe Netzwerkadresse(n) im Build gefunden:')
  for (const match of matches) console.error(`- ${match}`)
  process.exit(1)
}

console.log('Netzwerk-Reinheit geprüft: keine verbotenen externen Hosts gefunden. ✓')
