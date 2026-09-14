# Wiederherstellung – LambKing auf einem neuen PC

**Keine Angst:** Die private portable LambKing-Kopie enthält Bücher, Bilder, Texte, Einstellungen, Admin-Programm sowie Python, Node.js und Git. Sie kann auf einem USB-Stick oder einem anderen Windows-PC direkt gestartet werden.

Das geheime Statistik-Token wird aus Sicherheitsgründen nicht in den öffentlichen GitHub-Quellcode geschrieben. Die private portable Drive-/USB-Kopie enthält es nach der Einrichtung zusammen mit dem übrigen System. Bewahre diese Kopie deshalb nicht öffentlich auf.

Du brauchst dafür keine Programmierkenntnisse und musst auf dem Ziel-PC nichts installieren.

---

## Empfohlener Weg: portable Drive-/USB-Kopie

1. Lade `LambKing.de-portable.zip` aus dem privaten Drive-Ordner herunter oder kopiere den vollständigen Ordner vom USB-Stick.
2. Entpacke den Ordner an eine beliebige Stelle. Der Laufwerksbuchstabe darf sich ändern.
3. Doppelklicke auf **ADMIN-STARTEN.bat**. Der Admin und der bereits verbundene Zähler starten als ein System.

Python, Node.js, Git, die Git-Arbeitsdaten und alle benötigten Pakete befinden sich bereits im Ordner. Dadurch funktionieren auch Vorschau, PDF-Verarbeitung und Veröffentlichung ohne Programminstallation.

## Beim ersten Veröffentlichen auf einem neuen PC

Damit dein PC mit deinem GitHub-Konto sprechen darf:

1. Öffne die Eingabeaufforderung (Windows-Taste → `cmd` eingeben → Enter).
2. Tippe ein:
   ```
   git config --global user.name "Anton Bernt"
   git config --global user.email "deine@email.de"
   ```
3. Beim ersten Übertragen zu GitHub (später) öffnet sich automatisch ein
   Anmeldefenster von GitHub – dort einmal mit deinem Konto anmelden.
   Windows merkt sich das danach dauerhaft.

## Alternative für Entwickler: nur den Quellcode von GitHub herunterladen

In der Eingabeaufforderung:

```
H:
cd \
git clone https://github.com/antonb84-cpu/lambking-landingpage.git LambKing.de
```

(Du kannst statt `H:` auch jedes andere Laufwerk nehmen.) Ein reiner GitHub-Klon enthält aus Größen- und Sicherheitsgründen nicht die portablen Laufzeiten und nicht das geheime Statistik-Token. Für einen installationsfreien Wechsel deshalb immer die private Drive-/USB-Kopie verwenden.

Für diese Entwickler-Variante müssen Python, Node.js und Git installiert sein. Danach:

In der Eingabeaufforderung:

```
cd H:\LambKing.de
npm install
pip install -r admin\requirements.txt
```

## Admin starten

Doppelklick auf **ADMIN-STARTEN.bat** im Ordner `H:\LambKing.de`.

- Der Start-Check prüft automatisch, ob alles da ist, und sagt dir auf Deutsch,
  falls etwas fehlt.
- Danach öffnet sich der Browser mit dem LambKing Admin.

Beim ersten Start richtet `ADMIN-STARTEN.bat` die Statistik automatisch mit ein, falls noch keine Konfiguration vorhanden ist. In der vollständigen privaten Drive-/USB-Kopie ist sie bereits vorhanden; dort ist keine erneute Cloudflare-Anmeldung nötig. Nur bei einer ganz neuen Einrichtung oder einem absichtlichen Umzug des Zähldienstes muss die Cloudflare-Kontoanmeldung einmal persönlich bestätigt werden.

## Test-Veröffentlichung

1. Im Admin unten auf **„✅ Alles prüfen"** klicken – alle Punkte sollten grün sein.
2. Auf **„🚀 Jetzt veröffentlichen"** klicken.
3. Nach 1–2 Minuten ist die Live-Seite aktuell:
   https://antonb84-cpu.github.io/lambking-landingpage/

**Fertig – alles ist wieder da.** 🎉

---

### Falls etwas nicht klappt

- Die Meldungen im schwarzen Fenster sind bewusst in einfachem Deutsch geschrieben –
  lies sie in Ruhe, sie sagen dir, was fehlt.
- Erstelle bei einer Fehlermeldung einen Screenshot des vollständigen schwarzen Fensters; daraus lässt sich der betroffene Prüfschritt eindeutig erkennen.
