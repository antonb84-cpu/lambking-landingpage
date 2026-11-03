# LambKing – Kontaktformular-Dienst

Nimmt die Nachrichten vom Formular auf `lambking.store` entgegen, prüft sie serverseitig und leitet sie **nur per E-Mail** an `hello@lambking.store` weiter. Es gibt keine Datenbank für Nachrichten. Als Reply-To steht die Adresse des Absenders, ein Klick auf „Antworten“ genügt.

## Was der Dienst tut

- `POST /contact` mit `name`, `email`, `message`, `consent` (muss `true` sein) und dem Honeypot-Feld `website` (muss leer sein).
- Prüfung auf dem Server: Pflichtfelder, Längen (Name 100, E-Mail 254, Nachricht 10–4000 Zeichen), E-Mail-Format, Steuerzeichen und Zeilenumbrüche in Name/E-Mail werden entfernt (kein Header-Injection), nur Text-Mails (kein HTML), nur erlaubte Herkunftsseiten (`ALLOWED_ORIGINS`).
- **Honeypot:** Ist das unsichtbare Feld ausgefüllt, bekommt der Bot „ok“, es wird nichts gesendet und nichts gespeichert.
- **Rate Limiting:** höchstens 3 Nachrichten pro IP und Stunde, höchstens 40 pro Tag insgesamt. Gespeichert wird nur ein HMAC-Hash der IP (mit geheimem Salt `RL_SALT`) plus Zähler in Cloudflare KV. KV löscht den Eintrag nach spätestens einer Stunde von selbst (`expirationTtl`). Die IP steht nie im Klartext in der Ablage.
- Kein Captcha-Dienst, kein Google reCAPTCHA. Aufrufprotokolle von Cloudflare sind abgeschaltet.
- Versand per SMTP an `mail.spacemail.com:465` über das Postfach `hello@lambking.store` (Bibliothek `worker-mailer`, fest auf 1.2.1).

## Einrichtung (einmalig)

`FORMULAR-EINRICHTEN.bat` doppelklicken. Das Skript

1. prüft die Cloudflare-Anmeldung (öffnet bei Bedarf den Browser),
2. legt den KV-Speicher für die Zähler an,
3. fragt das **Passwort des Postfachs `hello@lambking.store`** ab (Eingabe unsichtbar; es wird nur als geheimer Wert in Cloudflare abgelegt, nie in eine Datei im Projekt geschrieben),
4. erzeugt den geheimen Salt,
5. veröffentlicht den Dienst als Worker `lambking-contact`,
6. trägt die Adresse des Dienstes in `src/data/books.json` ein (`site.contactFormUrl`).

Danach eine Test-Nachricht über das Formular an dich selbst schicken und die Landingpage veröffentlichen.

## Ändern

- Empfänger, Absender, SMTP-Server: `wrangler.template.toml` (Abschnitt `[vars]`), danach `npm run setup` erneut starten.
- Passwort ändern: `npm run setup` erneut starten.
- Tests: `npm test` (laufen auch im normalen `npm run test` der Landingpage).
