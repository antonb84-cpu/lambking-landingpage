import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { withAnalyticsPrivacy } from './privacy.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const databaseName = 'lambking-analytics'

function run(args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync(npx, ['wrangler', ...args], {
    cwd: here,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  })
  if (!allowFailure && result.status !== 0) throw new Error(`Wrangler-Befehl fehlgeschlagen: ${args.join(' ')}`)
  return result
}

function listDatabases() {
  const result = run(['d1', 'list', '--json'], { capture: true })
  return JSON.parse(result.stdout || '[]')
}

console.log('\n1/6 Cloudflare-Anmeldung prüfen …')
let who = run(['whoami'], { capture: true, allowFailure: true })
if (who.status !== 0 || /not authenticated|not logged/i.test(`${who.stdout}\n${who.stderr}`)) {
  console.log('Dein Browser öffnet sich jetzt einmalig zur Cloudflare-Anmeldung.')
  run(['login'])
  who = run(['whoami'], { capture: true })
}

console.log('2/6 Eigene Zählerdatenbank vorbereiten …')
let database = listDatabases().find((item) => item.name === databaseName)
if (!database) {
  run(['d1', 'create', databaseName, '--location', 'weur'])
  database = listDatabases().find((item) => item.name === databaseName)
}
if (!database?.uuid) throw new Error('Die Datenbank-ID konnte nicht ermittelt werden.')

const template = readFileSync(join(here, 'wrangler.template.toml'), 'utf8')
writeFileSync(join(here, 'wrangler.toml'), template.replace('__DATABASE_ID__', database.uuid), 'utf8')

console.log('3/6 Tabellen anlegen …')
run(['d1', 'execute', databaseName, '--remote', '--file', 'schema.sql', '--yes', '--config', 'wrangler.toml'])

console.log('4/6 Geheimen Admin-Zugang erzeugen …')
const localConfigPath = join(root, 'admin', 'analytics.local.json')
let token = ''
if (existsSync(localConfigPath)) {
  try { token = JSON.parse(readFileSync(localConfigPath, 'utf8')).token || '' } catch { token = '' }
}
if (!token) token = randomBytes(32).toString('base64url')
const secretsPath = join(here, '.setup-secrets.json')
writeFileSync(secretsPath, JSON.stringify({ ADMIN_TOKEN: token }), 'utf8')

console.log('5/6 Zähldienst veröffentlichen …')
let deployment
try {
  deployment = run(['deploy', '--config', 'wrangler.toml', '--secrets-file', '.setup-secrets.json'], { capture: true })
} finally {
  if (existsSync(secretsPath)) unlinkSync(secretsPath)
}
const deploymentText = `${deployment.stdout || ''}\n${deployment.stderr || ''}`
process.stdout.write(deploymentText)
const urlMatch = deploymentText.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)
if (!urlMatch) throw new Error('Die veröffentlichte workers.dev-Adresse konnte nicht ermittelt werden. Bitte die Ausgabe oben prüfen.')
const url = urlMatch[0].replace(/\/+$/, '')

console.log('6/6 Landingpage und lokales Admin verbinden …')
writeFileSync(localConfigPath, JSON.stringify({ url, token }, null, 2), 'utf8')
const booksPath = join(root, 'src', 'data', 'books.json')
const books = JSON.parse(readFileSync(booksPath, 'utf8'))
books.site.analyticsUrl = url
books.site.datenschutz = withAnalyticsPrivacy(books.site.datenschutz)
writeFileSync(booksPath, JSON.stringify(books, null, 2), 'utf8')

const pythonCommands = process.platform === 'win32'
  ? [['py', ['-3', 'admin/admin_server.py', '--render-only']], ['python', ['admin/admin_server.py', '--render-only']]]
  : [['python3', ['admin/admin_server.py', '--render-only']], ['python', ['admin/admin_server.py', '--render-only']]]
let rendered = false
for (const [command, args] of pythonCommands) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.status === 0) { rendered = true; break }
}
if (!rendered) throw new Error('books.ts konnte nicht erzeugt werden. Bitte Python 3 installieren und die Einrichtung erneut starten.')

console.log(`\nFERTIG. Der Zähldienst ist eingerichtet: ${url}`)
console.log('Starte jetzt den LambKing Admin neu und veröffentliche die Landingpage einmal über den goldenen Knopf.\n')
