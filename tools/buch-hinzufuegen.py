#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
buch-hinzufuegen.py – Neues Buch zur LambKing-Landingpage hinzufügen.

Ablauf:
  1. Amazon-Link (oder ASIN) eingeben → Titel, Beschreibung, Preis, Alter,
     Seitenzahl, Bewertung und das Cover werden automatisch von Amazon geholt.
  2. Pfad zur Buch-PDF eingeben → das Werkzeug sucht sich 4 Beispielseiten
     aus dem Inneren und speichert sie als Bilder.
  3. Kategorie wählen (Geschichten / Malbücher / Komics).
  4. Das Buch wird in src/data/books.ts eingetragen.

Danach nur noch:  npm run build   (bzw. npm run dev zum Anschauen)

Aufruf (im Ordner app/):
  python tools/buch-hinzufuegen.py
"""

import json
import os
import re
import sys
import urllib.request
import datetime
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
IMAGES = APP / "public" / "images"
BOOKS_TS = APP / "src" / "data" / "books.ts"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "de-DE,de;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def download(url: str, dest: Path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        dest.write_bytes(r.read())


def slugify(text: str) -> str:
    text = text.lower()
    for a, b in [("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")]:
        text = text.replace(a, b)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:40]


def parse_amazon(html: str) -> dict:
    d = {}
    m = re.search(r'<span[^>]*id="productTitle"[^>]*>(.*?)</span>', html, re.S)
    if m:
        d["title"] = re.sub(r"\s+", " ", m.group(1)).strip()
    else:
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        if m:
            t = re.sub(r"\s+", " ", m.group(1)).strip()
            d["title"] = re.sub(r"\s*[:\-–]\s*Amazon\.de.*$", "", t)
    m = re.search(r'"hiRes":"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if m:
        d["cover_url"] = m.group(1).replace("\\u0026", "&")
    m = re.search(r'<div[^>]*id="bookDescription_feature_div".*?<span[^>]*>(.*?)</span>', html, re.S)
    if m:
        txt = re.sub(r"<[^>]+>", " ", m.group(1))
        txt = re.sub(r"\s+", " ", txt).replace("&uuml;", "ü").replace("&auml;", "ä").replace("&ouml;", "ö").strip()
        txt = re.sub(r"\s*Mehr lesen\s*$", "", txt)
        d["description"] = txt
    m = re.search(r'"displayPrice":"([\d.,]+ ?€)"', html)
    if not m:
        # Fallback: sichtbarer Kaufpreis (enthält ein geschütztes Leerzeichen \xa0)
        m = re.search(r'aok-offscreen">\s*([\d,.]+\s*€)', html)
    if m:
        d["price"] = m.group(1).replace("\xa0", " ").strip()
    m = re.search(r'Lesealter\s*</span>.*?<span[^>]*>\s*([\d–\-+ ]+Jahre[^<]*)<', html, re.S)
    if m:
        d["age"] = m.group(1).strip()
    m = re.search(r'Seitenzahl der Print-Ausgabe\s*</span>.*?<span[^>]*>\s*(\d+)\s*Seiten', html, re.S)
    if m:
        d["pages"] = f'{m.group(1)} Seiten'
    m = re.search(r'([\d,]+)\s+von 5 Sternen', html)
    if m:
        d["rating"] = f'{m.group(1)} von 5'
    return d


def extract_samples(pdf_path: Path, book_id: str) -> list[str]:
    """Holt 4 Beispielseiten aus der Buch-PDF (bildbasierte Seiten)."""
    from pypdf import PdfReader
    from PIL import Image as PILImage
    import io as _io

    reader = PdfReader(str(pdf_path))
    n = len(reader.pages)
    print(f"   PDF hat {n} Seiten.")
    # gleichmäßig verteilt, Titel-/Vorsatzseiten überspringen
    picks = [max(2, int(n * f)) for f in (0.12, 0.37, 0.62, 0.87)]
    out = []
    for num, pidx in enumerate(picks, 1):
        page = reader.pages[min(pidx, n - 1)]
        if not page.images:
            print(f"   ⚠ Seite {pidx + 1}: kein Bild gefunden, übersprungen.")
            continue
        img = page.images[0]
        im = PILImage.open(_io.BytesIO(img.data)).convert("RGB")
        r = 820 / im.width
        im = im.resize((820, round(im.height * r)), PILImage.LANCZOS)
        name = f"{book_id}-seite-{num}.jpg"
        im.save(IMAGES / name, quality=86)
        out.append(f"/images/{name}")
        print(f"   ✓ Beispielseite {num}: Seite {pidx + 1} → {name}")
    return out


def main():
    print("=" * 60)
    print("  LambKing Stories – neues Buch hinzufügen")
    print("=" * 60)

    url = input("\n1) Amazon-Link oder ASIN: ").strip()
    m = re.search(r"(B0[A-Z0-9]{8})", url.upper())
    if not m:
        print("   ✗ Keine ASIN gefunden (Format: B0XXXXXXXX). Abbruch.")
        sys.exit(1)
    asin = m.group(1)
    url = f"https://www.amazon.de/dp/{asin}"
    print(f"   Lade {url} …")
    try:
        info = parse_amazon(fetch(url))
    except Exception as e:
        print(f"   ⚠ Amazon-Abruf fehlgeschlagen ({e}). Bitte Daten manuell eingeben.")
        info = {}

    title = input(f"   Titel [{info.get('title', '')}]: ").strip() or info.get("title", "")
    if not title:
        print("   ✗ Ohne Titel geht es nicht.")
        sys.exit(1)
    desc = input(f"   Beschreibung [(Enter) = von Amazon übernehmen]: ").strip() or info.get("description", "")
    price = input(f"   Preis [{info.get('price', 'leer = Preis bei Amazon ansehen')}]: ").strip() or info.get("price", "")
    age = input(f"   Alter [{info.get('age', 'z. B. Ab 5 Jahren')}]: ").strip() or info.get("age", "")
    detail = input(f"   Detail [{info.get('pages', 'z. B. 56 Seiten')}]: ").strip() or info.get("pages", "")
    series = input("   Reihe (z. B. 'Bibelgeschichten zum Ausmalen · Band 3', leer = keine): ").strip()

    print("\n   Kategorie:  1 = Geschichten   2 = Malbücher   3 = Komics")
    cat = {"1": "geschichten", "2": "malbuecher", "3": "komics"}.get(input("   Auswahl [2]: ").strip() or "2", "malbuecher")
    btype = {"geschichten": "Kinderbuch", "malbuecher": "Malbuch", "komics": "Comic"}[cat]
    badge = input("   Heute neu veröffentlicht? (j/n) [j]: ").strip().lower() or "j"
    release_date = datetime.date.today().isoformat() if badge in ("j", "ja", "y", "") else ""

    book_id = slugify(title.split("–")[0].split(":")[0])
    print(f"\n   Buch-ID: {book_id}")

    # Cover
    cover = ""
    if info.get("cover_url"):
        dest = IMAGES / f"cover-{book_id}.jpg"
        print("   Lade Cover …")
        download(info["cover_url"], dest)
        from PIL import Image as PILImage
        im = PILImage.open(dest).convert("RGB")
        r = 760 / im.width
        im.resize((760, round(im.height * r)), PILImage.LANCZOS).save(dest, quality=90)
        cover = f"/images/cover-{book_id}.jpg"
        print(f"   ✓ Cover → {dest.name}")
    else:
        print("   ⚠ Kein Cover gefunden – bitte manuell als public/images/cover-<id>.jpg ablegen.")
        cover = f"/images/cover-{book_id}.jpg"

    # Beispielseiten aus PDF
    samples: list[str] = []
    pdf = input("\n2) Pfad zur Buch-PDF (leer = überspringen): ").strip().strip('"')
    if pdf:
        pdf_path = Path(pdf)
        if pdf_path.exists():
            samples = extract_samples(pdf_path, book_id)
        else:
            print(f"   ✗ Datei nicht gefunden: {pdf}")

    # Eintrag in books.ts
    lines = ["  {"]
    lines.append(f"    id: '{book_id}',")
    lines.append(f"    title: {json.dumps(title, ensure_ascii=False)},")
    if series:
        lines.append(f"    series: {json.dumps(series, ensure_ascii=False)},")
    lines.append(f"    category: '{cat}',")
    lines.append(f"    type: '{btype}',")
    lines.append(f"    age: {json.dumps(age, ensure_ascii=False)},")
    lines.append(f"    detail: {json.dumps(detail, ensure_ascii=False)},")
    if price:
        lines.append(f"    price: {json.dumps(price, ensure_ascii=False)},")
    lines.append(f"    cover: '{cover}',")
    lines.append(f"    description: {json.dumps(desc, ensure_ascii=False)},")
    lines.append("    highlights: [],")
    lines.append("    samples: [" + "".join(f"\n      '{s}'," for s in samples) + ("\n    ]" if samples else "],"))
    lines.append(f"    amazon: '{url}',")
    lines.append("    tiktok: '',")
    if release_date:
        lines.append(f"    releaseDate: '{release_date}',  // „Neu"-Badge erscheint 30 Tage ab diesem Datum")
    if info.get("rating"):
        lines.append(f"    rating: {json.dumps(info['rating'], ensure_ascii=False)},")
    lines.append("  },")
    entry = "\n".join(lines) + "\n"

    src = BOOKS_TS.read_text(encoding="utf-8")
    marker = "]\n\nexport const COMING_SOON"
    if marker not in src:
        print("   ✗ BOOKS-Liste in books.ts nicht gefunden – Eintrag bitte manuell ergänzen:")
        print(entry)
        sys.exit(1)
    src = src.replace(marker, entry + marker, 1)
    BOOKS_TS.write_text(src, encoding="utf-8")

    print("\n" + "=" * 60)
    print(f"  ✓ „{title}" ist eingetragen!")
    print("  Nächste Schritte:")
    print("    npm run dev     → Vorschau anschauen")
    print("    npm run build   → neue Version bauen")
    print("  Hinweis: highlights-Liste und TikTok-Link kannst du in")
    print("  src/data/books.ts beim neuen Eintrag noch ergänzen.")
    print("=" * 60)


if __name__ == "__main__":
    main()
