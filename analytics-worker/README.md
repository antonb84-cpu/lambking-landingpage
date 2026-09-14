# LambKing – anonymer Zähldienst

Dieses mitgelieferte Modul speichert ausschließlich tägliche Summen:

- `pageview` – Aufruf der Landingpage
- `amazon_click` plus interne Buch-ID – Klick auf den Amazon-Knopf eines Buches

Es speichert keine IP-Adresse, Cookies, LocalStorage-Kennung, Benutzer- oder Geräte-ID, User-Agent-Zeichenfolge, Referrer oder einzelne Besuchsverläufe. Cloudflare-Invocation-Logs sind in der Konfiguration ausgeschaltet.

## Einmalige Einrichtung

Im normalen Betrieb genügt im Projekt-Hauptordner `ADMIN-STARTEN.bat`. Diese Datei startet bei einer noch fehlenden Konfiguration automatisch die interne Wartung. Nur für eine manuelle Reparatur liegt in diesem Ordner `ZAeHLER-WARTUNG.bat`. Das Skript:

1. installiert die benötigte Cloudflare-Verwaltung lokal in diesem Modul,
2. öffnet die Cloudflare-Anmeldung,
3. erstellt die eigene D1-Datenbank in Westeuropa,
4. legt ein zufälliges geheimes Statistik-Token an,
5. veröffentlicht den Worker,
6. verbindet Landingpage und lokalen Admin automatisch.

Danach den LambKing Admin neu starten und die Landingpage einmal veröffentlichen. Das Cloudflare-Konto und die Datenbank gehören dem angemeldeten Kontoinhaber. Bei einem PC-Wechsel den ganzen Projektordner einschließlich der privaten Datei `admin/analytics.local.json` über einen sicheren Datenträger kopieren. Diese Datei darf nicht in ein öffentliches Repository gelangen.

## Neu veröffentlichen oder umziehen

Der komplette Worker-Quellcode und das Datenbankschema liegen in diesem Ordner. Nach Codeänderungen kann im Ordner `analytics-worker` mit `npm run deploy` erneut veröffentlicht werden. Für ein anderes Cloudflare-Konto `wrangler.toml` und `admin/analytics.local.json` entfernen und die einmalige Einrichtung erneut ausführen.
