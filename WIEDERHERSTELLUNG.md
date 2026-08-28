# Wiederherstellung – LambKing auf einem neuen PC

**Keine Angst:** Dein komplettes LambKing-Projekt (Bücher, Bilder, Texte, Einstellungen, Admin-Programm)
liegt sicher auf GitHub. Wenn dein PC kaputt geht, bekommst du mit dieser Anleitung alles wieder.

Du brauchst dafür keine Programmierkenntnisse – folge einfach den Schritten.

---

## Schritt 1: Drei Programme installieren

Lade nacheinander herunter und installiere (immer mit den Standard-Einstellungen):

1. **Git** – https://git-scm.com/download/win
2. **Node.js** – https://nodejs.org – die **LTS**-Version (großer grüner Knopf)
3. **Python** – https://www.python.org/downloads/ – **Wichtig:** Im Installationsfenster
   ganz unten den Haken bei **„Add python.exe to PATH"** setzen, dann auf „Install now".

## Schritt 2: Bei GitHub anmelden

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

## Schritt 3: Projekt herunterladen

In der Eingabeaufforderung:

```
H:
cd \
git clone https://github.com/antonb84-cpu/lambking-landingpage.git LambKing.de
```

(Du kannst statt `H:` auch jedes andere Laufwerk nehmen, z. B. `D:` –
das Programm funktioniert überall.)

## Schritt 4: Bausteine installieren

In der Eingabeaufforderung:

```
cd H:\LambKing.de
npm install
pip install -r admin\requirements.txt
```

## Schritt 5: Admin starten

Doppelklick auf **ADMIN-STARTEN.bat** im Ordner `H:\LambKing.de`.

- Der Start-Check prüft automatisch, ob alles da ist, und sagt dir auf Deutsch,
  falls etwas fehlt.
- Danach öffnet sich der Browser mit dem LambKing Admin.

## Schritt 6: Test-Veröffentlichung

1. Im Admin unten auf **„✅ Alles prüfen"** klicken – alle Punkte sollten grün sein.
2. Auf **„🚀 Jetzt veröffentlichen"** klicken.
3. Nach 1–2 Minuten ist die Live-Seite aktuell:
   https://antonb84-cpu.github.io/lambking-landingpage/

**Fertig – alles ist wieder da.** 🎉

---

### Falls etwas nicht klappt

- Die Meldungen im schwarzen Fenster sind bewusst in einfachem Deutsch geschrieben –
  lies sie in Ruhe, sie sagen dir, was fehlt.
- Oder frag Kimi: „Hilf mir bei der LambKing-Wiederherstellung, Schritt X klappt nicht."
