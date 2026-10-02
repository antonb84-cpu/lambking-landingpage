"""Tests für die Zusatzfunktionen des Admin (admin/extras.py und die neuen Admin-Schnittstellen).

Aufruf (im Projektordner):  runtime\\python\\python.exe -m unittest scripts.test_admin_extras -v
Alle Tests laufen in einem temporären Ordner – die echten Buchdaten werden nie verändert.
"""

import io
import json
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.request
from http.server import HTTPServer
from pathlib import Path

REAL_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REAL_ROOT / "admin"))

import admin_server as server  # noqa: E402
import extras  # noqa: E402


def make_pdf(pages: int = 4) -> bytes:
    import pymupdf
    doc = pymupdf.open()
    for number in range(pages):
        page = doc.new_page(width=621, height=810)
        page.insert_text((72, 100), f"Seite {number + 1}", fontsize=30)
    data = doc.tobytes()
    doc.close()
    return data


def make_image(width: int, height: int, color=(200, 80, 80)) -> bytes:
    from PIL import Image
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, "JPEG")
    return buffer.getvalue()


class TempProject(unittest.TestCase):
    """Legt ein kleines Projekt in einem temporären Ordner an und biegt alle Pfade dorthin um."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        (self.tmp / "src" / "data").mkdir(parents=True)
        (self.tmp / "public" / "images").mkdir(parents=True)
        (self.tmp / "admin").mkdir()
        shutil.copy(REAL_ROOT / "src" / "data" / "books.json", self.tmp / "src" / "data" / "books.json")
        (self.tmp / "src" / "data" / "flipbooks.json").write_text("{}\n", encoding="utf-8")
        self.saved = (server.ROOT, server.IMAGES, server.DATA_JSON, server.BOOKS_TS, extras.ROOT)
        server.ROOT = self.tmp
        server.IMAGES = self.tmp / "public" / "images"
        server.DATA_JSON = self.tmp / "src" / "data" / "books.json"
        server.BOOKS_TS = self.tmp / "src" / "data" / "books.ts"
        extras.ROOT = self.tmp

    def tearDown(self):
        server.ROOT, server.IMAGES, server.DATA_JSON, server.BOOKS_TS, extras.ROOT = self.saved
        shutil.rmtree(self.tmp, ignore_errors=True)


class FlipbookTests(TempProject):
    def test_pdf_wird_zu_seitenbildern(self):
        entry = extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(5))
        self.assertEqual(entry["count"], 5)
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(sorted(p.name for p in folder.iterdir()), [f"p0{i}.jpg" for i in range(1, 6)])
        self.assertEqual(extras.load_flipbooks()["testbuch"]["de"]["count"], 5)

    def test_neue_pdf_ersetzt_alte_seiten(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(6))
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2))
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(sorted(p.name for p in folder.iterdir()), ["p01.jpg", "p02.jpg"])

    def test_kaputte_pdf_laesst_alten_stand_unveraendert(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(3))
        with self.assertRaises(extras.AdminError):
            extras.set_flipbook("testbuch", "de", pdf_bytes=b"%PDF-1.4 kaputt")
        self.assertEqual(extras.load_flipbooks()["testbuch"]["de"]["count"], 3)
        self.assertTrue((self.tmp / "public" / "images" / "buch-testbuch-de" / "p03.jpg").is_file())
        self.assertFalse(list((self.tmp / "public" / "images").glob(".neu-*")), "temporärer Ordner bleibt liegen")

    def test_keine_pdf_wird_abgelehnt(self):
        with self.assertRaises(extras.AdminError):
            extras.set_flipbook("testbuch", "de", pdf_bytes=b"keine pdf datei")

    def test_rueckseite_hochformat_ok_querformat_abgelehnt(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2))
        entry = extras.set_flipbook("testbuch", "de", back_bytes=make_image(900, 1200))
        self.assertTrue(entry["back"].endswith("rueckseite.jpg"))
        self.assertTrue((self.tmp / "public" / entry["back"]).is_file())
        with self.assertRaises(extras.AdminError):
            extras.set_flipbook("testbuch", "de", back_bytes=make_image(2000, 1000))

    def test_rueckseite_ohne_pdf_nicht_moeglich(self):
        with self.assertRaises(extras.AdminError):
            extras.set_flipbook("testbuch", "de", back_bytes=make_image(600, 800))

    def test_entfernen_loescht_nur_eigene_dateien(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2), back_bytes=make_image(600, 800))
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        (folder / "fremd.txt").write_text("nicht löschen", encoding="utf-8")
        extras.remove_flipbook("testbuch", "de")
        self.assertTrue((folder / "fremd.txt").is_file())
        self.assertFalse((folder / "p01.jpg").exists())
        self.assertNotIn("testbuch", extras.load_flipbooks())

    def test_ungueltige_ids_werden_abgelehnt(self):
        for bad_id, bad_lang in (("../x", "de"), ("Test Buch", "de"), ("testbuch", "../de"), ("testbuch", "d")):
            with self.assertRaises(extras.AdminError):
                extras.set_flipbook(bad_id, bad_lang, pdf_bytes=make_pdf(1))

    def test_vorschau_datei_nur_fuer_eigene_namen(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2))
        self.assertIsNotNone(extras.flipbook_file("testbuch", "de", "p01.jpg"))
        self.assertIsNone(extras.flipbook_file("testbuch", "de", "../../../books.json"))
        self.assertIsNone(extras.flipbook_file("testbuch", "de", "passwoerter.txt"))


class SafetyTests(unittest.TestCase):
    def test_nur_seitendateien_duerfen_hinaus(self):
        blocked = extras.classify_new_paths([
            ("src/data/books.json", 100),
            ("public/images/neu.jpg", 5_000_000),
            ("_Entwuerfe-und-Material/video/test.mp4", 1000),
            ("meine-notizen.docx", 10),
            ("README.md", 10),
            ("public/videos/riesig.mp4", 90 * 1024 * 1024),
        ])
        paths = {p for p, _ in blocked}
        self.assertEqual(paths, {"_Entwuerfe-und-Material/video/test.mp4", "meine-notizen.docx", "public/videos/riesig.mp4"})

    def test_aenderungen_werden_in_gruppen_zusammengefasst(self):
        groups = extras.summarize_changes([
            " M src/data/books.json", "?? public/images/a.jpg", "?? public/images/b.jpg",
            " M src/data/texts.defaults.json", " M src/sections/Hero.tsx", " M admin/index.html", "?? neu.txt",
        ])
        self.assertEqual(groups["books"], 1)
        self.assertEqual(groups["images"], 2)
        self.assertEqual(groups["texts"], 1)
        self.assertEqual(groups["design"], 1)
        self.assertEqual(groups["admin"], 1)
        self.assertEqual(groups["other"], 1)

    def test_oberste_ebene(self):
        self.assertEqual(extras.top_level_of("_Entwuerfe/video/a.mp4"), "_Entwuerfe/")
        self.assertEqual(extras.top_level_of("notiz.txt"), "notiz.txt")


class GitSafetyTests(unittest.TestCase):
    """Echtes Mini-Repository: Entwürfe werden beim Vorbereiten ausgeschlossen, Seitendateien nicht."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.saved = extras.ROOT
        extras.ROOT = self.tmp
        run = lambda *a: subprocess.run(["git", "-C", str(self.tmp), *a], check=True, capture_output=True)
        run("init", "-q")
        run("config", "user.email", "t@t")
        run("config", "user.name", "t")
        (self.tmp / "src").mkdir()
        (self.tmp / "src" / "a.txt").write_text("a", encoding="utf-8")
        run("add", "-A")
        run("commit", "-qm", "start")
        self.run = run

    def tearDown(self):
        extras.ROOT = self.saved
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_entwuerfe_werden_ausgeschlossen_seitendateien_bleiben(self):
        (self.tmp / "src" / "neu.txt").write_text("neu", encoding="utf-8")
        (self.tmp / "public" / "images").mkdir(parents=True)
        (self.tmp / "public" / "images" / "x.jpg").write_bytes(b"x")
        (self.tmp / "Entwuerfe").mkdir()
        (self.tmp / "Entwuerfe" / "bild.png").write_bytes(b"x")
        (self.tmp / "Entwuerfe" / "video.mp4").write_bytes(b"x")
        self.run("add", "-A")
        blocked = extras.classify_new_paths(extras.staged_new_files())
        targets = sorted({extras.top_level_of(p) for p, _ in blocked})
        self.assertEqual(targets, ["Entwuerfe/"])
        extras.exclude_locally(targets)
        staged = subprocess.run(["git", "-C", str(self.tmp), "diff", "--cached", "--name-only"], capture_output=True, text=True).stdout.split()
        self.assertEqual(sorted(staged), ["public/images/x.jpg", "src/neu.txt"])
        # und beim nächsten Mal bleibt der Ordner ausgeschlossen
        self.run("add", "-A")
        staged = subprocess.run(["git", "-C", str(self.tmp), "diff", "--cached", "--name-only"], capture_output=True, text=True).stdout.split()
        self.assertFalse(any(p.startswith("Entwuerfe/") for p in staged))
        self.assertTrue((self.tmp / "Entwuerfe" / "bild.png").is_file(), "Datei darf nicht gelöscht werden")


class BackupTests(TempProject):
    def test_sicherung_bei_aenderung_und_rotation(self):
        source = self.tmp / "src" / "data" / "books.json"
        first = extras.backup_state_file(source)
        self.assertIsNotNone(first)
        self.assertIsNone(extras.backup_state_file(source), "identischer Stand wird nicht doppelt gesichert")
        for number in range(extras.BACKUP_KEEP + 5):
            source.write_text(json.dumps({"books": [], "site": {}, "n": number}), encoding="utf-8")
            extras.backup_state_file(source)
        self.assertEqual(len(list(extras.backups_dir().glob("books-*.json"))), extras.BACKUP_KEEP)
        self.assertEqual(len(extras.list_backups()), extras.BACKUP_KEEP)

    def test_sicherung_nur_mit_gueltigem_namen(self):
        self.assertIsNone(extras.backup_file("../books.json"))
        self.assertIsNone(extras.backup_file("books-x.json"))


class LinkTests(unittest.TestCase):
    def test_links_nur_sichtbare_buecher(self):
        state = {
            "site": {"paypalUrl": "https://paypal.me/x", "kofiUrl": "", "supportedOrganizations": [{"name": "W", "url": "https://w.example/"}]},
            "books": [
                {"title": "Sichtbar", "editions": [{"language": "de", "amazon": "https://www.amazon.de/dp/A"}]},
                {"title": "Versteckt", "hidden": True, "editions": [{"language": "de", "amazon": "https://www.amazon.de/dp/B"}]},
            ],
        }
        urls = [item["url"] for item in extras.collect_links(state)]
        self.assertIn("https://www.amazon.de/dp/A", urls)
        self.assertNotIn("https://www.amazon.de/dp/B", urls)
        self.assertIn("https://paypal.me/x", urls)
        self.assertIn("https://w.example/", urls)


class ServerTests(TempProject):
    """Echte HTTP-Anfragen an einen Testserver mit temporären Daten."""

    def setUp(self):
        super().setUp()
        self.httpd = HTTPServer(("127.0.0.1", 0), server.Handler)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        super().tearDown()

    def post_json(self, path, obj):
        request = urllib.request.Request(f"http://127.0.0.1:{self.port}{path}", data=json.dumps(obj).encode(), headers={"Content-Type": "application/json"})
        return json.loads(urllib.request.urlopen(request).read())

    def post_multipart(self, path, fields, files):
        boundary = "----testgrenze"
        body = b""
        for key, value in fields.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        for key, (filename, data) in files.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"; filename="{filename}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + data + b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        request = urllib.request.Request(f"http://127.0.0.1:{self.port}{path}", data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        return json.loads(urllib.request.urlopen(request).read())

    def book_ids(self):
        return [b["id"] for b in json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"]]

    def test_blaetterbuch_hochladen_und_entfernen(self):
        book_id = self.book_ids()[0]
        result = self.post_multipart("/api/flipbook", {"id": book_id, "lang": "de"}, {"pdf": ("b.pdf", make_pdf(4)), "back": ("r.jpg", make_image(600, 800))})
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["flipbooks"][book_id]["de"]["count"], 4)
        self.assertIn("back", result["flipbooks"][book_id]["de"])
        bad = self.post_multipart("/api/flipbook", {"id": book_id, "lang": "de"}, {"pdf": ("b.pdf", b"kaputt")})
        self.assertFalse(bad["ok"])
        removed = self.post_json("/api/flipbook/delete", {"id": book_id, "lang": "de"})
        self.assertTrue(removed["ok"])
        self.assertNotIn(book_id, removed["flipbooks"])

    def test_titelseite_wird_der_sprache_zugeordnet(self):
        state = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))
        book = next(b for b in state["books"] if b["id"] == "david")
        result = self.post_multipart("/api/flipbook", {"id": "david", "lang": "fr"}, {"cover": ("c.jpg", make_image(2400, 1500))})
        self.assertTrue(result["ok"], result)
        book = next(b for b in result["books"] if b["id"] == "david")
        edition = next(e for e in book["editions"] if e["language"] == "fr")
        self.assertTrue(edition["coverSpread"])
        self.assertTrue((self.tmp / "public" / edition["cover"]).is_file())

    def test_ein_buch_fuer_blick_ins_buch(self):
        first, second = self.book_ids()[:2]
        self.post_json("/api/flipbook/featured", {"id": first})
        self.post_json("/api/flipbook/featured", {"id": second})
        books = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"]
        self.assertEqual([b["id"] for b in books if b.get("showInHero")], [second])

    def test_reihenfolge_per_liste(self):
        ids = [b["id"] for b in json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"] if b.get("lang", "de") == "de"]
        wanted = list(reversed(ids))
        self.assertTrue(self.post_json("/api/reorder", {"ids": wanted})["ok"])
        now = [b["id"] for b in json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"] if b.get("lang", "de") == "de"]
        self.assertEqual(now, wanted)
        self.assertFalse(self.post_json("/api/reorder", {"ids": ["gibtsnicht"]})["ok"])

    def test_sichtbarkeit_und_ausgabe_in_books_ts(self):
        state = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))
        visible = next(b["id"] for b in state["books"] if not b.get("hidden"))
        self.post_json("/api/visibility", {"id": visible, "hidden": True})
        self.assertNotIn(f"id: '{visible}'", server.BOOKS_TS.read_text(encoding="utf-8"))
        self.post_json("/api/visibility", {"id": visible, "hidden": False})
        self.assertIn(f"id: '{visible}'", server.BOOKS_TS.read_text(encoding="utf-8"))

    def test_sicherung_wiederherstellen(self):
        state = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))
        book_id = next(b["id"] for b in state["books"] if not b.get("hidden"))
        self.post_json("/api/visibility", {"id": book_id, "hidden": True})   # Sicherung des Ausgangsstands entsteht
        backups = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/backups").read())["backups"]
        self.assertTrue(backups)
        oldest = backups[-1]["name"]
        self.assertTrue(self.post_json("/api/backups/restore", {"name": oldest})["ok"])
        restored = next(b for b in json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"] if b["id"] == book_id)
        self.assertFalse(restored.get("hidden"))
        self.assertFalse(self.post_json("/api/backups/restore", {"name": "../../etc"})["ok"])

    def test_neues_buch_ist_zunaechst_ausgeblendet(self):
        result = self.post_multipart("/api/save", {"title": "Testbuch – Neu", "category": "malbuecher", "lang": "de", "editions": "[]"}, {})
        self.assertTrue(result.get("ok"), result)
        books = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"]
        new = next(b for b in books if b["title"].startswith("Testbuch"))
        self.assertTrue(new.get("hidden"))
        self.assertNotIn(f"id: '{new['id']}'", server.BOOKS_TS.read_text(encoding="utf-8"))
        self.post_multipart("/api/save", {"id": new["id"], "title": "Testbuch – Neu", "category": "malbuecher", "lang": "de", "editions": "[]", "visible": "1"}, {})
        new = next(b for b in json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"] if b["id"] == new["id"])
        self.assertFalse(new.get("hidden"))


if __name__ == "__main__":
    unittest.main()
