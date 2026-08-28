#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LambKing Start-Check – wird von ADMIN-STARTEN.bat aufgerufen.

Prüft alles Notwendige mit verständlichen deutschen Meldungen,
bevor der Admin startet. Bei fehlenden Python- oder Node-Paketen
wird eine Installation angeboten (niemals heimlich).
"""

import importlib.util
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ok_count = 0
problems = []


def ok(text):
    global ok_count
    ok_count += 1
    print(f"  ✓ {text}")


def problem(text):
    problems.append(text)
    print(f"  ✗ {text}")


def warn(text):
    print(f"  ⚠ {text}")


def frage_install(cmd, beschreibung):
    print()
    antwort = input(f"  {beschreibung}\n  Jetzt installieren? (j/n): ").strip().lower()
    if antwort in ("j", "ja", "y"):
        print("  Installiere …")
        r = subprocess.run(cmd, cwd=str(ROOT), shell=True)
        return r.returncode == 0
    return False


def main():
    print()
    print("  LambKing Start-Check")
    print("  " + "─" * 40)

    # Projektordner
    if (ROOT / "admin").is_dir() and (ROOT / "src").is_dir() and (ROOT / "public").is_dir():
        ok("Projektordner vollständig")
    else:
        problem("Das LambKing-Projekt scheint unvollständig zu sein (admin/, src/ oder public/ fehlt).")

    if (ROOT / "package.json").is_file():
        ok("package.json vorhanden")
    else:
        problem("package.json fehlt – das Projekt ist unvollständig.")

    # Python-Version
    if sys.version_info >= (3, 10):
        ok(f"Python {sys.version_info.major}.{sys.version_info.minor} vorhanden")
    else:
        problem("Die Python-Version ist zu alt. Bitte Python 3.10 oder neuer von https://www.python.org installieren.")

    # Python-Pakete
    fehlende = []
    for modul, paket in (("fitz", "PyMuPDF"), ("PIL", "Pillow"), ("pypdf", "pypdf")):
        if importlib.util.find_spec(modul) is None:
            fehlende.append(paket)
    if not fehlende:
        ok("Benötigte Python-Pakete vorhanden")
    elif fehlende == ["PyMuPDF"] or fehlende == ["PyMuPDF", "pypdf"]:
        # pypdf/Pillow reichen als Fallback – PyMuPDF ist empfohlen
        warn("PyMuPDF fehlt – PDF-Vorschau nutzt einfacheren Modus. Empfohlen: pip install -r admin\\requirements.txt")
    else:
        if frage_install([sys.executable, "-m", "pip", "install", "-r", "admin\\requirements.txt"],
                         f"Die Python-Pakete {', '.join(fehlende)} fehlen."):
            ok("Python-Pakete nachinstalliert")
        else:
            problem("Die Python-Abhängigkeiten des LambKing-Admins fehlen (pip install -r admin\\requirements.txt).")

    # Node.js / npm
    if shutil.which("node") or shutil.which("node.cmd"):
        ok("Node.js vorhanden")
    else:
        problem("Node.js fehlt. Bitte zuerst Node.js installieren: https://nodejs.org (LTS-Version)")
    if shutil.which("npm") or shutil.which("npm.cmd"):
        ok("npm vorhanden")
    else:
        problem("npm fehlt – wird normalerweise zusammen mit Node.js installiert: https://nodejs.org")

    # Node-Pakete
    if (ROOT / "node_modules").is_dir():
        ok("Website-Pakete (node_modules) vorhanden")
    else:
        if frage_install("npm install", "Die Website-Pakete (node_modules) fehlen."):
            ok("Website-Pakete nachinstalliert")
        else:
            problem("Website-Pakete fehlen – ohne sie kann die Seite nicht gebaut werden (npm install).")

    # Git
    if shutil.which("git"):
        ok("Git vorhanden")
    else:
        problem("Git konnte nicht gefunden werden. Bitte Git installieren: https://git-scm.com/download/win")

    # Git-Repository & Remote
    if (ROOT / ".git").is_dir():
        ok("Git-Repository vorhanden")
        r = subprocess.run(["git", "-C", str(ROOT), "remote", "get-url", "origin"],
                           capture_output=True, text=True)
        if r.returncode == 0 and "github.com" in r.stdout:
            ok("GitHub-Verknüpfung vorhanden")
        else:
            problem("Keine GitHub-Verknüpfung (Remote „origin“) im Repository gefunden.")
    else:
        problem("Kein Git-Repository gefunden – das Projekt wurde vermutlich nicht richtig geklont.")

    # GitHub erreichbar (optional – Admin funktioniert auch offline)
    try:
        urllib.request.urlopen("https://api.github.com", timeout=5)
        ok("GitHub erreichbar")
    except Exception:
        warn("GitHub ist momentan nicht erreichbar. Der Admin kann lokal verwendet werden, eine Veröffentlichung ist jedoch derzeit nicht möglich.")

    print("  " + "─" * 40)
    if problems:
        print()
        print("  Es gibt Probleme, die zuerst behoben werden müssen:")
        for p in problems:
            print(f"    • {p}")
        print()
        input("  Zum Schließen Enter drücken …")
        sys.exit(1)

    print(f"  ✓ LambKing-System bereit. ({ok_count} Prüfungen bestanden)")
    print()


if __name__ == "__main__":
    main()
