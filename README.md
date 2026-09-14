# LambKing Stories – Landingpage & Admin

**Live-Seite:** https://antonb84-cpu.github.io/lambking-landingpage/

## Was ist was?

| Teil | Was es ist |
|---|---|
| `src/`, `index.html`, `public/` | Die Landingpage (React + Vite + Tailwind), Deutsch/Englisch umschaltbar |
| `admin/` | Das lokale Verwaltungsprogramm (Python) |
| `runtime/` | Mitgelieferte portable Laufzeiten für Python, Node.js und Git (nicht auf GitHub gespeichert) |
| `analytics-worker/` | Portabler, anonymer Zähldienst (Cloudflare Worker + eigene D1-Datenbank) |
| `ADMIN-STARTEN.bat` | Doppelklick-Start des Admins (mit automatischem Start-Check) |
| `ANALYTIK-EINRICHTEN.bat` | Reparatur-/Umzugsstart für den Zähler; beim normalen Admin-Start automatisch integriert |
| `.github/workflows/deploy.yml` | GitHub Actions: baut & veröffentlicht die Live-Seite automatisch |
| `WIEDERHERSTELLUNG.md` | Anleitung: Projekt auf einem neuen PC wieder aufsetzen |

## Admin starten (Bücher pflegen ohne Code)

Doppelklick auf **ADMIN-STARTEN.bat** (oder das Desktop-Symbol „LambKing Admin").
Der Browser öffnet sich automatisch auf http://localhost:8123/

Die private USB-/Drive-Ausgabe enthält Python, Node.js, Git sowie alle Pakete bereits im Projektordner. Auf einem anderen Windows-PC muss deshalb nichts installiert werden. Die Programme werden immer relativ zum Speicherort des Ordners gefunden; auch ein anderer Laufwerksbuchstabe ist erlaubt.

**Im Admin kannst du:**
- Bücher hinzufügen / bearbeiten / löschen (deutsch & englisch getrennt)
- pro Buch beliebig viele Sprach-Ausgaben mit sichtbarer Flagge und eigenem Amazon-Link verwalten (u. a. Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Russisch und Japanisch)
- Amazon-Link einfügen → Titel, Beschreibung, Cover kommen automatisch
- Cover sowie Buch-PDF oder einzelne Bilder/Screenshots hochladen → die Vorschauseiten werden automatisch vorbereitet
- Autorenfoto ändern (Form & Größe wählbar)
- PayPal-, Ko-fi-, Web-App- und Google-Play-Links pflegen
- Impressum & Datenschutz bearbeiten
- Seitenaufrufe (heute, diese Woche, gesamt) und Amazon-Klicks je Buch ansehen
- GitHub-Sicherungsstatus sehen
- veröffentlichen (mit automatischer Prüfung vorher)

## Veröffentlichen – so läuft es

1. **Speichern** im Admin = nur lokal auf deinem PC.
2. **Veröffentlichen** im Admin = Prüfung (Rechtstexte, Tests, Bau) → Git-Commit → Push zu GitHub `main`.
3. **GitHub Actions** baut danach automatisch die Live-Seite (ca. 1–2 Minuten).
4. Status siehst du im Admin oder unter „Deployment bei GitHub ansehen".

## Entwicklung

```bash
npm install        # einmalig (oder npm ci)
npm run dev        # lokale Entwicklungsvorschau
npm run lint       # Code-Stil prüfen
npm run test       # strukturelle Tests (Links, Rechtstexte, Netzwerk-Reinheit …)
npm run build      # baut dist/ (inkl. impressum.html, datenschutz.html, sitemap, JSON-LD)
npm run check      # lint + test + build in einem
```

## Anonyme Statistik

Die Live-Seite ist statisch und kann Zahlen nicht selbst speichern. Beim ersten Start über `ADMIN-STARTEN.bat` werden Zähldienst, Datenbank, geheimes Admin-Token und die Verbindung zur Landingpage automatisch vorbereitet. Nur die Anmeldung beim eigenen Cloudflare-Konto muss einmal persönlich bestätigt werden. Danach ist der Zähler Bestandteil desselben Admin-Systems und erfordert keine weitere Installation. `ANALYTIK-EINRICHTEN.bat` bleibt lediglich für Reparatur oder Umzug erhalten.

Der Zähldienst läuft im Cloudflare-Free-Tarif. Er speichert nur Tagessummen für Seitenaufrufe und Amazon-Klicks je Buch und Sprach-Ausgabe. Die kostenlose Größenordnung (100.000 Worker-Aufrufe pro Tag, 100.000 geschriebene D1-Zeilen pro Tag und 5 GB D1-Speicher) liegt weit über dem Bedarf dieser Landingpage. Ohne eine bewusste Umstellung des Cloudflare-Kontos auf einen Bezahlplan entstehen keine nutzungsabhängigen Kosten.

Das Token liegt ausschließlich in `admin/analytics.local.json` und wird durch `.gitignore` nie zu GitHub übertragen. Die private portable Drive-/USB-Kopie enthält diese Datei, sobald der Zähler eingerichtet ist.

## Wichtige Daten

- `src/data/books.json` – alle Bücher & Website-Einstellungen (wird vom Admin gepflegt)
- `src/data/books.ts` – wird **automatisch** daraus erzeugt, nie von Hand ändern
- `src/data/texts.ts` – alle Oberflächentexte Deutsch/Englisch

## Grundsätze

- Amazon ist der einzige Verkaufsweg der Bücher.
- PayPal & Ko-fi sind freiwillige Unterstützung – kein Verkauf.
- Kein TikTok Shop, keine Cookies, keine Besucher-Wiedererkennung und keine Google-Fonts-Verbindung.
- Die Statistik speichert ausschließlich tägliche Summen von Seitenaufrufen und Amazon-Klicks je interner Buch-ID und Sprach-Ausgabe; keine IP-Adresse, Gerätekennung oder einzelnen Besuchsverläufe.
- Keine Passwörter/Tokens im Repository – die GitHub-Anmeldung läuft über die normale Git-Anmeldung des PCs.
- Die Live-Seite läuft auf GitHub Pages – unabhängig davon, ob dein PC an ist.
- Zusätzlich zum GitHub-Backup kannst du den kompletten Ordner `LambKing.de`
  gelegentlich auf ein zweites Laufwerk oder in ein Cloud-Backup kopieren.
