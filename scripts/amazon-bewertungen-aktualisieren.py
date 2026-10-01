"""Holt die öffentlichen Amazon-Sterne (Durchschnitt + Anzahl) für alle Bücher und speichert sie
in src/data/books.json (Felder amazonRating / amazonRatingCount), danach wird books.ts neu erzeugt.

Aufruf:  python scripts/amazon-bewertungen-aktualisieren.py
Hinweis: Amazon zeigt Besuchern erst Sterne, wenn die Bewertungen öffentlich freigeschaltet sind.
Bücher ohne öffentliche Bewertung bleiben unverändert (dort lädt die Seite zum Bewerten ein).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "admin"))
import admin_server  # noqa: E402

path = ROOT / "src" / "data" / "books.json"
state = json.loads(path.read_text(encoding="utf-8"))
changed = 0
for book in state["books"]:
    url = book.get("amazon") or next((e.get("amazon") for e in book.get("editions", []) if e.get("amazon")), "")
    match = re.search(r"/dp/([A-Z0-9]{10})", url or "")
    if not match:
        continue
    try:
        info = admin_server.parse_amazon(admin_server.fetch_amazon_html(match.group(1)))
    except Exception as error:  # noqa: BLE001
        print(f"{book['id']}: Amazon nicht erreichbar ({error})")
        continue
    rating, count = info.get("amazonRating"), info.get("amazonRatingCount")
    if rating:
        book["amazonRating"], book["amazonRatingCount"] = rating, count
        changed += 1
        print(f"{book['id']}: {rating} Sterne, {count} Bewertungen")
    else:
        print(f"{book['id']}: noch keine öffentliche Bewertung")
path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
admin_server.render_books_ts(state)
print(f"{changed} Bücher aktualisiert.")
