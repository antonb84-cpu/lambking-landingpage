#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LambKing Admin – lokales Verwaltungsprogramm für die Landingpage.

Start: Doppelklick auf ADMIN-STARTEN.bat (im Projektordner)
oder:  python admin/admin_server.py

Alles läuft nur lokal auf diesem Computer (127.0.0.1) – es werden
keine Daten an Dritte gesendet. „Veröffentlichen" schiebt die
Änderungen per Git zu GitHub; GitHub Actions baut und veröffentlicht
die Website automatisch.
"""

import datetime
import io
import json
import re
import shutil
import subprocess
import sys
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# Alle Pfade werden relativ zum Speicherort dieses Skripts bestimmt –
# das Projekt funktioniert dadurch in jedem Ordner / auf jedem Laufwerk.
ROOT = Path(__file__).resolve().parent.parent        # Projektordner
ADMIN = Path(__file__).resolve().parent              # admin/
IMAGES = ROOT / "public" / "images"
DATA_JSON = ROOT / "src" / "data" / "books.json"
BOOKS_TS = ROOT / "src" / "data" / "books.ts"

PORT = 8123
MAX_IMAGE_BYTES = 15 * 1024 * 1024    # 15 MB für Cover/Fotos
MAX_PDF_BYTES = 60 * 1024 * 1024      # 60 MB für Buch-PDFs
MAX_IMAGE_PIXELS = 40_000_000         # Schutz vor riesigen Bildern

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

CATEGORIES = ("geschichten", "malbuecher", "komics")

IMPRESSUM_PLATZHALTER = ("[", "REPLACE_ME", "Straße und Hausnummer",
                         "PLZ und Ort", "deine@email.de")


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
    out.append("  // Google-Play-Link – im Admin eintragen, sobald die App im Store ist.")
    out.append(f"  playStoreUrl: {ts_str(s.get('playStoreUrl', ''))},")
    out.append(f"  paypalUrl: {ts_str(s.get('paypalUrl', ''))},")
    out.append(f"  kofiUrl: {ts_str(s.get('kofiUrl', ''))},")
    out.append(f"  publicUrl: {ts_str(s.get('publicUrl', ''))},")
    out.append(f"  authorPhoto: {ts_str(s.get('authorPhoto', 'images/autor.jpg'))},")
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
    out.append("export const CATEGORY_IDS: Category[] = ['geschichten', 'malbuecher', 'komics']")
    out.append("")
    out.append("export interface Book {")
    out.append("  id: string")
    out.append("  /** Sprache der Buchausgabe */")
    out.append("  lang: 'de' | 'en'")
    out.append("  title: string")
    out.append("  series?: string")
    out.append("  category: Category")
    out.append("  age: string")
    out.append("  detail: string")
    out.append("  cover: string")
    out.append("  description: string")
    out.append("  highlights: string[]")
    out.append("  samples: string[]")
    out.append("  amazon: string")
    out.append("  /** ISO-Datum 'YYYY-MM-DD' – das „Neu\"-Badge erscheint 30 Tage. */")
    out.append("  releaseDate?: string")
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
        out.append(f"    age: {ts_str(b.get('age', ''))},")
        out.append(f"    detail: {ts_str(b.get('detail', ''))},")
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
        if b.get("releaseDate"):
            out.append(f"    releaseDate: '{b['releaseDate']}',")
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
    """Nur Inhalte holen – keine Preise/Bewertungen scrapen (die stehen live bei Amazon)."""
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
    m = re.search(r'Lesealter\s*</span>.*?<span[^>]*>\s*([\d–\-+ ]+Jahre[^<]*)<', html, re.S)
    if m:
        d["age"] = m.group(1).strip()
    m = re.search(r'Seitenzahl der Print-Ausgabe\s*</span>.*?<span[^>]*>\s*(\d+)\s*Seiten', html, re.S)
    if m:
        d["detail"] = f'{m.group(1)} Seiten'
    return d


def save_image(data: bytes, dest: Path, width: int = 760):
    """Bild wirklich validieren (PIL), Größenlimits prüfen, verkleinern."""
    from PIL import Image as PILImage
    PILImage.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    im = PILImage.open(io.BytesIO(data))
    im.verify()  # wirft bei beschädigten/gefälschten Bildern
    im = PILImage.open(io.BytesIO(data)).convert("RGB")
    if im.width > width:
        r = width / im.width
        im = im.resize((width, round(im.height * r)), PILImage.LANCZOS)
    im.save(dest, quality=90)


def extract_samples(pdf_bytes: bytes, book_id: str) -> list:
    """Rendert 4 echte PDF-Seiten (Anfang/Mitte/Ende) als Web-Bilder.
    Nutzt PyMuPDF; ohne PyMuPDF Fallback auf eingebettete Bilder (pypdf)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        n = doc.page_count
        picks = [max(1, int(n * f)) for f in (0.12, 0.37, 0.62, 0.87)]
        out = []
        num = 0
        for pidx in picks:
            # leere Seiten überspringen (kein Text und kein Bild)
            page = doc[min(pidx, n - 1)]
            if not page.get_text().strip() and not page.get_images():
                continue
            num += 1
            zoom = 820 / page.rect.width
            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
            name = f"{book_id}-seite-{num}.jpg"
            pix.save(str(IMAGES / name), jpg_quality=86)
            out.append(f"images/{name}")
        doc.close()
        return out
    except ImportError:
        # Fallback: erste eingebettete Bilder (älteres Verhalten)
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
            out.append(f"images/{name}")
        return out


def git(*args, timeout=180):
    """Git im Projektordner ausführen – Authentifizierung über die
    normale GitHub-Anmeldung dieses PCs (keine Tokens im Code)."""
    return subprocess.run(["git", "-C", str(ROOT), *args],
                          capture_output=True, text=True, timeout=timeout)


def repo_slug() -> str:
    """Besitzer/Repo aus der Git-Remote ermitteln (nicht fest einprogrammiert)."""
    try:
        url = git("remote", "get-url", "origin").stdout.strip()
        m = re.search(r"github\.com[:/]([^/]+)/([^/.]+)", url)
        if m:
            return f"{m.group(1)}/{m.group(2)}"
    except Exception:
        pass
    return ""


def precheck(state: dict) -> list:
    """Pre-Publish-Checkliste: (status, text) mit status = gruen/gelb/rot."""
    s = state["site"]
    checks = []
    imp = s.get("impressum", "")
    if any(p in imp for p in IMPRESSUM_PLATZHALTER) or not imp.strip():
        checks.append(("rot", "Impressum enthält noch Platzhalter"))
    else:
        checks.append(("gruen", "Impressum vollständig"))
    checks.append(("gruen" if s.get("datenschutz", "").strip() else "rot",
                   "Datenschutzerklärung vorhanden"))
    checks.append(("gruen" if state["books"] else "gelb", "Mindestens ein Buch eingetragen"))
    no_cover = [b["title"] for b in state["books"] if not (IMAGES / Path(b["cover"]).name).is_file()]
    checks.append(("rot" if no_cover else "gruen",
                   "Alle Cover vorhanden" if not no_cover else f"Cover fehlt: {', '.join(no_cover)}"))
    no_amazon = [b["title"] for b in state["books"] if not b.get("amazon", "").startswith("https://")]
    checks.append(("rot" if no_amazon else "gruen",
                   "Alle Amazon-Links gültig" if not no_amazon else f"Amazon-Link fehlt: {', '.join(no_amazon)}"))
    checks.append(("gruen" if shutil.which("git") else "rot", "Git verfügbar"))
    try:
        urllib.request.urlopen("https://api.github.com", timeout=5)
        gh = True
    except Exception:
        gh = False
    checks.append(("gruen" if gh else "gelb",
                   "GitHub erreichbar" if gh else "GitHub nicht erreichbar – nur lokal speichern möglich"))
    return checks


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
            files[name] = (Path(mf.group(1)).name, data)
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

    def read_body(self, limit: int) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        if length > limit:
            raise ValueError("LIMIT")
        return self.rfile.read(length)

    def local_only(self) -> bool:
        """Schreibende Anfragen nur von diesem Computer zulassen."""
        host = self.headers.get("Host", "")
        return host.startswith("localhost") or host.startswith("127.0.0.1")

    # ---------- GET ----------
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/" or path == "/index.html":
            self.send_file(ADMIN / "index.html", "text/html; charset=utf-8")
        elif path == "/api/state":
            self.send_json(load_state())
        elif path == "/api/git-status":
            self.api_git_status()
        elif path == "/api/action-status":
            self.api_action_status()
        elif path == "/api/precheck":
            self.send_json({"ok": True, "checks": precheck(load_state())})
        elif path.startswith("/vorschau"):
            # Lokale Vorschau der gebauten Seite (dist/) – mit Traversal-Schutz
            rel = path[len("/vorschau"):].lstrip("/") or "index.html"
            dist = ROOT / "dist"
            f = (dist / rel).resolve()
            if not str(f).startswith(str(dist.resolve())) or not f.is_file():
                self.send_error(404)
                return
            ct = {
                ".html": "text/html; charset=utf-8", ".js": "text/javascript",
                ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2",
                ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
            }.get(f.suffix.lower(), "application/octet-stream")
            self.send_file(f, ct)
        elif path.startswith("/images/"):
            # Nur Dateiname erlauben – kein Zugriff außerhalb von public/images
            name = Path(path[len("/images/"):]).name
            f = IMAGES / name
            if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                ct = "image/png" if f.suffix.lower() == ".png" else ("image/webp" if f.suffix.lower() == ".webp" else "image/jpeg")
                self.send_file(f, ct)
            else:
                self.send_error(404)
        else:
            self.send_error(404)

    # ---------- POST ----------
    def do_POST(self):
        if not self.local_only():
            self.send_json({"ok": False, "error": "Nur lokale Anfragen erlaubt."}, 403)
            return
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
            elif path == "/api/orphans":
                self.api_orphans()
            elif path == "/api/build":
                self.api_build()
            elif path == "/api/publish":
                self.api_publish()
            else:
                self.send_error(404)
        except ValueError as e:
            if str(e) == "LIMIT":
                self.send_json({"ok": False, "error": "Datei ist zu groß (Bilder max. 15 MB, PDF max. 60 MB)."}, 413)
            else:
                self.send_json({"ok": False, "error": "Ungültige Anfrage."}, 400)
        except Exception:
            # keine internen Dateipfade o. Ä. an den Browser geben
            self.send_json({"ok": False, "error": "Unerwarteter Fehler – bitte Konsole im schwarzen Fenster prüfen."}, 500)

    def read_json(self, limit=1 * 1024 * 1024) -> dict:
        raw = self.read_body(limit)
        try:
            return json.loads(raw.decode("utf-8"))
        except UnicodeDecodeError:
            return json.loads(raw.decode("latin-1"))

    # ---------- Bücher ----------
    def api_amazon(self):
        url = self.read_json().get("url", "")
        m = re.search(r"(B0[A-Z0-9]{8})", url.upper())
        if not m:
            self.send_json({"ok": False, "error": "Keine ASIN gefunden. Bitte einen Amazon-Link wie https://www.amazon.de/dp/B0XXXXXXXX einfügen."})
            return
        asin = m.group(1)
        try:
            info = parse_amazon(fetch(f"https://www.amazon.de/dp/{asin}"))
        except Exception:
            self.send_json({"ok": False, "error": "Amazon konnte nicht gelesen werden. Du kannst die Felder auch von Hand ausfüllen."})
            return
        info["ok"] = True
        info["amazon"] = f"https://www.amazon.de/dp/{asin}"
        if info.get("cover_url"):
            try:
                req = urllib.request.Request(info["cover_url"], headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = r.read()
                if len(data) <= MAX_IMAGE_BYTES:
                    dest = IMAGES / f"cover-amazon-{asin}.jpg"
                    save_image(data, dest)
                    info["cover"] = f"images/cover-amazon-{asin}.jpg"
            except Exception:
                pass
        self.send_json(info)

    def api_save(self):
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r"boundary=([^;]+)", ctype)
        if not m:
            self.send_json({"ok": False, "error": "Ungültige Anfrage."}, 400)
            return
        fields, files = parse_multipart(self.read_body(MAX_PDF_BYTES + MAX_IMAGE_BYTES + 2 * 1024 * 1024),
                                        m.group(1).strip('"'))

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
        if category not in CATEGORIES:
            category = "malbuecher"
        lang = fields.get("lang", "de")
        book["lang"] = lang if lang in ("de", "en") else "de"
        book["title"] = title
        book["series"] = fields.get("series", "").strip()
        book["category"] = category
        book["age"] = fields.get("age", "").strip()
        book["detail"] = fields.get("detail", "").strip()
        book["description"] = fields.get("description", "").strip()
        book["amazon"] = fields.get("amazon", "").strip()
        if book["amazon"] and not book["amazon"].startswith("https://"):
            self.send_json({"ok": False, "error": "Der Amazon-Link muss mit https:// beginnen."})
            return
        book["highlights"] = [h.strip() for h in fields.get("highlights", "").split("\n") if h.strip()]
        if fields.get("isNew") == "1":
            book["releaseDate"] = datetime.date.today().isoformat()
        else:
            book["releaseDate"] = fields.get("releaseDate", "").strip()

        # Cover: hochgeladene Datei hat Vorrang, sonst Amazon-Cover, sonst altes behalten
        if "cover" in files:
            fname, data = files["cover"]
            if len(data) > MAX_IMAGE_BYTES:
                self.send_json({"ok": False, "error": "Das Cover ist größer als 15 MB."})
                return
            try:
                dest = IMAGES / f"cover-{book_id}.jpg"
                save_image(data, dest)
            except Exception:
                self.send_json({"ok": False, "error": "Das Cover konnte nicht gelesen werden – bitte ein gültiges Bild (JPG/PNG) hochladen."})
                return
            book["cover"] = f"images/cover-{book_id}.jpg"
        elif fields.get("amazonCover", "").strip():
            src = IMAGES / Path(fields["amazonCover"].strip()).name
            if src.is_file():
                dest = IMAGES / f"cover-{book_id}.jpg"
                if src.resolve() != dest.resolve():
                    dest.write_bytes(src.read_bytes())
                    src.unlink()
                book["cover"] = f"images/cover-{book_id}.jpg"
        book.setdefault("cover", f"images/cover-{book_id}.jpg")

        # PDF → echte gerenderte Beispielseiten
        if "pdf" in files:
            fname, data = files["pdf"]
            if len(data) > MAX_PDF_BYTES:
                self.send_json({"ok": False, "error": "Die PDF ist größer als 60 MB."})
                return
            if not data.startswith(b"%PDF"):
                self.send_json({"ok": False, "error": "Das ist keine gültige PDF-Datei."})
                return
            try:
                samples = extract_samples(data, book_id)
                if samples:
                    book["samples"] = samples
            except Exception:
                self.send_json({"ok": False, "error": "Die PDF konnte nicht verarbeitet werden."})
                return

        save_state(state)
        self.send_json({"ok": True, "book": book})

    def api_delete(self):
        book_id = self.read_json().get("id", "")
        state = load_state()
        book = next((b for b in state["books"] if b["id"] == book_id), None)
        if book is None:
            self.send_json({"ok": False, "error": "Buch nicht gefunden."})
            return
        # Nur Dateien löschen, die eindeutig zu diesem Buch gehören
        removed = []
        for f in IMAGES.glob(f"cover-{book_id}.jpg"):
            f.unlink()
            removed.append(f.name)
        for f in IMAGES.glob(f"{book_id}-seite-*.jpg"):
            f.unlink()
            removed.append(f.name)
        state["books"] = [b for b in state["books"] if b["id"] != book_id]
        save_state(state)
        self.send_json({"ok": True, "removedFiles": removed})

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

    def api_orphans(self):
        """Findet Bilddateien, die keinem Buch mehr zugeordnet sind (Wartung)."""
        state = load_state()
        used = set()
        for b in state["books"]:
            used.add(Path(b.get("cover", "")).name)
            for s in b.get("samples", []):
                used.add(Path(s).name)
        orphans = []
        for f in IMAGES.iterdir():
            n = f.name
            if (n.startswith("cover-") or "-seite-" in n) and n not in used and not n.startswith("cover-amazon-"):
                orphans.append(n)
        self.send_json({"ok": True, "orphans": sorted(orphans)})

    # ---------- Website-Einstellungen ----------
    def api_site(self):
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r"boundary=([^;]+)", ctype)
        if not m:
            self.send_json({"ok": False, "error": "Ungültige Anfrage."}, 400)
            return
        fields, files = parse_multipart(self.read_body(MAX_IMAGE_BYTES + 4 * 1024 * 1024),
                                        m.group(1).strip('"'))
        state = load_state()
        for key in ("brand", "appUrl", "playStoreUrl", "paypalUrl", "kofiUrl", "authorName"):
            if key in fields:
                val = fields[key].strip()
                if key.endswith("Url") and val and not val.startswith("https://"):
                    self.send_json({"ok": False, "error": f"{key} muss mit https:// beginnen (oder leer bleiben)."})
                    return
                state["site"][key] = val
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
            _, data = files["photo"]
            if len(data) > MAX_IMAGE_BYTES:
                self.send_json({"ok": False, "error": "Das Foto ist größer als 15 MB."})
                return
            try:
                dest = IMAGES / "autor.jpg"
                save_image(data, dest, width=600)
            except Exception:
                self.send_json({"ok": False, "error": "Das Foto konnte nicht gelesen werden – bitte ein gültiges Bild hochladen."})
                return
            state["site"]["authorPhoto"] = f"images/autor.jpg?v={int(datetime.datetime.now().timestamp())}"
        save_state(state)
        self.send_json({"ok": True, "site": state["site"]})

    # ---------- Git / GitHub ----------
    def api_git_status(self):
        """Echter Status aus Git: ungesicherte Änderungen + letzte Sicherung."""
        git("fetch", "-q", "origin", timeout=60)
        status = git("status", "--porcelain").stdout
        changed = len([l for l in status.splitlines() if l.strip()])
        ahead = git("rev-list", "--count", "origin/main..HEAD").stdout.strip()
        behind = git("rev-list", "--count", "HEAD..origin/main").stdout.strip()
        last = git("log", "origin/main", "-1", "--format=%ci").stdout.strip()
        self.send_json({
            "ok": True,
            "unsaved": changed,
            "unpublished": int(ahead or 0),
            "behind": int(behind or 0),
            "lastBackup": last,
        })

    def api_action_status(self):
        """Status des letzten GitHub-Actions-Laufs (öffentliches Repo, keine Anmeldung nötig)."""
        slug = repo_slug()
        if not slug:
            self.send_json({"ok": False, "error": "GitHub-Remote nicht gefunden."})
            return
        try:
            req = urllib.request.Request(
                f"https://api.github.com/repos/{slug}/actions/runs?per_page=1",
                headers={"User-Agent": UA, "Accept": "application/vnd.github+json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                d = json.loads(r.read().decode())
            run = (d.get("workflow_runs") or [{}])[0]
            self.send_json({
                "ok": True,
                "status": run.get("status", ""),
                "conclusion": run.get("conclusion", ""),
                "url": run.get("html_url", f"https://github.com/{slug}/actions"),
            })
        except Exception:
            self.send_json({"ok": False, "error": "Status konnte nicht abgerufen werden.",
                            "url": f"https://github.com/{slug}/actions"})

    # ---------- Build & Veröffentlichen ----------
    def api_build(self):
        try:
            proc = subprocess.run(
                ["cmd", "/c", "npm", "run", "build"],
                cwd=str(ROOT), capture_output=True, text=True, timeout=300,
            )
            ok = proc.returncode == 0
            log = (proc.stdout + "\n" + proc.stderr).strip()[-4000:]
            self.send_json({"ok": ok, "log": log})
        except Exception:
            self.send_json({"ok": False, "log": "Build konnte nicht gestartet werden."})

    def api_publish(self):
        """Veröffentlichen = prüfen → committen → zu GitHub main pushen.
        GitHub Actions baut danach automatisch die Live-Seite."""
        state = load_state()

        # 1. Pflichtdaten validieren (Pre-Publish-Ampel)
        checks = precheck(state)
        rot = [t for st, t in checks if st == "rot"]
        if rot:
            self.send_json({"ok": False, "stage": "checks",
                            "error": "Veröffentlichung nicht möglich – bitte zuerst die Pflichtangaben vervollständigen.",
                            "details": rot, "checks": checks})
            return

        # 2. Qualität prüfen (lint + Tests + Build)
        proc = subprocess.run(["cmd", "/c", "npm", "run", "check"],
                              cwd=str(ROOT), capture_output=True, text=True, timeout=600)
        if proc.returncode != 0:
            self.send_json({"ok": False, "stage": "build",
                            "error": "Veröffentlichung abgebrochen: Prüfung oder Bau der Seite ist fehlgeschlagen.",
                            "log": (proc.stdout + "\n" + proc.stderr)[-4000:], "checks": checks})
            return

        # 3. Remote-Konflikte erkennen – nichts blind überschreiben
        git("fetch", "-q", "origin", timeout=60)
        behind = git("rev-list", "--count", "HEAD..origin/main").stdout.strip()
        if behind not in ("", "0"):
            self.send_json({"ok": False, "stage": "git",
                            "error": "Auf GitHub befindet sich eine neuere Version. Bitte zuerst synchronisieren.",
                            "checks": checks})
            return

        # 4. Commit (nachvollziehbare Nachricht für die Versionshistorie)
        git("add", "-A")
        if not git("status", "--porcelain").stdout.strip():
            self.send_json({"ok": True, "already": True, "checks": checks,
                            "message": "Keine neuen Änderungen – alles ist bereits auf GitHub gesichert."})
            return
        msg = f"LambKing Inhalte aktualisiert ({datetime.datetime.now().strftime('%d.%m.%Y %H:%M')})"
        commit = git("-c", "user.name=Anton Bernt", "-c", "user.email=antonb84@gmail.com",
                     "commit", "-qm", msg)
        if commit.returncode != 0:
            self.send_json({"ok": False, "stage": "git", "error": "Veröffentlichung abgebrochen: Commit fehlgeschlagen.",
                            "log": commit.stderr[-2000:], "checks": checks})
            return

        # 5. Push – ohne --force, mit Erfolgskontrolle
        push = git("push", "origin", "main", timeout=180)
        if push.returncode != 0:
            err = push.stderr.lower()
            if "authentication" in err or "credentials" in err:
                msg2 = "Dieser Computer ist noch nicht bei GitHub angemeldet."
            else:
                msg2 = "Veröffentlichung abgebrochen: Übertragung zu GitHub fehlgeschlagen."
            self.send_json({"ok": False, "stage": "push", "error": msg2,
                            "log": push.stderr[-2000:], "checks": checks})
            return

        self.send_json({"ok": True, "checks": checks,
                        "message": "Die Änderungen wurden zu GitHub übertragen. GitHub erstellt jetzt automatisch die neue LambKing-Seite.",
                        "actionsUrl": f"https://github.com/{repo_slug()}/actions" if repo_slug() else ""})


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
