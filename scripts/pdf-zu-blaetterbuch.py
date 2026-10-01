"""Macht aus einer Buch-PDF ein durchblätterbares Vorschaubuch für die Landingpage.

Aufruf:
    python scripts/pdf-zu-blaetterbuch.py <buch-id> <sprache> <pfad-zur.pdf>
Beispiel:
    python scripts/pdf-zu-blaetterbuch.py bibelgeschichten-zum-ausmalen de "L:/…/Band01_INHALT_DE.pdf"

Schreibt alle Seiten als kleine JPGs nach public/images/buch-<id>-<sprache>/p01.jpg …
und trägt das Buch in src/data/flipbooks.json ein.
"""
import json
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    if len(sys.argv) != 4:
        print(__doc__)
        raise SystemExit(1)
    book_id, lang, pdf = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    rel = f"images/buch-{book_id}-{lang}"
    out = ROOT / "public" / rel
    out.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    for i, page in enumerate(doc, 1):
        zoom = 640 / page.rect.width
        page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False).save(out / f"p{i:02d}.jpg", jpg_quality=72)
    manifest = ROOT / "src" / "data" / "flipbooks.json"
    data = json.loads(manifest.read_text(encoding="utf-8"))
    data.setdefault(book_id, {})[lang] = {"dir": rel, "count": doc.page_count}
    manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{doc.page_count} Seiten nach {out} geschrieben und in flipbooks.json eingetragen.")


if __name__ == "__main__":
    main()
