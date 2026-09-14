import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { withAnalyticsPrivacy } from './privacy.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)
const wrangler = join(here, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const databaseName = 'lambking-analytics'

function run(args, { capture = false, allowFailure = false } = {}) {
  // Wrangler direkt mit genau der Node-Laufzeit starten, die dieses Skript ausführt.
  // Das funktioniert portabel und umgeht Windows-Probleme beim direkten Start von npx.cmd.
  const result = spawnSync(process.execPath, [wrangler, ...args], {
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

function readWranglerOauthToken() {
  const candidates = [
    process.env.APPDATA && join(process.env.APPDATA, 'xdg.config', '.wrangler', 'config', 'default.toml'),
    process.env.XDG_CONFIG_HOME && join(process.env.XDG_CONFIG_HOME, '.wrangler', 'config', 'default.toml'),
    join(homedir(), '.config', '.wrangler', 'config', 'default.toml'),
  ].filter(Boolean)

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue
    const config = readFileSync(configPath, 'utf8')
    const match = config.match(/^oauth_token\s*=\s*["']([^"']+)["']/m)
    if (match?.[1]) return match[1]
  }
  return ''
}

async function cloudflareApi(path, token, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok && body.success !== false, status: response.status, body }
}

async function ensureWorkersSubdomain() {
  const token = readWranglerOauthToken()
  if (!token) throw new Error('Die Cloudflare-Anmeldung wurde gefunden, aber der lokale OAuth-Zugang konnte nicht gelesen werden.')

  const accounts = await cloudflareApi('/accounts?page=1&per_page=50', token)
  const accountId = accounts.body?.result?.[0]?.id
  if (!accounts.ok || !accountId) throw new Error('Das Cloudflare-Konto konnte nicht ermittelt werden.')

  const current = await cloudflareApi(`/accounts/${accountId}/workers/subdomain`, token)
  if (current.ok && current.body?.result?.subdomain) return current.body.result.subdomain

  const candidates = [
    'lambking-anonymous-counter',
    'lambking-stories-antonb84',
    `lambking-stories-${accountId.slice(0, 6)}`,
  ]
  for (const subdomain of candidates) {
    const created = await cloudflareApi(`/accounts/${accountId}/workers/subdomain`, token, {
      method: 'PUT',
      body: JSON.stringify({ subdomain }),
    })
    if (created.ok && created.body?.result?.subdomain) {
      console.log(`Cloudflare-Adresse aktiviert: ${created.body.result.subdomain}.workers.dev`)
      return created.body.result.subdomain
    }
  }
  throw new Error('Cloudflare konnte keine freie workers.dev-Adresse für den Zähldienst anlegen.')
}

console.log('\n1/6 Cloudflare-Anmeldung prüfen …')
let who = run(['whoami'], { capture: true, allowFailure: true })
if (who.status !== 0 || /not authenticated|not logged/i.test(`${who.stdout}\n${who.stderr}`)) {
  console.log('Dein Browser öffnet sich jetzt einmalig zur Cloudflare-Anmeldung.')
  console.log('Die Geräte-Anmeldung funktioniert auch von einem USB-Stick oder fremden PC aus.')
  run(['login', '--device'])
  who = run(['whoami'], { capture: true })
}
await ensureWorkersSubdomain()

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

const portablePython = join(root, 'runtime', 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python3')
const pythonCommands = process.platform === 'win32'
  ? [[portablePython, ['admin/admin_server.py', '--render-only']], ['py', ['-3', 'admin/admin_server.py', '--render-only']], ['python', ['admin/admin_server.py', '--render-only']]]
  : [['python3', ['admin/admin_server.py', '--render-only']], ['python', ['admin/admin_server.py', '--render-only']]]
let rendered = false
for (const [command, args] of pythonCommands) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.status === 0) { rendered = true; break }
}
if (!rendered) throw new Error('books.ts konnte nicht erzeugt werden. Bitte Python 3 installieren und die Einrichtung erneut starten.')

console.log(`\nFERTIG. Der Zähldienst ist eingerichtet: ${url}`)
console.log('Starte jetzt den LambKing Admin neu und veröffentliche die Landingpage einmal über den goldenen Knopf.\n')
