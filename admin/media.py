"""Medien und Seitenbereiche der Startseite (Titelbild, Kinder-Videos, Gratis-Ausmalbild, App-Screenshots).

Diese Inhalte lagen früher fest im Programmcode. Jetzt stehen sie in books.json (site.…), damit sie im
Admin geändert werden können. Fehlen die Felder (z. B. in einer alten Sicherung), gelten die Standardwerte
unten – die Landingpage sieht dann genauso aus wie vorher.
"""

from __future__ import annotations

import io
import re
from pathlib import Path

try:
    import extras
except ImportError:  # Import als Paket (Tests)
    from admin import extras

AdminError = extras.AdminError

SECTION_IDS = ("tryit", "kids", "freebie", "app", "supportedWorks")
SECTION_LABELS = {
    "tryit": "Blick ins Buch (Buch zum Durchblättern)",
    "kids": "So malen Kinder mit LambKing (Videos)",
    "freebie": "Gratis-Ausmalbild",
    "app": "App-Bereich (mit Screenshots)",
    "supportedWorks": "Gemeinsam bauen wir am Reich Gottes (unterstützte Werke)",
}
DEFAULT_KIDS_VIDEOS = [
    {"src": f"videos/kids/{name}.mp4", "poster": f"videos/kids/{name}.jpg"}
    for name in ("ausmalen-meer", "buch-durchblaettern", "ausmalen-schildkroete", "ausmalen-buntstifte")
]
DEFAULT_FREEBIE = {
    "pdf": "downloads/LambKing-Ausmalbild-Kinder-Wiese.pdf",
    "preview": "images/ausmalbild-wiese-vorschau.jpg",
}
DEFAULT_APP_SCREENS = [
    {"src": "images/app/00-willkommen.jpg",
     "de": {"title": "Willkommen", "text": "Kindergeschichten, die Glauben stärken und Gottes gute Botschaft lebendig machen."},
     "en": {"title": "Welcome", "text": "Children’s stories that strengthen faith and bring God’s good news to life."}},
    {"src": "images/app/01-start.jpg",
     "de": {"title": "Entdecken & weiterlesen", "text": "Neue Geschichten und dein Lesefortschritt auf einen Blick."},
     "en": {"title": "Discover & keep reading", "text": "New stories and your reading progress at a glance."}},
    {"src": "images/app/02-serien.jpg",
     "de": {"title": "Viele Serien", "text": "Liebevoll illustrierte Geschichten – für jedes Kind etwas dabei."},
     "en": {"title": "Many series", "text": "Lovingly illustrated stories – something for every child."}},
    {"src": "images/app/03-lina-und-ben.jpg",
     "de": {"title": "Bücher einer Serie", "text": "Jede Serie enthält mehrere Bücher zum Lesen und Anhören."},
     "en": {"title": "Books in a series", "text": "Every series has several books to read and listen to."}},
    {"src": "images/app/04-malen.jpg",
     "de": {"title": "Ausmalen", "text": "Ausmalbilder laden und direkt in der App bunt machen."},
     "en": {"title": "Coloring", "text": "Load coloring pages and color them right in the app."}},
    {"src": "images/app/05-mein-bereich.jpg",
     "de": {"title": "Mein Bereich", "text": "Merkliste und Einstellungen – alles bleibt nur auf deinem Gerät."},
     "en": {"title": "My area", "text": "Favorites and settings – everything stays on your device only."}},
]
DEFAULT_HERO = {
    "textTone": "dark",                      # Schrift auf dem Titelbild: dark (dunkel) oder light (weiß)
    "scrim": 80,                             # Stärke der Abdunklung/Aufhellung links hinter der Schrift (0–100)
    "focusDesktop": {"x": 50, "y": 35},      # Bildausschnitt am Computer (Prozent)
    "focusMobile": {"x": 70, "y": 50},       # Bildausschnitt am Handy (Prozent)
}
MAX_VIDEO_BYTES = 30 * 1024 * 1024
MAX_PDF_BYTES = 25 * 1024 * 1024
MAX_KIDS_VIDEOS = 12
MAX_APP_SCREENS = 12
MAX_IMAGE_PIXELS = 40_000_000


def root() -> Path:
    return extras.ROOT


def _percent(value, default: int) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if number != number:  # NaN
        return default
    return int(round(max(0, min(100, number))))


def hero_settings(site: dict) -> dict:
    """Einstellungen des Titelbilds (immer vollständig und im gültigen Bereich)."""
    raw = site.get("hero") if isinstance(site.get("hero"), dict) else {}
    d = DEFAULT_HERO
    desktop = raw.get("focusDesktop") if isinstance(raw.get("focusDesktop"), dict) else {}
    mobile = raw.get("focusMobile") if isinstance(raw.get("focusMobile"), dict) else {}
    return {
        "textTone": raw.get("textTone") if raw.get("textTone") in ("dark", "light") else d["textTone"],
        "scrim": _percent(raw.get("scrim"), d["scrim"]),
        "focusDesktop": {"x": _percent(desktop.get("x"), d["focusDesktop"]["x"]), "y": _percent(desktop.get("y"), d["focusDesktop"]["y"])},
        "focusMobile": {"x": _percent(mobile.get("x"), d["focusMobile"]["x"]), "y": _percent(mobile.get("y"), d["focusMobile"]["y"])},
    }


def set_hero_settings(state: dict, data: dict) -> dict:
    if not isinstance(data, dict):
        raise AdminError("Ungültige Einstellungen.")
    tone = data.get("textTone")
    if tone not in ("dark", "light"):
        raise AdminError("Bitte „dunkle“ oder „helle“ Schrift wählen.")
    state["site"]["hero"] = hero_settings({"hero": {
        "textTone": tone,
        "scrim": data.get("scrim"),
        "focusDesktop": {"x": data.get("focusDesktopX"), "y": data.get("focusDesktopY")},
        "focusMobile": {"x": data.get("focusMobileX"), "y": data.get("focusMobileY")},
    }})
    return state["site"]["hero"]


def hero_info() -> dict:
    """Pixelgrößen der aktuell veröffentlichten Titelbild-Dateien (für die Anzeige im Admin)."""
    from PIL import Image
    info = {}
    for name, _ in HERO_FILES:
        path = root() / "public" / "images" / name
        try:
            with Image.open(path) as image:
                info[name] = {"width": image.width, "height": image.height, "kb": path.stat().st_size // 1024}
        except Exception:
            info[name] = None
    return info


def site_media(site: dict) -> dict:
    """Aktuelle Medienlisten der Seite (mit Standardwerten für fehlende Felder)."""
    return {
        "hero": hero_settings(site),
        "kidsVideos": [dict(x) for x in (site.get("kidsVideos") or DEFAULT_KIDS_VIDEOS)],
        "freebie": dict(site.get("freebie") or DEFAULT_FREEBIE),
        "appScreens": [dict(x) for x in (site.get("appScreens") or DEFAULT_APP_SCREENS)],
        "hiddenSections": [s for s in site.get("hiddenSections", []) if s in SECTION_IDS],
    }


def _slug(text: str, fallback: str = "datei") -> str:
    lowered = (text or "").lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    base = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return (base or fallback)[:40]


def _unique_name(folder: Path, slug: str, suffixes: tuple) -> str:
    """Freier Dateiname (ohne Endung) in folder – hängt bei Bedarf -2, -3 … an."""
    candidate, number = slug, 2
    while any((folder / f"{candidate}{suffix}").exists() for suffix in suffixes):
        candidate = f"{slug}-{number}"
        number += 1
    return candidate


def _open_image(data: bytes, what: str):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    try:
        probe = Image.open(io.BytesIO(data))
        probe.verify()
        image = Image.open(io.BytesIO(data))
        if "A" in image.getbands():
            rgba = image.convert("RGBA")
            background = Image.new("RGB", rgba.size, "white")
            background.paste(rgba, mask=rgba.getchannel("A"))
            return background
        return image.convert("RGB")
    except Exception as exc:
        raise AdminError(f"{what} konnte nicht gelesen werden – bitte ein gültiges Bild (JPG, PNG oder WebP) hochladen.") from exc


def _save_jpg(image, dest: Path, width: int, quality: int = 86) -> None:
    from PIL import Image
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, quality=quality, optimize=True, progressive=True)


def _inside(path: Path, folder: Path) -> bool:
    try:
        path.resolve().relative_to(folder.resolve())
        return True
    except ValueError:
        return False


# --- Bereiche ein-/ausblenden
def set_hidden_sections(state: dict, ids) -> list:
    if not isinstance(ids, list):
        raise AdminError("Ungültige Auswahl.")
    clean = [i for i in SECTION_IDS if i in ids]
    state["site"]["hiddenSections"] = clean
    return clean


# --- Titelbild der Startseite
HERO_FILES = (("hero-titel-breit.jpg", 2560), ("hero-titel.jpg", 1600), ("hero-titel-mobil.jpg", 1000))
HERO_MIN_WIDTH = 1600
HERO_RATIO_RANGE = (1.5, 2.6)     # Breite : Höhe


def _make_og_image(hero, out_dir: Path) -> None:
    """Vorschaubild für WhatsApp, Facebook & Co. (1200 x 630): Ausschnitt des Titelbilds, Logo klein unten links."""
    from PIL import Image
    ratio = 1200 / 630
    height = hero.height
    width = round(height * ratio)
    if width > hero.width:
        width = hero.width
        height = round(width / ratio)
    left = hero.width - width  # das Motiv liegt rechts
    top = max(0, round((hero.height - height) * 0.35))
    base = hero.crop((left, top, left + width, top + height)).resize((1200, 630), Image.LANCZOS).convert("RGBA")
    logo_path = out_dir / "lambking-stories-logo-v2.png"
    if logo_path.is_file():
        with Image.open(logo_path) as logo:
            logo = logo.convert("RGBA").resize((200, 200), Image.LANCZOS)
        base.alpha_composite(Image.new("RGBA", (232, 232), (251, 247, 239, 235)), (28, 630 - 232 - 24))
        base.alpha_composite(logo, (44, 630 - 232 - 8))
    base.convert("RGB").save(out_dir / "og-lambking.jpg", quality=84, optimize=True, progressive=True)


def save_hero_image(data: bytes) -> None:
    image = _open_image(data, "Das Titelbild")
    if image.width < HERO_MIN_WIDTH:
        raise AdminError(f"Das Titelbild ist zu klein ({image.width} Pixel breit). Es muss mindestens {HERO_MIN_WIDTH} Pixel breit sein, empfohlen sind 2560 × 1440.")
    ratio = image.width / image.height
    if not HERO_RATIO_RANGE[0] <= ratio <= HERO_RATIO_RANGE[1]:
        raise AdminError(f"Das Format passt nicht ({image.width} × {image.height}). Bitte ein Querformat zwischen 3:2 und 2,6:1 verwenden, am besten 16:9 (2560 × 1440).")
    from PIL import Image
    out_dir = root() / "public" / "images"
    written = []  # (temporär, endgültig)
    try:
        for name, width in HERO_FILES:
            resized = image if image.width <= width else image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
            stem = name[:-4]
            tmp_jpg, tmp_webp = out_dir / f".neu-{stem}.jpg", out_dir / f".neu-{stem}.webp"
            resized.save(tmp_jpg, quality=88 if width > 1000 else 86, optimize=True, progressive=True)
            resized.save(tmp_webp, "WEBP", quality=80, method=6)
            written += [(tmp_jpg, out_dir / name), (tmp_webp, out_dir / f"{stem}.webp")]
        _make_og_image(image, out_dir.parent / "images")  # überschreibt nur das Vorschaubild
        for tmp, final in written:  # erst wenn alles fertig ist, ersetzen
            tmp.replace(final)
    finally:
        for tmp, _ in written:
            tmp.unlink(missing_ok=True)


# --- Kinder-Videos
def kids_add(state: dict, video: bytes, poster: bytes, title_hint: str = "") -> dict:
    media = site_media(state["site"])
    if len(media["kidsVideos"]) >= MAX_KIDS_VIDEOS:
        raise AdminError(f"Es sind höchstens {MAX_KIDS_VIDEOS} Videos möglich.")
    if len(video) > MAX_VIDEO_BYTES:
        raise AdminError("Das Video ist größer als 30 MB. Bitte vorher verkleinern (z. B. 720p, kurze Länge).")
    if video[4:8] != b"ftyp":
        raise AdminError("Das Video muss eine MP4-Datei sein.")
    image = _open_image(poster, "Das Standbild")
    folder = root() / "public" / "videos" / "kids"
    folder.mkdir(parents=True, exist_ok=True)
    name = _unique_name(folder, _slug(title_hint, "video"), (".mp4", ".jpg"))
    (folder / f"{name}.mp4").write_bytes(video)
    _save_jpg(image, folder / f"{name}.jpg", 640)
    item = {"src": f"videos/kids/{name}.mp4", "poster": f"videos/kids/{name}.jpg"}
    media["kidsVideos"].append(item)
    state["site"]["kidsVideos"] = media["kidsVideos"]
    return item


def _remove_unreferenced(rel_paths: list, referenced: set, folder: Path) -> None:
    for rel in rel_paths:
        if rel and rel not in referenced:
            path = root() / "public" / rel
            if path.is_file() and _inside(path, folder):
                path.unlink()


def kids_remove(state: dict, index: int) -> None:
    items = site_media(state["site"])["kidsVideos"]
    if not 0 <= index < len(items):
        raise AdminError("Video nicht gefunden.")
    removed = items.pop(index)
    state["site"]["kidsVideos"] = items
    referenced = {x for item in items for x in (item["src"], item["poster"])}
    _remove_unreferenced([removed["src"], removed["poster"]], referenced, root() / "public" / "videos" / "kids")


def move_item(state: dict, key: str, index: int, direction: int) -> None:
    """Verschiebt einen Eintrag einer Liste (kidsVideos / appScreens) um eine Stelle."""
    if key not in ("kidsVideos", "appScreens"):
        raise AdminError("Unbekannte Liste.")
    items = site_media(state["site"])[key]
    target = index + (1 if direction > 0 else -1)
    if not (0 <= index < len(items) and 0 <= target < len(items)):
        raise AdminError("Verschieben nicht möglich.")
    items[index], items[target] = items[target], items[index]
    state["site"][key] = items


# --- Gratis-Ausmalbild
def freebie_set(state: dict, pdf: bytes, name_hint: str = "") -> dict:
    if len(pdf) > MAX_PDF_BYTES:
        raise AdminError("Die PDF-Datei ist größer als 25 MB.")
    if not pdf.lstrip()[:5].startswith(b"%PDF"):
        raise AdminError("Das ist keine PDF-Datei.")
    try:
        import pymupdf as fitz
    except ImportError:  # pragma: no cover
        import fitz  # type: ignore
    try:
        doc = fitz.open(stream=pdf, filetype="pdf")
        page = doc[0]
        zoom = 520 / page.rect.width
        pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        preview_bytes = pixmap.tobytes("jpg", jpg_quality=82)
        doc.close()
    except Exception as exc:
        raise AdminError("Die PDF-Datei konnte nicht gelesen werden.") from exc
    downloads = root() / "public" / "downloads"
    images = root() / "public" / "images"
    downloads.mkdir(parents=True, exist_ok=True)
    slug = _unique_name(downloads, _slug(Path(name_hint).stem, "ausmalbild"), (".pdf",))
    (downloads / f"{slug}.pdf").write_bytes(pdf)
    (images / f"ausmalbild-{slug}-vorschau.jpg").write_bytes(preview_bytes)
    old = site_media(state["site"])["freebie"]
    new = {"pdf": f"downloads/{slug}.pdf", "preview": f"images/ausmalbild-{slug}-vorschau.jpg"}
    state["site"]["freebie"] = new
    # alte Dateien nur entfernen, wenn sie in den eigenen Ordnern liegen und nicht die neuen sind
    for rel, folder in ((old["pdf"], downloads), (old["preview"], images)):
        path = root() / "public" / rel
        if rel not in new.values() and path.is_file() and _inside(path, folder):
            path.unlink()
    return new


# --- App-Screenshots
def _clean_caption(value) -> dict:
    value = value if isinstance(value, dict) else {}
    return {"title": str(value.get("title", "")).strip()[:80], "text": str(value.get("text", "")).strip()[:200]}


def appscreen_add(state: dict, image: bytes, captions: dict, name_hint: str = "") -> dict:
    items = site_media(state["site"])["appScreens"]
    if len(items) >= MAX_APP_SCREENS:
        raise AdminError(f"Es sind höchstens {MAX_APP_SCREENS} Screenshots möglich.")
    picture = _open_image(image, "Der Screenshot")
    folder = root() / "public" / "images" / "app"
    name = _unique_name(folder, _slug(name_hint, "screen"), (".jpg",)) if folder.exists() else _slug(name_hint, "screen")
    _save_jpg(picture, folder / f"{name}.jpg", 600)
    item = {"src": f"images/app/{name}.jpg", "de": _clean_caption(captions.get("de")), "en": _clean_caption(captions.get("en"))}
    if not item["de"]["title"]:
        item["de"]["title"] = "App"
    if not item["en"]["title"]:
        item["en"]["title"] = item["de"]["title"]
    items.append(item)
    state["site"]["appScreens"] = items
    return item


def appscreen_update(state: dict, index: int, captions: dict) -> None:
    items = site_media(state["site"])["appScreens"]
    if not 0 <= index < len(items):
        raise AdminError("Screenshot nicht gefunden.")
    for lang in ("de", "en"):
        cleaned = _clean_caption(captions.get(lang))
        if cleaned["title"]:
            items[index][lang] = cleaned
    state["site"]["appScreens"] = items


def appscreen_remove(state: dict, index: int) -> None:
    items = site_media(state["site"])["appScreens"]
    if len(items) <= 1:
        raise AdminError("Mindestens ein Screenshot muss bleiben. Zum Ausblenden den App-Bereich ausschalten.")
    if not 0 <= index < len(items):
        raise AdminError("Screenshot nicht gefunden.")
    removed = items.pop(index)
    state["site"]["appScreens"] = items
    _remove_unreferenced([removed["src"]], {item["src"] for item in items}, root() / "public" / "images" / "app")
