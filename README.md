# LambKing Stories – Landingpage & Admin

**Live-Seite:** https://antonb84-cpu.github.io/lambking-landingpage/

## Was ist was?

| Teil | Was es ist |
|---|---|
| `src/`, `index.html`, `public/` | Die Landingpage (React + Vite + Tailwind), Deutsch/Englisch umschaltbar |
| `admin/` | Das lokale Verwaltungsprogramm (Python) – nur auf deinem PC |
| `ADMIN-STARTEN.bat` | Doppelklick-Start des Admins (mit automatischem Start-Check) |
| `.github/workflows/deploy.yml` | GitHub Actions: baut & veröffentlicht die Live-Seite automatisch |
| `WIEDERHERSTELLUNG.md` | Anleitung: Projekt auf einem neuen PC wieder aufsetzen |

## Admin starten (Bücher pflegen ohne Code)

Doppelklick auf **ADMIN-STARTEN.bat** (oder das Desktop-Symbol „LambKing Admin").
Der Browser öffnet sich automatisch auf http://localhost:8123/

**Im Admin kannst du:**
- Bücher hinzufügen / bearbeiten / löschen (deutsch & englisch getrennt)
- Amazon-Link einfügen → Titel, Beschreibung, Cover kommen automatisch
- Cover & Buch-PDF hochladen → 4 Beispielseiten werden automatisch gerendert
- Autorenfoto ändern (Form & Größe wählbar)
- PayPal-, Ko-fi-, Web-App- und Google-Play-Links pflegen
- Impressum & Datenschutz bearbeiten
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

## Wichtige Daten

- `src/data/books.json` – alle Bücher & Website-Einstellungen (wird vom Admin gepflegt)
- `src/data/books.ts` – wird **automatisch** daraus erzeugt, nie von Hand ändern
- `src/data/texts.ts` – alle Oberflächentexte Deutsch/Englisch

## Grundsätze

- Amazon ist der einzige Verkaufsweg der Bücher.
- PayPal & Ko-fi sind freiwillige Unterstützung – kein Verkauf.
- Kein TikTok Shop, kein Tracking, keine Cookies, keine Google-Fonts-Verbindung.
- Keine Passwörter/Tokens im Repository – die GitHub-Anmeldung läuft über die normale Git-Anmeldung des PCs.
- Die Live-Seite läuft auf GitHub Pages – unabhängig davon, ob dein PC an ist.
- Zusätzlich zum GitHub-Backup kannst du den kompletten Ordner `LambKing.de`
  gelegentlich auf ein zweites Laufwerk oder in ein Cloud-Backup kopieren.
