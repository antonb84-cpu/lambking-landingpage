"""Zusatzfunktionen des Admin-Programms (bewusst getrennt vom großen admin_server.py):

* Blätterbuch („Blick ins Buch"): Buch-PDF in Seitenbilder umwandeln, Rückseite, Verwaltung
* Schutz beim Veröffentlichen: nur Dateien übertragen, die zur Landingpage gehören
* Link-Prüfung (tote Links vor dem Veröffentlichen finden)
* Automatische Sicherungen der Buchdaten

Alle Funktionen sind so geschrieben, dass sie ohne laufenden Server getestet werden können
(scripts/test_admin_extras.py).
"""

from __future__ import annotations

import datetime
import io
import json
import re
import shutil
import subprocess
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

BOOK_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,80}$")
LANG_RE = re.compile(r"^[a-z]{2,3}$")
PAGE_FILE_RE = re.compile(r"^p\d{2,3}\.jpg$")
FLIP_PAGE_WIDTH = 640           # Breite einer Buchseite im Blätterbuch (Pixel)
FLIP_MAX_PAGES = 300
FLIP_BACK_NAME = "rueckseite.jpg"


class AdminError(Exception):
    """Fehler mit einer Meldung, die direkt dem Nutzer angezeigt werden darf."""


def _flipbooks_json() -> Path:
    return ROOT / "src" / "data" / "flipbooks.json"


def _images_dir() -> Path:
    return ROOT / "public" / "images"


# ───────────────────────────── Blätterbuch ─────────────────────────────

def load_flipbooks() -> dict:
    path = _flipbooks_json()
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_flipbooks(data: dict) -> None:
    _flipbooks_json().write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def flipbook_rel_dir(book_id: str, lang: str) -> str:
    return f"images/buch-{book_id}-{lang}"


def _check_ids(book_id: str, lang: str) -> None:
    if not BOOK_ID_RE.fullmatch(book_id or ""):
        raise AdminError("Ungültige Buch-ID.")
    if not LANG_RE.fullmatch(lang or ""):
        raise AdminError("Ungültiger Sprachcode.")


def render_pdf_pages(pdf_bytes: bytes, out_dir: Path) -> int:
    """Rendert jede PDF-Seite als p01.jpg, p02.jpg … in out_dir. Gibt die Seitenzahl zurück."""
    try:
        import pymupdf as fitz  # neuere Paketbezeichnung
    except ImportError:  # pragma: no cover - ältere Installationen
        import fitz  # type: ignore
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise AdminError("Die PDF-Datei konnte nicht gelesen werden.") from exc
    try:
        count = doc.page_count
        if count < 1:
            raise AdminError("Die PDF-Datei enthält keine Seiten.")
        if count > FLIP_MAX_PAGES:
            raise AdminError(f"Die PDF-Datei hat {count} Seiten – erlaubt sind höchstens {FLIP_MAX_PAGES}.")
        out_dir.mkdir(parents=True, exist_ok=True)
        for index in range(count):
            page = doc[index]
            zoom = FLIP_PAGE_WIDTH / page.rect.width
            pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
            pixmap.save(str(out_dir / f"p{index + 1:02d}.jpg"), jpg_quality=72)
        return count
    finally:
        doc.close()


def _save_back_cover(data: bytes, dest: Path) -> None:
    from PIL import Image
    try:
        image = Image.open(io.BytesIO(data))
        image.verify()
        image = Image.open(io.BytesIO(data))
    except Exception as exc:
        raise AdminError("Die Rückseite konnte nicht gelesen werden – bitte ein gültiges Bild (JPG/PNG/WebP) hochladen.") from exc
    if image.width > image.height * 1.15:
        raise AdminError("Die Rückseite muss ein Hochformat-Bild sein. Bitte nur die Rückseite hochladen, nicht den ganzen Umschlag.")
    image = image.convert("RGB")
    if image.width > FLIP_PAGE_WIDTH:
        ratio = FLIP_PAGE_WIDTH / image.width
        image = image.resize((FLIP_PAGE_WIDTH, round(image.height * ratio)), Image.LANCZOS)
    image.save(dest, quality=80, optimize=True, progressive=True)


def set_flipbook(book_id: str, lang: str, pdf_bytes: bytes | None = None, back_bytes: bytes | None = None) -> dict:
    """Legt das Blätterbuch eines Buches in einer Sprache an oder aktualisiert es.

    * pdf_bytes  – komplette Innen-PDF → alle Seiten werden neu erzeugt (alte Seiten ersetzt)
    * back_bytes – Rückseite als Bild
    Ein Fehler lässt den bisherigen Stand unverändert.
    """
    _check_ids(book_id, lang)
    if not pdf_bytes and not back_bytes:
        raise AdminError("Bitte eine PDF-Datei oder eine Rückseite auswählen.")
    manifest = load_flipbooks()
    entry = dict(manifest.get(book_id, {}).get(lang) or {})
    if not entry and not pdf_bytes:
        raise AdminError("Für diese Sprache gibt es noch kein Blätterbuch. Bitte zuerst die komplette PDF hochladen.")
    rel_dir = flipbook_rel_dir(book_id, lang)
    final_dir = ROOT / "public" / rel_dir

    if pdf_bytes:
        if not pdf_bytes.lstrip()[:5].startswith(b"%PDF"):
            raise AdminError("Das ist keine PDF-Datei.")
        tmp_dir = ROOT / "public" / "images" / f".neu-{book_id}-{lang}"
        if tmp_dir.exists():
            shutil.rmtree(tmp_dir)
        try:
            count = render_pdf_pages(pdf_bytes, tmp_dir)
            final_dir.mkdir(parents=True, exist_ok=True)
            for old in final_dir.iterdir():  # nur eigene Seitenbilder entfernen
                if old.is_file() and PAGE_FILE_RE.fullmatch(old.name):
                    old.unlink()
            for new in sorted(tmp_dir.iterdir()):
                shutil.move(str(new), str(final_dir / new.name))
        finally:
            if tmp_dir.exists():
                shutil.rmtree(tmp_dir, ignore_errors=True)
        entry["dir"] = rel_dir
        entry["count"] = count

    if back_bytes:
        final_dir.mkdir(parents=True, exist_ok=True)
        _save_back_cover(back_bytes, final_dir / FLIP_BACK_NAME)
        entry["back"] = f"{rel_dir}/{FLIP_BACK_NAME}"

    manifest.setdefault(book_id, {})[lang] = entry
    save_flipbooks(manifest)
    return entry


def remove_flipbook(book_id: str, lang: str) -> None:
    """Entfernt ein Blätterbuch (Eintrag und die eigenen Seitenbilder)."""
    _check_ids(book_id, lang)
    manifest = load_flipbooks()
    if lang not in manifest.get(book_id, {}):
        raise AdminError("Für diese Sprache gibt es kein Blätterbuch.")
    final_dir = ROOT / "public" / flipbook_rel_dir(book_id, lang)
    if final_dir.is_dir():
        for item in final_dir.iterdir():
            if item.is_file() and (PAGE_FILE_RE.fullmatch(item.name) or item.name == FLIP_BACK_NAME):
                item.unlink()
        try:
            final_dir.rmdir()
        except OSError:
            pass  # enthält fremde Dateien – nicht anfassen
    del manifest[book_id][lang]
    if not manifest[book_id]:
        del manifest[book_id]
    save_flipbooks(manifest)


def remove_flipbook_back(book_id: str, lang: str) -> None:
    _check_ids(book_id, lang)
    manifest = load_flipbooks()
    entry = manifest.get(book_id, {}).get(lang)
    if not entry or "back" not in entry:
        raise AdminError("Es ist keine Rückseite hinterlegt.")
    path = ROOT / "public" / entry["back"]
    if path.is_file() and path.name == FLIP_BACK_NAME:
        path.unlink()
    del entry["back"]
    save_flipbooks(manifest)


def flipbook_file(book_id: str, lang: str, name: str) -> Path | None:
    """Pfad einer Seiten-/Rückseitendatei für die Admin-Vorschau (nur eigene Dateien)."""
    if not (BOOK_ID_RE.fullmatch(book_id or "") and LANG_RE.fullmatch(lang or "")):
        return None
    if not (PAGE_FILE_RE.fullmatch(name or "") or name == FLIP_BACK_NAME):
        return None
    path = ROOT / "public" / flipbook_rel_dir(book_id, lang) / name
    return path if path.is_file() else None


# ─────────────────────── Schutz beim Veröffentlichen ───────────────────────

ALLOWED_PREFIXES = ("src/", "public/", "admin/", "scripts/", "analytics-worker/", ".github/")
ALLOWED_ROOT_FILE_RE = re.compile(r"^(?:\.gitignore|\.gitattributes|[A-Za-z0-9._-]+\.(?:json|ts|js|mjs|cjs|html|md|txt|bat|ico|yml|yaml|toml|py))$")
MAX_PUBLISH_FILE_BYTES = 40 * 1024 * 1024


def classify_new_paths(paths: list[tuple[str, int]]) -> list[tuple[str, str]]:
    """Prüft neu hinzugefügte Dateien (Pfad, Größe). Gibt [(Pfad, Grund)] für Dateien zurück,
    die NICHT auf die Live-Seite gehören."""
    blocked: list[tuple[str, str]] = []
    for path, size in paths:
        norm = path.replace("\\", "/")
        top_ok = norm.startswith(ALLOWED_PREFIXES) or ("/" not in norm and ALLOWED_ROOT_FILE_RE.fullmatch(norm))
        if not top_ok:
            blocked.append((norm, "liegt außerhalb der Seiten-Ordner"))
        elif size > MAX_PUBLISH_FILE_BYTES:
            blocked.append((norm, f"ist mit {size // (1024 * 1024)} MB zu groß"))
    return blocked


def top_level_of(path: str) -> str:
    """Oberste Ordner-/Dateiebene eines Pfades (zum Zusammenfassen in Meldungen)."""
    norm = path.replace("\\", "/")
    return norm.split("/", 1)[0] + ("/" if "/" in norm else "")


def summarize_changes(porcelain_lines: list[str]) -> dict:
    """Fasst `git status --porcelain` in verständliche Gruppen zusammen."""
    groups = {"books": 0, "texts": 0, "images": 0, "videos": 0, "downloads": 0, "design": 0, "admin": 0, "other": 0}
    for line in porcelain_lines:
        if len(line) < 4:
            continue
        path = line[3:].strip().strip('"').replace("\\", "/")
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if path.startswith(("src/data/books.", "src/data/flipbooks")):
            groups["books"] += 1
        elif path.startswith("src/data/texts"):
            groups["texts"] += 1
        elif path.startswith("public/images"):
            groups["images"] += 1
        elif path.startswith("public/videos"):
            groups["videos"] += 1
        elif path.startswith(("public/downloads", "public/flyers")):
            groups["downloads"] += 1
        elif path.startswith(("src/", "public/", "scripts/", "index.html")):
            groups["design"] += 1
        elif path.startswith("admin/"):
            groups["admin"] += 1
        else:
            groups["other"] += 1
    return groups


# ───────────────────────────── Link-Prüfung ─────────────────────────────

def _probe(url: str, timeout: int) -> tuple[str, int]:
    """Gibt (status, code) zurück: ok | broken | unsure."""
    headers = {"User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "de,en;q=0.8"}
    last_code = 0
    for method in ("HEAD", "GET"):
        try:
            request = urllib.request.Request(url, headers=headers, method=method)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                code = response.status
                if 200 <= code < 400:
                    return "ok", code
                last_code = code
        except urllib.error.HTTPError as exc:
            last_code = exc.code
            if exc.code in (404, 410) and method == "GET":
                return "broken", exc.code
            if exc.code in (404, 410):
                continue  # manche Server mögen HEAD nicht – mit GET gegenprüfen
        except Exception:
            last_code = 0
    return ("unsure", last_code)


def check_links(items: list[dict], timeout: int = 10) -> list[dict]:
    """items: [{url, label}] → Ergebnis mit status ok/broken/unsure. Doppelte URLs werden nur einmal geprüft."""
    unique: dict[str, tuple[str, int]] = {}
    urls = sorted({item["url"] for item in items if item.get("url", "").startswith("https://")})
    with ThreadPoolExecutor(max_workers=8) as pool:
        for url, result in zip(urls, pool.map(lambda u: _probe(u, timeout), urls)):
            unique[url] = result
    out = []
    for item in items:
        url = item.get("url", "")
        status, code = unique.get(url, ("unsure", 0))
        out.append({"url": url, "label": item.get("label", url), "status": status, "code": code})
    return out


def collect_links(state: dict) -> list[dict]:
    """Alle externen Links, die auf der Live-Seite vorkommen (nur sichtbare Bücher)."""
    items: list[dict] = []
    site = state.get("site", {})
    for key, label in (("paypalUrl", "PayPal"), ("kofiUrl", "Ko-fi"), ("playStoreUrl", "Google Play"), ("iosStoreUrl", "App Store")):
        if site.get(key, "").startswith("https://"):
            items.append({"url": site[key], "label": label})
    for org in site.get("supportedOrganizations", []):
        if str(org.get("url", "")).startswith("https://"):
            items.append({"url": org["url"], "label": f"Werk: {org.get('name', 'Einrichtung')}"})
    for book in state.get("books", []):
        if book.get("hidden"):
            continue
        for edition in book.get("editions", []) or []:
            if str(edition.get("amazon", "")).startswith("https://"):
                items.append({"url": edition["amazon"], "label": f"Amazon: {book.get('title', '')[:50]} ({edition.get('language', '').upper()})"})
    return items


# ───────────────────────────── Sicherungen ─────────────────────────────

BACKUP_KEEP = 40


def backups_dir() -> Path:
    return ROOT / "admin" / "backups"


def backup_state_file(source: Path) -> Path | None:
    """Kopiert die Buchdaten vor dem Überschreiben. Identische Stände werden nicht doppelt gesichert."""
    if not source.is_file():
        return None
    target_dir = backups_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(target_dir.glob("books-*.json"))
    data = source.read_bytes()
    if existing and existing[-1].read_bytes() == data:
        return None
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    target = target_dir / f"books-{stamp}.json"
    target.write_bytes(data)
    existing = sorted(target_dir.glob("books-*.json"))
    for old in existing[:-BACKUP_KEEP]:
        old.unlink(missing_ok=True)
    return target


def list_backups() -> list[dict]:
    items = []
    for path in sorted(backups_dir().glob("books-*.json"), reverse=True):
        match = re.fullmatch(r"books-(\d{8})-(\d{6})-\d+\.json", path.name)
        if not match:
            continue
        stamp = datetime.datetime.strptime(match.group(1) + match.group(2), "%Y%m%d%H%M%S")
        try:
            count = len(json.loads(path.read_text(encoding="utf-8")).get("books", []))
        except Exception:
            count = 0
        items.append({"name": path.name, "when": stamp.strftime("%d.%m.%Y %H:%M:%S"), "books": count})
    return items


def backup_file(name: str) -> Path | None:
    if not re.fullmatch(r"books-\d{8}-\d{6}-\d+\.json", name or ""):
        return None
    path = backups_dir() / name
    return path if path.is_file() else None


# ───────────────────────────── Git-Hilfen ─────────────────────────────

def git_run(*args: str, timeout: int = 180) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True, timeout=timeout)


def staged_new_files() -> list[tuple[str, int]]:
    """Neu hinzugefügte (noch nie committete) Dateien im Staging-Bereich mit Dateigröße."""
    proc = git_run("diff", "--cached", "--name-status", "--diff-filter=A", "-z")
    if proc.returncode != 0:
        raise AdminError("Der Änderungsstand konnte nicht gelesen werden.")
    parts = [p for p in proc.stdout.split("\0") if p]
    files = []
    for index in range(0, len(parts) - 1, 2):
        path = parts[index + 1]
        full = ROOT / path
        files.append((path, full.stat().st_size if full.is_file() else 0))
    return files


def exclude_locally(paths: list[str]) -> None:
    """Nimmt Pfade aus dem Staging und trägt sie in die lokale Ausschlussliste (.git/info/exclude) ein,
    damit sie nie versehentlich veröffentlicht werden. Die Dateien selbst bleiben unangetastet."""
    if not paths:
        return
    git_run("reset", "-q", "--", *paths)
    exclude_file = Path(git_run("rev-parse", "--git-path", "info/exclude").stdout.strip())
    if not exclude_file.is_absolute():
        exclude_file = ROOT / exclude_file
    exclude_file.parent.mkdir(parents=True, exist_ok=True)
    existing = exclude_file.read_text(encoding="utf-8") if exclude_file.is_file() else ""
    lines = set(existing.splitlines())
    additions = [f"/{p}" for p in paths if f"/{p}" not in lines]
    if additions:
        with exclude_file.open("a", encoding="utf-8") as handle:
            if existing and not existing.endswith("\n"):
                handle.write("\n")
            handle.write("\n".join(additions) + "\n")


# ───────────────────────── Texte: nur Abweichungen speichern ─────────────────────────

def prune_text_overrides(overrides, defaults):
    """Entfernt alle Texte, die dem Standardtext entsprechen (rekursiv). Übrig bleiben nur echte Änderungen.
    Listen werden als Ganzes verglichen (ersetzt wird immer die komplette Liste)."""
    if not isinstance(overrides, dict):
        return overrides
    result = {}
    for key, value in overrides.items():
        default = defaults.get(key) if isinstance(defaults, dict) else None
        if isinstance(value, dict):
            pruned = prune_text_overrides(value, default if isinstance(default, dict) else {})
            if pruned:
                result[key] = pruned
        elif default is None or value != default:
            result[key] = value
    return result
