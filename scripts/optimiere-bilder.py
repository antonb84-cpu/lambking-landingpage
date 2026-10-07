"""Erzeugt kleine, schnelle Bildvarianten für die Landingpage (Logo, Knöpfe, Maskottchen, Titelbild, Vorschaubild
für WhatsApp/Facebook) und die kleinen Vorderseiten aller Buch-Cover.

Aufruf (im Projektordner):  runtime\\python\\python.exe scripts\\optimiere-bilder.py
Die Originale bleiben unverändert; es werden nur neue Dateien daneben geschrieben.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "admin"))
IMG = ROOT / "public" / "images"


def webp(src: Path, dest: Path, width: int | None = None, quality: int = 82) -> None:
    with Image.open(src) as image:
        image = image.convert("RGBA") if "A" in image.getbands() or image.mode == "P" else image.convert("RGB")
        if width and image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        image.save(dest, "WEBP", quality=quality, method=6)
    print(f"  {dest.relative_to(ROOT)}  {dest.stat().st_size // 1024} KB (vorher {src.stat().st_size // 1024} KB)")


def main() -> None:
    print("Logo und Knöpfe")
    webp(IMG / "lambking-stories-logo-v2.png", IMG / "lambking-stories-logo-v2-256.webp", 256)
    with Image.open(IMG / "lambking-stories-logo-v2.png") as logo:
        icon = logo.convert("RGBA").resize((96, 96), Image.LANCZOS)
        icon.save(IMG / "logo-icon-96.png", optimize=True)
    for lang in ("de", "en"):
        webp(IMG / "buttons" / f"paypal-{lang}-trim.png", IMG / "buttons" / f"paypal-{lang}-trim.webp", 528)
    webp(IMG / "buttons" / "amazon.png", IMG / "buttons" / "amazon.webp", 610)
    webp(IMG / "lamm-freisteller.png", IMG / "lamm-freisteller.webp", 640)

    print("Titelbild (WebP neben den JPG)")
    for name in ("hero-titel-breit", "hero-titel", "hero-titel-mobil"):
        webp(IMG / f"{name}.jpg", IMG / f"{name}.webp", None, 80)

    print("Vorschaubild für WhatsApp, Facebook & Co. (1200 x 630)")
    make_og_image()

    print("Vorderseiten der Cover")
    import admin_server as a  # noqa: E402

    state = a.load_state()
    changed = a.extras.ensure_front_covers(state)
    a.save_state(state)
    print(f"  {changed} Vorderseite(n) neu erzeugt")


def make_og_image() -> None:
    """Querformat 1200x630 aus dem Titelbild (Bildausschnitt rechts), Logo klein unten links."""
    with Image.open(IMG / "hero-titel-breit.jpg") as hero:
        hero = hero.convert("RGB")
        ratio = 1200 / 630
        height = hero.height
        width = round(height * ratio)
        if width > hero.width:
            width = hero.width
            height = round(width / ratio)
        left = hero.width - width  # Motiv liegt rechts
        top = max(0, round((hero.height - height) * 0.35))
        crop = hero.crop((left, top, left + width, top + height)).resize((1200, 630), Image.LANCZOS)
    with Image.open(IMG / "lambking-stories-logo-v2.png") as logo:
        logo = logo.convert("RGBA").resize((200, 200), Image.LANCZOS)
    plate = Image.new("RGBA", (232, 232), (251, 247, 239, 235))
    base = crop.convert("RGBA")
    base.alpha_composite(plate, (28, 630 - 232 - 24))
    base.alpha_composite(logo, (44, 630 - 232 - 8))
    dest = IMG / "og-lambking.jpg"
    base.convert("RGB").save(dest, quality=84, optimize=True, progressive=True)
    print(f"  {dest.relative_to(ROOT)}  {dest.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
