#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LambKing Admin – einfaches Verwaltungsprogramm für die Landingpage.

Start: Doppelklick auf ADMIN-STARTEN.bat (im Hauptordner)
oder:  python admin/admin_server.py   (im Ordner app/)

Danach öffnet sich automatisch die Verwaltungsseite im Browser.
Alles läuft nur lokal auf diesem Computer – es werden keine Daten
irgendwohin gesendet.
"""

import datetime
import io
import json
import re
import subprocess
import sys
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP = Path(__file__).resolve().parent.parent          # app/
ADMIN = Path(__file__).resolve().parent               # app/admin/
IMAGES = APP / "public" / "images"
DATA_JSON = APP / "src" / "data" / "books.json"
BOOKS_TS = APP / "src" / "data" / "books.ts"

PORT = 8123
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

CATEGORY_TYPES = {
    "de": {"geschichten": "Kinderbuch", "malbuecher": "Malbuch", "komics": "Comic"},
    "en": {"geschichten": "Children's Book", "malbuecher": "Coloring Book", "komics": "Comic"},
}


# ─────────────────────────── Daten laden/speichern ───────────────────────────

def load_state() -> dict:
    return json.loads(DATA_JSON.read_text(encoding="utf-8"))


def save_state(state: dict):
    DATA_JSON.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    render_books_ts(state)


def ts_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_books_ts(state: dict):
    """Erzeugt src/data/books.ts komplett neu aus books.json."""
    s = state["site"]
    out = []
    out.append("// ─────────────────────────────────────────────────────────────")
    out.append("// Zentrale Konfiguration der Landingpage")
    out.append("// Diese Datei wird vom Admin-Programm automatisch erzeugt.")
    out.append("// Änderungen bitte im Admin-Programm vornehmen (ADMIN-STARTEN.bat).")
    out.append("// ─────────────────────────────────────────────────────────────")
    out.append("")
    out.append("export const SITE = {")
    out.append(f"  brand: {ts_str(s['brand'])},")
    out.append(f"  appUrl: {ts_str(s['appUrl'])},")
    out.append("  // Google-Play-Link hier eintragen, sobald die App im Store ist.")
    out.append("  // Solange das Feld leer ist, führt der Download-Button zur Web-App.")
    out.append(f"  playStoreUrl: {ts_str(s.get('playStoreUrl', ''))},")
    out.append(f"  paypalUrl: {ts_str(s['paypalUrl'])},")
    out.append(f"  authorPhoto: {ts_str(s.get('authorPhoto', '/images/autor.jpg'))},")
    out.append(f"  authorName: {ts_str(s.get('authorName', ''))},")
    out.append("  // Foto-Darstellung – im Admin-Programm einstellbar.")
    out.append(f"  authorPhotoShape: '{s.get('authorPhotoShape', 'rund')}' as const,")
    out.append(f"  authorPhotoSize: '{s.get('authorPhotoSize', 'klein')}' as const,")
    out.append("  // Impressum & Datenschutz – im Admin-Programm bearbeitbar.")
    out.append(f"  impressum: {ts_str(s.get('impressum', ''))},")
    out.append(f"  datenschutz: {ts_str(s.get('datenschutz', ''))},")
    out.append("}")
    out.append("")
    out.append("export type Category = 'geschichten' | 'malbuecher' | 'komics'")
    out.append("")
    out.append("export const CATEGORIES: { id: Category; label: string; emptyHint: string }[] = [")
    out.append("  { id: 'geschichten', label: 'Geschichten', emptyHint: '' },")
    out.append("  { id: 'malbuecher', label: 'Malbücher', emptyHint: '' },")
    out.append("  {")
    out.append("    id: 'komics',")
    out.append("    label: 'Comics',")
    out.append("    emptyHint: 'Hier entstehen gerade biblische Comic-Abenteuer – schau bald wieder vorbei!',")
    out.append("  },")
    out.append("]")
    out.append("")
    out.append("export interface Book {")
    out.append("  id: string")
    out.append("  /** Sprache der Buchausgabe */")
    out.append("  lang: 'de' | 'en'")
    out.append("  title: string")
    out.append("  series?: string")
    out.append("  category: Category")
    out.append("  type: 'Malbuch' | 'Kinderbuch' | 'Comic'")
    out.append("  age: string")
    out.append("  detail: string")
    out.append("  price?: string")
    out.append("  cover: string")
    out.append("  description: string")
    out.append("  highlights: string[]")
    out.append("  samples: string[]")
    out.append("  amazon: string")
    out.append("  tiktok?: string")
    out.append("  /** ISO-Datum 'YYYY-MM-DD' der Veröffentlichung – das „Neu\"-Badge")
    out.append("      erscheint automatisch für 30 Tage ab diesem Datum. */")
    out.append("  releaseDate?: string")
    out.append("  rating?: string")
    out.append("}")
    out.append("")
    out.append("const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000")
    out.append("")
    out.append("/** true, wenn das Buch vor weniger als 30 Tagen veröffentlicht wurde */")
    out.append("export function isNew(book: Book): boolean {")
    out.append("  if (!book.releaseDate) return false")
    out.append("  const released = new Date(`${book.releaseDate}T00:00:00`).getTime()")
    out.append("  const diff = Date.now() - released")
    out.append("  return diff >= 0 && diff < THIRTY_DAYS")
    out.append("}")
    out.append("")
    out.append("export const BOOKS: Book[] = [")
    for b in state["books"]:
        out.append("  {")
        out.append(f"    id: '{b['id']}',")
        out.append(f"    lang: '{b.get('lang', 'de')}',")
        out.append(f"    title: {ts_str(b['title'])},")
        if b.get("series"):
            out.append(f"    series: {ts_str(b['series'])},")
        out.append(f"    category: '{b['category']}',")
        out.append(f"    type: '{b['type']}',")
        out.append(f"    age: {ts_str(b.get('age', ''))},")
        out.append(f"    detail: {ts_str(b.get('detail', ''))},")
        if b.get("price"):
            out.append(f"    price: {ts_str(b['price'])},")
        out.append(f"    cover: '{b['cover']}',")
        out.append(f"    description: {ts_str(b.get('description', ''))},")
        hl = b.get("highlights", [])
        if hl:
            out.append("    highlights: [" + ", ".join(ts_str(h) for h in hl) + "],")
        else:
            out.append("    highlights: [],")
        samples = b.get("samples", [])
        if samples:
            out.append("    samples: [" + "".join(f"\n      '{x}'," for x in samples) + "\n    ],")
        else:
            out.append("    samples: [],")
        out.append(f"    amazon: {ts_str(b.get('amazon', ''))},")
        out.append(f"    tiktok: {ts_str(b.get('tiktok', ''))},")
        if b.get("releaseDate"):
            out.append(f"    releaseDate: '{b['releaseDate']}',")
        if b.get("rating"):
            out.append(f"    rating: {ts_str(b['rating'])},")
        out.append("  },")
    out.append("]")
    out.append("")
    out.append("export const COMING_SOON = [")
    for c in state.get("comingSoon", []):
        out.append(f"  {ts_str(c)},")
    out.append("]")
    out.append("")
    BOOKS_TS.write_text("\n".join(out), encoding="utf-8")


# ─────────────────────────── Helfer ───────────────────────────

def slugify(text: str) -> str:
    text = text.lower()
    for a, b in [("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")]:
        text = text.replace(a, b)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:40] or "buch"


def unique_id(state: dict, base: str) -> str:
    ids = {b["id"] for b in state["books"]}
    if base not in ids:
        return base
    i = 2
    while f"{base}-{i}" in ids:
        i += 1
    return f"{base}-{i}"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "de-DE,de;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


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
        m = re.search(r'aok-offscreen">\s*([\d,.]+\s*€)', html)
    if m:
        d["price"] = m.group(1).replace("\xa0", " ").strip()
    m = re.search(r'Lesealter\s*</span>.*?<span[^>]*>\s*([\d–\-+ ]+Jahre[^<]*)<', html, re.S)
    if m:
        d["age"] = m.group(1).strip()
    m = re.search(r'Seitenzahl der Print-Ausgabe\s*</span>.*?<span[^>]*>\s*(\d+)\s*Seiten', html, re.S)
    if m:
        d["detail"] = f'{m.group(1)} Seiten'
    m = re.search(r'([\d,]+)\s+von 5 Sternen', html)
    if m:
        d["rating"] = f'{m.group(1)} von 5'
    return d


def save_cover_from_bytes(data: bytes, dest: Path, width: int = 760):
    from PIL import Image as PILImage
    im = PILImage.open(io.BytesIO(data)).convert("RGB")
    if im.width > width:
        r = width / im.width
        im = im.resize((width, round(im.height * r)), PILImage.LANCZOS)
    im.save(dest, quality=90)


def extract_samples(pdf_bytes: bytes, book_id: str) -> list:
    """Holt 4 Beispielseiten aus der Buch-PDF und speichert sie als Bilder."""
    from pypdf import PdfReader
    from PIL import Image as PILImage

    reader = PdfReader(io.BytesIO(pdf_bytes))
    n = len(reader.pages)
    picks = [max(2, int(n * f)) for f in (0.12, 0.37, 0.62, 0.87)]
    out = []
    for num, pidx in enumerate(picks, 1):
        page = reader.pages[min(pidx, n - 1)]
        if not page.images:
            continue
        img = page.images[0]
        im = PILImage.open(io.BytesIO(img.data)).convert("RGB")
        r = 820 / im.width
        im = im.resize((820, round(im.height * r)), PILImage.LANCZOS)
        name = f"{book_id}-seite-{num}.jpg"
        im.save(IMAGES / name, quality=86)
        out.append(f"/images/{name}")
    return out


# ─────────────────────────── Multipart-Parsing ───────────────────────────

def parse_multipart(body: bytes, boundary: str):
    """Gibt (fields: dict, files: dict[name] -> (filename, bytes)) zurück."""
    fields, files = {}, {}
    delim = ("--" + boundary).encode()
    for part in body.split(delim):
        part = part.strip(b"\r\n")
        if not part or part == b"--":
            continue
        if b"\r\n\r\n" not in part:
            continue
        head, _, data = part.partition(b"\r\n\r\n")
        head = head.decode("utf-8", "replace")
        m = re.search(r'name="([^"]+)"', head)
        if not m:
            continue
        name = m.group(1)
        mf = re.search(r'filename="([^"]*)"', head)
        if mf and mf.group(1):
            files[name] = (mf.group(1), data)
        else:
            fields[name] = data.decode("utf-8", "replace")
    return fields, files


# ─────────────────────────── HTTP-Server ───────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # Konsole ruhig halten
        pass

    # ---------- Antworten ----------
    def send_json(self, obj, status=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path: Path, ctype: str):
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length)

    # ---------- GET ----------
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/" or path == "/index.html":
            self.send_file(ADMIN / "index.html", "text/html; charset=utf-8")
        elif path == "/api/state":
            self.send_json(load_state())
        elif path.startswith("/images/"):
            f = IMAGES / path[len("/images/"):]
            if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                ct = "image/png" if f.suffix.lower() == ".png" else ("image/webp" if f.suffix.lower() == ".webp" else "image/jpeg")
                self.send_file(f, ct)
            else:
                self.send_error(404)
        else:
            self.send_error(404)

    # ---------- POST ----------
    def do_POST(self):
        path = self.path.split("?")[0]
        try:
            if path == "/api/amazon":
                self.api_amazon()
            elif path == "/api/save":
                self.api_save()
            elif path == "/api/delete":
                self.api_delete()
            elif path == "/api/move":
                self.api_move()
            elif path == "/api/site":
                self.api_site()
            elif path == "/api/build":
                self.api_build()
            else:
                self.send_error(404)
        except Exception as e:
            self.send_json({"ok": False, "error": str(e)}, 500)

    def read_json(self) -> dict:
        raw = self.read_body()
        try:
            return json.loads(raw.decode("utf-8"))
        except UnicodeDecodeError:
            return json.loads(raw.decode("latin-1"))

    def api_amazon(self):
        url = self.read_json().get("url", "")
        m = re.search(r"(B0[A-Z0-9]{8})", url.upper())
        if not m:
            self.send_json({"ok": False, "error": "Keine ASIN gefunden. Bitte einen Amazon-Link wie https://www.amazon.de/dp/B0XXXXXXXX einfügen."})
            return
        asin = m.group(1)
        try:
            info = parse_amazon(fetch(f"https://www.amazon.de/dp/{asin}"))
        except Exception as e:
            self.send_json({"ok": False, "error": f"Amazon konnte nicht gelesen werden ({e}). Du kannst die Felder auch von Hand ausfüllen."})
            return
        info["ok"] = True
        info["amazon"] = f"https://www.amazon.de/dp/{asin}"
        if info.get("cover_url"):
            try:
                req = urllib.request.Request(info["cover_url"], headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = r.read()
                dest = IMAGES / f"cover-amazon-{asin}.jpg"
                save_cover_from_bytes(data, dest)
                info["cover"] = f"/images/cover-amazon-{asin}.jpg"
            except Exception:
                pass
        self.send_json(info)

    def api_save(self):
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r"boundary=([^;]+)", ctype)
        if not m:
            self.send_json({"ok": False, "error": "Ungültige Anfrage."}, 400)
            return
        fields, files = parse_multipart(self.read_body(), m.group(1).strip('"'))

        state = load_state()
        book_id = (fields.get("id") or "").strip()
        title = (fields.get("title") or "").strip()
        if not title:
            self.send_json({"ok": False, "error": "Bitte einen Titel eingeben."})
            return

        existing = next((b for b in state["books"] if b["id"] == book_id), None)
        if existing is None:
            book_id = unique_id(state, slugify(title.split("–")[0].split(":")[0]))
            book = {"id": book_id, "samples": [], "highlights": []}
            state["books"].append(book)
        else:
            book = existing

        category = fields.get("category", "malbuecher")
        if category not in CATEGORY_TYPES["de"]:
            category = "malbuecher"
        lang = fields.get("lang", "de")
        if lang not in ("de", "en"):
            lang = "de"
        book["lang"] = lang
        book["title"] = title
        book["series"] = fields.get("series", "").strip()
        book["category"] = category
        book["type"] = CATEGORY_TYPES[lang][category]
        book["age"] = fields.get("age", "").strip()
        book["detail"] = fields.get("detail", "").strip()
        book["price"] = fields.get("price", "").strip()
        book["description"] = fields.get("description", "").strip()
        book["amazon"] = fields.get("amazon", "").strip()
        book["tiktok"] = fields.get("tiktok", "").strip()
        book["rating"] = fields.get("rating", "").strip()
        book["highlights"] = [h.strip() for h in fields.get("highlights", "").split("\n") if h.strip()]
        if fields.get("isNew") == "1":
            book["releaseDate"] = datetime.date.today().isoformat()
        else:
            book["releaseDate"] = fields.get("releaseDate", "").strip()

        # Cover: hochgeladene Datei hat Vorrang, sonst Amazon-Cover, sonst altes behalten
        if "cover" in files:
            dest = IMAGES / f"cover-{book_id}.jpg"
            save_cover_from_bytes(files["cover"][1], dest)
            book["cover"] = f"/images/cover-{book_id}.jpg"
        elif fields.get("amazonCover", "").strip():
            src = IMAGES / Path(fields["amazonCover"].strip()).name
            if src.is_file():
                dest = IMAGES / f"cover-{book_id}.jpg"
                if src.resolve() != dest.resolve():
                    dest.write_bytes(src.read_bytes())
                    src.unlink()
                book["cover"] = f"/images/cover-{book_id}.jpg"
        book.setdefault("cover", f"/images/cover-{book_id}.jpg")

        # PDF → 4 Beispielseiten
        if "pdf" in files:
            samples = extract_samples(files["pdf"][1], book_id)
            if samples:
                book["samples"] = samples

        save_state(state)
        self.send_json({"ok": True, "book": book})

    def api_delete(self):
        book_id = self.read_json().get("id", "")
        state = load_state()
        before = len(state["books"])
        state["books"] = [b for b in state["books"] if b["id"] != book_id]
        if len(state["books"]) == before:
            self.send_json({"ok": False, "error": "Buch nicht gefunden."})
            return
        save_state(state)
        self.send_json({"ok": True})

    def api_move(self):
        d = self.read_json()
        book_id, direction = d.get("id", ""), d.get("dir", 0)
        state = load_state()
        books = state["books"]
        idx = next((i for i, b in enumerate(books) if b["id"] == book_id), -1)
        new = idx + int(direction)
        if idx < 0 or new < 0 or new >= len(books):
            self.send_json({"ok": False, "error": "Verschieben nicht möglich."})
            return
        books[idx], books[new] = books[new], books[idx]
        save_state(state)
        self.send_json({"ok": True})

    def api_site(self):
        # Kommt als multipart (damit das Foto mit hochgeladen werden kann)
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r"boundary=([^;]+)", ctype)
        if not m:
            self.send_json({"ok": False, "error": "Ungültige Anfrage."}, 400)
            return
        fields, files = parse_multipart(self.read_body(), m.group(1).strip('"'))
        state = load_state()
        for key in ("brand", "appUrl", "playStoreUrl", "paypalUrl", "authorName"):
            if key in fields:
                state["site"][key] = fields[key].strip()
        for key in ("impressum", "datenschutz"):
            if key in fields:
                state["site"][key] = fields[key].strip("\n")
        if fields.get("authorPhotoShape") in ("rund", "abgerundet", "eckig"):
            state["site"]["authorPhotoShape"] = fields["authorPhotoShape"]
        if fields.get("authorPhotoSize") in ("klein", "mittel", "gross"):
            state["site"]["authorPhotoSize"] = fields["authorPhotoSize"]
        if "comingSoon" in fields:
            state["comingSoon"] = [c.strip() for c in fields["comingSoon"].split("\n") if c.strip()]
        if "photo" in files:
            dest = IMAGES / "autor.jpg"
            save_cover_from_bytes(files["photo"][1], dest, width=600)
            # Version anhängen, damit das neue Foto sofort sichtbar ist (Browser-Cache)
            state["site"]["authorPhoto"] = f"/images/autor.jpg?v={int(datetime.datetime.now().timestamp())}"
        save_state(state)
        self.send_json({"ok": True, "site": state["site"]})

    def api_build(self):
        try:
            proc = subprocess.run(
                ["cmd", "/c", "npm", "run", "build"],
                cwd=str(APP), capture_output=True, text=True, timeout=300,
            )
            ok = proc.returncode == 0
            log = (proc.stdout + "\n" + proc.stderr).strip()[-4000:]
            self.send_json({"ok": ok, "log": log})
        except Exception as e:
            self.send_json({"ok": False, "log": str(e)})


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    url = f"http://localhost:{PORT}/"
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        # Port belegt – meist läuft das Admin-Programm schon.
        print("=" * 56)
        print("  LambKing Admin läuft bereits!")
        print(f"  Öffne einfach: {url}")
        print("=" * 56)
        webbrowser.open(url)
        input("\n  Zum Schließen Enter drücken …")
        return
    print("=" * 56)
    print("  LambKing Admin läuft!")
    print(f"  Verwaltungsseite: {url}")
    print("  Zum Beenden dieses Fenster einfach schließen.")
    print("=" * 56)
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
