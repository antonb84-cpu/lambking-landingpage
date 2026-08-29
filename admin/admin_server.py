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
import html as html_lib
import io
import json
import re
import shutil
import subprocess
import sys
import threading
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
MAX_SAMPLE_IMAGES = 12                 # einzelne Vorschauseiten/Screenshots

PREVIEW_BUILD_LOCK = threading.Lock()

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
    out.append("export type Category = string")
    out.append("")
    out.append("// Kategorien – im Admin-Programm verwaltbar (Label + Farbe)")
    out.append("export interface CategoryDef {")
    out.append("  id: string")
    out.append("  labelDe: string")
    out.append("  labelEn: string")
    out.append("  typeDe: string")
    out.append("  typeEn: string")
    out.append("  color: string")
    out.append("}")
    out.append("")
    out.append("export const CATEGORIES: CategoryDef[] = [")

    default_cats = [
        {"id": "geschichten", "labelDe": "Geschichten", "labelEn": "Stories",
         "typeDe": "Kinderbuch", "typeEn": "Children's Book", "color": "#2E7D4F"},
        {"id": "malbuecher", "labelDe": "Malbücher", "labelEn": "Coloring Books",
         "typeDe": "Malbuch", "typeEn": "Coloring Book", "color": "#1B3A5C"},
        {"id": "komics", "labelDe": "Comics", "labelEn": "Comics",
         "typeDe": "Comic", "typeEn": "Comic", "color": "#B3402E"},
    ]
    for c in state.get("categories", default_cats):
        out.append("  {")
        out.append(f"    id: '{c['id']}',")
        out.append(f"    labelDe: {ts_str(c.get('labelDe', c['id']))},")
        out.append(f"    labelEn: {ts_str(c.get('labelEn', c.get('labelDe', c['id'])))},")
        out.append(f"    typeDe: {ts_str(c.get('typeDe', ''))},")
        out.append(f"    typeEn: {ts_str(c.get('typeEn', c.get('typeDe', '')))},")
        out.append(f"    color: '{c.get('color', '#1B3A5C')}',")
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


def decode_html(data: bytes, charset: str = "") -> str:
    """Dekodiert Shop-Seiten ohne kaputte Umlaute.

    Amazon liefert deutsche Produkttexte je nach Antwort als UTF-8 oder
    ISO-8859-1. Ein stilles ``replace`` würde daraus Fragezeichen machen.
    """
    candidates = [charset, "utf-8", "iso-8859-1"]
    for encoding in candidates:
        if not encoding:
            continue
        try:
            return data.decode(encoding)
        except (LookupError, UnicodeDecodeError):
            continue
    return data.decode("utf-8", "replace")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Language": "de-DE,de;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Cookie": "i18n-prefs=EUR; lc-main=de_DE",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return decode_html(r.read(), r.headers.get_content_charset() or "")


def fetch_amazon_html(asin: str) -> str:
    """Lädt eine Amazon-Produktseite.

    Amazon liefert einfachen Python-Anfragen gelegentlich nur eine
    "Weiter shoppen"-Zwischenseite. In diesem Fall wird das auf Windows
    ohnehin vorhandene curl als zweiter, normaler HTTP-Client verwendet.
    """
    url = f"https://www.amazon.de/dp/{asin}?th=1&psc=1"
    page = ""
    try:
        page = fetch(url)
    except Exception:
        pass
    if len(page) > 20_000 and re.search(r'id=["\']productTitle["\']', page):
        return page

    curl = shutil.which("curl") or shutil.which("curl.exe")
    if curl:
        result = subprocess.run([
            curl, "--silent", "--show-error", "--location", "--compressed",
            "--max-time", "45", url,
            "--user-agent", UA,
            "--header", "Accept-Language: de-DE,de;q=0.9",
            "--header", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "--header", "Cookie: i18n-prefs=EUR; lc-main=de_DE",
        ], capture_output=True, timeout=50)
        if result.returncode == 0:
            page = decode_html(result.stdout)
            if len(page) > 20_000 and re.search(r'id=["\']productTitle["\']', page):
                return page
    raise RuntimeError("Amazon-Produktseite nicht verfügbar")


def clean_amazon_text(value: str, multiline: bool = False) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    if multiline:
        value = re.sub(r"</?(?:p|li|h[1-6])\b[^>]*>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html_lib.unescape(value).replace("\xa0", " ")
    if not multiline:
        return re.sub(r"\s+([.,;:!?])", r"\1", re.sub(r"\s+", " ", value)).strip()
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.splitlines()]
    result = "\n\n".join(line for line in lines if line)
    return re.sub(r"\s+([.,;:!?])", r"\1", result)


def first_match(source: str, patterns: list[str], flags=re.S) -> str:
    for pattern in patterns:
        match = re.search(pattern, source, flags)
        if match:
            return match.group(1)
    return ""


def parse_amazon(html: str) -> dict:
    """Nur Inhalte holen – keine Preise/Bewertungen scrapen (die stehen live bei Amazon)."""
    d = {}
    title = first_match(html, [
        r'<(?:span|h1)[^>]*\bid=["\']productTitle["\'][^>]*>(.*?)</(?:span|h1)>',
        r'<title[^>]*>(.*?)</title>',
    ])
    if title:
        title = clean_amazon_text(title)
        d["title"] = re.sub(r"\s*:\s*Amazon\.de.*$", "", title).strip()

    description = first_match(html, [
        r'id=["\']bookDescription_feature_div["\'][\s\S]*?<div[^>]*class=["\'][^"\']*a-expander-content[^"\']*["\'][^>]*>([\s\S]*?)<div[^>]*class=["\'][^"\']*a-expander-header',
        r'<div[^>]*\bid=["\']bookDescription_feature_div["\'][^>]*>([\s\S]*?)<div[^>]+\bid=["\']globalStoreInfoBullets_feature_div["\']',
        r'<div[^>]*\bid=["\']productDescription["\'][^>]*>(.*?)</div>',
        r'<meta[^>]*(?:name|property)=["\']description["\'][^>]*content=["\'](.*?)["\']',
        r'<meta[^>]*content=["\'](.*?)["\'][^>]*(?:name|property)=["\']description["\']',
    ])
    if description:
        description = re.sub(r"\s*Mehr lesen\s*$", "", clean_amazon_text(description, multiline=True))
        if description:
            d["description"] = description

    age = first_match(html, [
        r'book_details-customer_recommended_age[\s\S]{0,1200}?rpi-attribute-value[^>]*>[\s\S]*?<span[^>]*>(.*?)</span>',
        r'Lesealter[\s\S]{0,1200}?<span[^>]*>\s*([\d–\-+\s\xa0]+Jahre[^<]*)</span>',
    ])
    if age:
        age = clean_amazon_text(age)
        if age.lower().startswith("ab ") or re.search(r"\d\s*[–-]\s*\d", age):
            d["age"] = age
        else:
            d["age"] = "Ab " + re.sub(r"\bJahre\b", "Jahren", age)

    pages = first_match(html, [
        r'Seitenzahl der Print-Ausgabe[\s\S]{0,1200}?<span[^>]*>\s*(\d+)\s*Seiten',
        r'book_details-fiona_pages[\s\S]{0,1200}?rpi-attribute-value[^>]*>[\s\S]*?<span[^>]*>\s*(\d+)',
    ])
    if pages:
        d["detail"] = f"{pages} Seiten"

    series = first_match(html, [
        r'book_details-series[\s\S]{0,1200}?rpi-attribute-value[^>]*>[\s\S]*?<span[^>]*>(.*?)</span>',
    ])
    if series:
        d["series"] = clean_amazon_text(series)

    image_urls = []
    landing = re.search(r'<img[^>]*\bid=["\']landingImage["\'][^>]*>', html, re.I)
    if landing:
        high = first_match(landing.group(0), [r'data-old-hires=["\'](https://m\.media-amazon\.com/images/I/.*?)["\']'])
        if high:
            image_urls.append(high)
    for match in re.finditer(r'"(?:hiRes|large)":"(https://m\.media-amazon\.com/images/I/[^"]+)"', html):
        image_urls.append(match.group(1))
    cleaned_urls = []
    for url in image_urls:
        url = html_lib.unescape(url.replace("\\u0026", "&").replace("\\/", "/"))
        if url not in cleaned_urls:
            cleaned_urls.append(url)
    if cleaned_urls:
        d["cover_url"] = cleaned_urls[0]
        d["image_urls"] = cleaned_urls[1:MAX_SAMPLE_IMAGES + 1]

    haystack = f"{d.get('title', '')} {d.get('description', '')}".lower()
    if "malbuch" in haystack or "ausmal" in haystack or "coloring book" in haystack:
        d["category"] = "malbuecher"
    elif "comic" in haystack:
        d["category"] = "komics"
    else:
        d["category"] = "geschichten"
    return d


def download_image(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("LIMIT")
    return data


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


def git_connection() -> tuple[bool, str]:
    """Prüft nicht nur Git, sondern die echte Verbindung dieses Projekts."""
    if not shutil.which("git"):
        return False, "Git ist auf diesem Computer nicht verfügbar."
    inside = git("rev-parse", "--is-inside-work-tree")
    if inside.returncode != 0 or inside.stdout.strip() != "true":
        return False, "Dieser Projektordner ist noch nicht mit GitHub verbunden."
    remote = git("remote", "get-url", "origin")
    if remote.returncode != 0 or not remote.stdout.strip():
        return False, "Für dieses Projekt ist kein GitHub-Ziel eingerichtet."
    return True, "Projekt ist mit GitHub verbunden"


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


def build_site(command="build", timeout=600):
    """Baut die lokale Website und gibt (ok, log) zurück."""
    with PREVIEW_BUILD_LOCK:
        proc = subprocess.run(
            ["cmd", "/c", "npm", "run", command],
            cwd=str(ROOT), capture_output=True, text=True, timeout=timeout,
        )
    return proc.returncode == 0, (proc.stdout + "\n" + proc.stderr).strip()[-4000:]


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
    git_ok, git_text = git_connection()
    checks.append(("gruen" if git_ok else "rot", git_text))
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

    def send_file(self, path: Path, ctype: str, no_cache=False):
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        if no_cache:
            self.send_header("Cache-Control", "no-store, max-age=0")
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
            # Beim Öffnen/Neuladen der Vorschau immer frisch bauen. Dadurch
            # können gespeicherte Bücher nicht mehr in einem alten dist/ hängen.
            rel = path[len("/vorschau"):].lstrip("/") or "index.html"
            dist = ROOT / "dist"
            if rel == "index.html":
                try:
                    ok, log = build_site()
                except Exception:
                    ok, log = False, "Lokale Vorschau konnte nicht gebaut werden."
                if not ok:
                    self.send_json({"ok": False, "error": "Lokale Vorschau konnte nicht aktualisiert werden.", "log": log}, 500)
                    return
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
            self.send_file(f, ct, no_cache=True)
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
            elif path == "/api/categories":
                self.api_categories()
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
                self.send_json({"ok": False, "error": "Datei ist zu groß (ein Bild max. 15 MB, PDF bzw. Bildauswahl zusammen max. 60 MB)."}, 413)
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
            info = parse_amazon(fetch_amazon_html(asin))
        except Exception:
            self.send_json({"ok": False, "error": "Amazon konnte die Produktseite gerade nicht freigeben. Bitte versuche es in einer Minute erneut oder fülle die Felder von Hand aus."})
            return
        image_urls = info.pop("image_urls", [])
        cover_url = info.pop("cover_url", "")
        if not info.get("title") and not info.get("description") and not cover_url:
            self.send_json({"ok": False, "error": "Auf der Amazon-Seite wurden keine Buchdaten gefunden. Bitte prüfe den Link oder versuche es später erneut."})
            return

        info["amazon"] = f"https://www.amazon.de/dp/{asin}"
        if cover_url:
            try:
                dest = IMAGES / f"cover-amazon-{asin}.jpg"
                save_image(download_image(cover_url), dest)
                info["cover"] = f"images/{dest.name}"
            except Exception:
                pass

        samples = []
        for index, image_url in enumerate(image_urls[:MAX_SAMPLE_IMAGES], 1):
            try:
                dest = IMAGES / f"sample-amazon-{asin}-{index}.jpg"
                save_image(download_image(image_url), dest, width=1200)
                samples.append(f"images/{dest.name}")
            except Exception:
                continue
        if samples:
            info["samples"] = samples

        imported = [key for key in ("title", "description", "age", "detail", "series", "category", "cover", "samples") if info.get(key)]
        info["imported"] = imported
        info["missing"] = [key for key in ("title", "description", "cover") if not info.get(key)]
        info["ok"] = True
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
        old_cover = book.get("cover", "")
        old_samples = list(book.get("samples", []))

        category = fields.get("category", "")
        valid_ids = [c["id"] for c in state.get("categories", [])] or ["malbuecher"]
        if category not in valid_ids:
            category = valid_ids[0]
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

        # Cover: hochgeladene Datei hat Vorrang, sonst Amazon-Cover, sonst
        # ausdrücklich entfernen oder altes behalten.
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
        elif fields.get("removeCover") == "1":
            book["cover"] = ""
        book.setdefault("cover", "")

        # PDF oder einzelne Bilder/Screenshots → Vorschauseiten
        sample_files = sorted(
            ((name, file_data) for name, file_data in files.items() if name.startswith("sample_")),
            key=lambda item: int(item[0].split("_", 1)[1]) if item[0].split("_", 1)[1].isdigit() else 999,
        )
        if len(sample_files) > MAX_SAMPLE_IMAGES:
            self.send_json({"ok": False, "error": f"Bitte höchstens {MAX_SAMPLE_IMAGES} Bilder auswählen."})
            return
        if sum(len(file_data[1]) for _, file_data in sample_files) > MAX_PDF_BYTES:
            self.send_json({"ok": False, "error": "Die ausgewählten Bilder sind zusammen größer als 60 MB."})
            return

        if sample_files:
            samples = []
            try:
                for index, (_, (_, data)) in enumerate(sample_files, 1):
                    if len(data) > MAX_IMAGE_BYTES:
                        raise ValueError("IMAGE_LIMIT")
                    dest = IMAGES / f"{book_id}-seite-{index}.jpg"
                    save_image(data, dest, width=1200)
                    samples.append(f"images/{dest.name}")
            except ValueError as exc:
                if str(exc) == "IMAGE_LIMIT":
                    self.send_json({"ok": False, "error": "Ein Vorschaubild ist größer als 15 MB."})
                else:
                    self.send_json({"ok": False, "error": "Ein Vorschaubild konnte nicht gelesen werden – bitte JPG, PNG oder WebP verwenden."})
                return
            except Exception:
                self.send_json({"ok": False, "error": "Ein Vorschaubild konnte nicht gelesen werden – bitte JPG, PNG oder WebP verwenden."})
                return
            book["samples"] = samples
        elif "pdf" in files:
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
        elif fields.get("amazonSamples", "").strip():
            try:
                amazon_samples = json.loads(fields["amazonSamples"])
            except json.JSONDecodeError:
                amazon_samples = []
            samples = []
            for index, item in enumerate(amazon_samples[:MAX_SAMPLE_IMAGES], 1):
                src = IMAGES / Path(str(item)).name
                if not src.is_file() or not src.name.startswith("sample-amazon-"):
                    continue
                dest = IMAGES / f"{book_id}-seite-{index}.jpg"
                if src.resolve() != dest.resolve():
                    dest.write_bytes(src.read_bytes())
                    src.unlink()
                samples.append(f"images/{dest.name}")
            if samples:
                book["samples"] = samples
        elif "keepSamples" in fields:
            try:
                requested_samples = json.loads(fields.get("keepSamples", "[]"))
            except json.JSONDecodeError:
                requested_samples = []
            allowed = set(old_samples)
            book["samples"] = [
                item for item in requested_samples
                if isinstance(item, str) and item in allowed and (IMAGES / Path(item).name).is_file()
            ][:MAX_SAMPLE_IMAGES]

        # Erst nach erfolgreicher Verarbeitung alte, jetzt nicht mehr verwendete
        # Dateien entfernen. So lassen sich Cover und einzelne Seiten sicher
        # löschen oder ersetzen, ohne bei einem Fehler Daten zu verlieren.
        new_media = {book.get("cover", ""), *book.get("samples", [])}
        for item in {old_cover, *old_samples} - new_media:
            name = Path(item).name
            managed = name == f"cover-{book_id}.jpg" or name.startswith(f"{book_id}-seite-")
            target = IMAGES / name
            if managed and name and target.is_file():
                target.unlink()

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
            if (n.startswith("cover-") or "-seite-" in n or n.startswith("sample-amazon-")) and n not in used and not n.startswith("cover-amazon-"):
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

    # ---------- Kategorien ----------
    def api_categories(self):
        """Kategorien hinzufügen/umbenennen/umfärben/löschen."""
        d = self.read_json()
        action = d.get("action")
        state = load_state()
        cats = state.setdefault("categories", [])
        if action == "add":
            label_de = (d.get("labelDe") or "").strip()
            if not label_de:
                self.send_json({"ok": False, "error": "Bitte einen Namen für die Kategorie eingeben."})
                return
            cid = slugify(d.get("id") or label_de)
            cid = re.sub(r"[^a-z0-9-]", "", cid)
            if not cid or any(c["id"] == cid for c in cats):
                self.send_json({"ok": False, "error": "Diese Kategorie existiert schon."})
                return
            color = (d.get("color") or "#1B3A5C").strip()
            if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
                color = "#1B3A5C"
            cats.append({
                "id": cid,
                "labelDe": label_de,
                "labelEn": (d.get("labelEn") or label_de).strip(),
                "typeDe": (d.get("typeDe") or label_de).strip(),
                "typeEn": (d.get("typeEn") or d.get("typeDe") or label_de).strip(),
                "color": color,
            })
        elif action == "delete":
            cid = d.get("id", "")
            if any(b.get("category") == cid for b in state["books"]):
                self.send_json({"ok": False, "error": "In dieser Kategorie gibt es noch Bücher. Bitte die Bücher zuerst einer anderen Kategorie zuordnen."})
                return
            if len(cats) <= 1:
                self.send_json({"ok": False, "error": "Es muss mindestens eine Kategorie geben."})
                return
            cats = [c for c in cats if c["id"] != cid]
            state["categories"] = cats
        else:
            self.send_json({"ok": False, "error": "Unbekannte Aktion."})
            return
        save_state(state)
        self.send_json({"ok": True, "categories": state["categories"]})

    # ---------- Git / GitHub ----------
    def api_git_status(self):
        """Echter Status aus Git: ungesicherte Änderungen + letzte Sicherung."""
        connected, error = git_connection()
        if not connected:
            self.send_json({"ok": False, "configured": False, "error": error})
            return
        fetched = git("fetch", "-q", "origin", timeout=60)
        if fetched.returncode != 0:
            self.send_json({"ok": False, "configured": True, "error": "GitHub konnte nicht erreicht werden. Lokale Änderungen bleiben erhalten."})
            return
        status_proc = git("status", "--porcelain")
        if status_proc.returncode != 0:
            self.send_json({"ok": False, "configured": True, "error": "Der lokale Änderungsstand konnte nicht gelesen werden."})
            return
        status = status_proc.stdout
        changed = len([l for l in status.splitlines() if l.strip()])
        ahead_proc = git("rev-list", "--count", "origin/main..HEAD")
        behind_proc = git("rev-list", "--count", "HEAD..origin/main")
        if ahead_proc.returncode != 0 or behind_proc.returncode != 0:
            self.send_json({"ok": False, "configured": True, "error": "Der Abgleich mit GitHub ist fehlgeschlagen."})
            return
        ahead = ahead_proc.stdout.strip()
        behind = behind_proc.stdout.strip()
        last = git("log", "origin/main", "-1", "--format=%ci").stdout.strip()
        self.send_json({
            "ok": True, "configured": True,
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
                "headSha": run.get("head_sha", ""),
                "createdAt": run.get("created_at", ""),
                "updatedAt": run.get("updated_at", ""),
                "url": run.get("html_url", f"https://github.com/{slug}/actions"),
            })
        except Exception:
            self.send_json({"ok": False, "error": "Status konnte nicht abgerufen werden.",
                            "url": f"https://github.com/{slug}/actions"})

    # ---------- Build & Veröffentlichen ----------
    def api_build(self):
        try:
            ok, log = build_site(timeout=300)
            self.send_json({"ok": ok, "log": log})
        except Exception:
            self.send_json({"ok": False, "log": "Build konnte nicht gestartet werden."})

    def api_publish(self):
        """Veröffentlichen = prüfen → committen → zu GitHub main pushen.
        GitHub Actions baut danach automatisch die Live-Seite."""
        state = load_state()

        connected, connection_error = git_connection()
        if not connected:
            self.send_json({"ok": False, "stage": "git", "error": connection_error + " Es wurde nichts zur Live-Seite übertragen."})
            return

        # 1. Pflichtdaten validieren (Pre-Publish-Ampel)
        checks = precheck(state)
        rot = [t for st, t in checks if st == "rot"]
        if rot:
            self.send_json({"ok": False, "stage": "checks",
                            "error": "Veröffentlichung nicht möglich – bitte zuerst die Pflichtangaben vervollständigen.",
                            "details": rot, "checks": checks})
            return

        # 2. Qualität prüfen (lint + Tests + Build)
        ok, check_log = build_site(command="check", timeout=600)
        if not ok:
            self.send_json({"ok": False, "stage": "build",
                            "error": "Veröffentlichung abgebrochen: Prüfung oder Bau der Seite ist fehlgeschlagen.",
                            "log": check_log, "checks": checks})
            return

        # 3. Remote-Konflikte erkennen – nichts blind überschreiben
        fetched = git("fetch", "-q", "origin", timeout=60)
        if fetched.returncode != 0:
            self.send_json({"ok": False, "stage": "git", "error": "GitHub konnte nicht erreicht werden. Es wurde nichts übertragen.", "checks": checks})
            return
        behind_proc = git("rev-list", "--count", "HEAD..origin/main")
        if behind_proc.returncode != 0:
            self.send_json({"ok": False, "stage": "git", "error": "Der Abgleich mit GitHub ist fehlgeschlagen. Es wurde nichts übertragen.", "checks": checks})
            return
        behind = behind_proc.stdout.strip()
        if behind not in ("", "0"):
            self.send_json({"ok": False, "stage": "git",
                            "error": "Auf GitHub befindet sich eine neuere Version. Bitte zuerst synchronisieren.",
                            "checks": checks})
            return

        # 4. Commit (nachvollziehbare Nachricht für die Versionshistorie)
        added = git("add", "-A")
        if added.returncode != 0:
            self.send_json({"ok": False, "stage": "git", "error": "Die lokalen Änderungen konnten nicht vorbereitet werden. Es wurde nichts übertragen.", "checks": checks})
            return
        status = git("status", "--porcelain")
        if status.returncode != 0:
            self.send_json({"ok": False, "stage": "git", "error": "Der lokale Änderungsstand konnte nicht gelesen werden. Es wurde nichts übertragen.", "checks": checks})
            return
        if not status.stdout.strip():
            self.send_json({"ok": True, "already": True, "checks": checks,
                            "message": "Keine neuen lokalen Änderungen. Du musst den Knopf nicht noch einmal drücken."})
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

        head = git("rev-parse", "HEAD").stdout.strip()
        self.send_json({"ok": True, "checks": checks, "commit": head,
                        "message": "Die Änderungen wurden vollständig zu GitHub übertragen. GitHub aktualisiert jetzt automatisch die Live-Seite. Du musst nicht erneut klicken.",
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
