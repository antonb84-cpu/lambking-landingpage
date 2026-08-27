# LambKing Stories – Landingpage & Admin

**Live-Seite:** https://antonb84-cpu.github.io/lambking-landingpage/

## Aufbau

- `src/` – React + Vite + Tailwind Landingpage (Deutsch/Englisch umschaltbar)
- `src/data/books.json` – zentrale Daten (Bücher, Website-Einstellungen, Impressum/Datenschutz)
- `src/data/books.ts` – wird **automatisch** aus books.json erzeugt (nicht von Hand ändern)
- `src/data/texts.ts` – alle Oberflächentexte DE/EN
- `admin/` – lokales Verwaltungsprogramm (Python, keine Installation nötig)
- `tools/` – älteres Kommandozeilen-Werkzeug (wird durch `admin/` ersetzt)

## Lokal starten

```bash
npm install
npm run dev      # Entwicklung
npm run build    # produktiver Build nach dist/
```

## Admin-Programm (Bücher pflegen ohne Code)

Doppelklick auf `ADMIN-STARTEN.bat` (im Ordner oberhalb von `app/`) oder:

```bash
cd app/admin
python admin_server.py
```

Der Browser öffnet sich automatisch auf http://localhost:8123/
Funktionen: Bücher hinzufügen/bearbeiten/löschen, Amazon-Daten abrufen,
Cover & PDF hochladen (Beispielseiten werden aus der PDF erzeugt),
Autorenfoto, Impressum/Datenschutz, PayPal-/Play-Store-Links,
DE/EN-Bücher getrennt verwalten, danach „Veröffentlichen" (npm run build).
