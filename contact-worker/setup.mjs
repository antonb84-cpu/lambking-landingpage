import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)
const wranglerLocal = join(here, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const wranglerCounter = join(root, 'analytics-worker', 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const wrangler = existsSync(wranglerLocal) ? wranglerLocal : wranglerCounter
const namespaceTitle = 'lambking-contact-rate'
const workerName = 'lambking-contact'

function run(args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync(process.execPath, [wrangler, ...args], { cwd: here, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
  if (!allowFailure && result.status !== 0) throw new Error(`Wrangler-Befehl fehlgeschlagen: ${args.join(' ')}`)
  return result
}

// Passwort ohne Anzeige einlesen (oder aus LAMBKING_SMTP_PASS)
function askHidden(question) {
  if (process.env.LAMBKING_SMTP_PASS) return Promise.resolve(process.env.LAMBKING_SMTP_PASS)
  return new Promise((resolve) => {
    process.stdout.write(question)
    const stdin = process.stdin
    let value = ''
    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') {
          stdin.setRawMode?.(false)
          stdin.pause()
          stdin.removeListener('data', onData)
          process.stdout.write('\n')
          return resolve(value)
        }
        if (char === '\u0003') process.exit(1)
        if (char === '\b' || char === '\u007f') value = value.slice(0, -1)
        else value += char
      }
    }
    stdin.on('data', onData)
  })
}

console.log('\n1/6 Cloudflare-Anmeldung prüfen …')
const who = run(['whoami'], { capture: true, allowFailure: true })
if (who.status !== 0 || /not authenticated|not logged/i.test(`${who.stdout}\n${who.stderr}`)) {
  console.log('Dein Browser öffnet sich jetzt einmalig zur Cloudflare-Anmeldung.')
  run(['login', '--device'])
}

console.log('2/6 Zähler für das Rate Limiting vorbereiten (läuft von selbst ab, keine Nachrichten) …')
const listKv = () => JSON.parse(run(['kv', 'namespace', 'list'], { capture: true }).stdout || '[]')
let namespace = listKv().find((item) => item.title === namespaceTitle)
if (!namespace) {
  run(['kv', 'namespace', 'create', namespaceTitle], { allowFailure: true })
  namespace = listKv().find((item) => item.title === namespaceTitle)
}
if (!namespace?.id) throw new Error('Die KV-ID konnte nicht ermittelt werden.')
const template = readFileSync(join(here, 'wrangler.template.toml'), 'utf8')
writeFileSync(join(here, 'wrangler.toml'), template.replace('__KV_ID__', namespace.id), 'utf8')

console.log('3/6 Zugang zum Postfach hello@lambking.store')
console.log('    Das Passwort bleibt nur als geheimer Wert in Cloudflare. Es steht in keiner Datei des Projekts.')
const password = (await askHidden('    Passwort des Postfachs hello@lambking.store (Eingabe unsichtbar): ')).trim()
if (!password) throw new Error('Ohne Passwort kann das Formular keine E-Mails senden.')

console.log('4/6 Geheimen Salt für das Rate Limiting erzeugen …')
const secrets = JSON.stringify({ SMTP_PASS: password, RL_SALT: randomBytes(32).toString('base64url') })

console.log('5/6 Formular-Dienst veröffentlichen …')
const deployment = run(['deploy', '--config', 'wrangler.toml'], { capture: true })
const secretResult = spawnSync(process.execPath, [wrangler, 'secret', 'bulk', '--config', 'wrangler.toml'], {
  cwd: here,
  encoding: 'utf8',
  input: secrets,
  stdio: ['pipe', 'pipe', 'pipe'],
})
if (secretResult.status !== 0) throw new Error('Die geheimen Werte konnten nicht an Cloudflare übertragen werden.')
const text = `${deployment.stdout || ''}\n${deployment.stderr || ''}`
process.stdout.write(text)
const match = text.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)
if (!match) throw new Error('Die veröffentlichte workers.dev-Adresse konnte nicht ermittelt werden. Bitte die Ausgabe oben prüfen.')
const url = `${match[0].replace(/\/+$/, '')}/contact`

console.log('6/6 Landingpage mit dem Formular verbinden …')
const booksPath = join(root, 'src', 'data', 'books.json')
const books = JSON.parse(readFileSync(booksPath, 'utf8'))
books.site.contactFormUrl = url
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

console.log(`\nFERTIG. Das Kontaktformular ist verbunden: ${url}`)
console.log(`Worker-Name in Cloudflare: ${workerName}`)
console.log('Schick jetzt über das Formular eine Test-Nachricht an dich selbst und veröffentliche danach die Landingpage.\n')
