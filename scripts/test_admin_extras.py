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
import urllib.error
import urllib.request
from http.server import HTTPServer
from pathlib import Path

REAL_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REAL_ROOT / "admin"))

import admin_server as server  # noqa: E402
import extras  # noqa: E402
import media  # noqa: E402


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
        entry = extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(5), limit=99)
        self.assertEqual(entry["count"], 5)
        self.assertEqual(entry["total"], 5)
        self.assertEqual(entry["ext"], "webp")
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(sorted(p.name for p in folder.iterdir()), [f"p0{i}.webp" for i in range(1, 6)])
        self.assertEqual(extras.load_flipbooks()["testbuch"]["de"]["count"], 5)

    def test_nur_ein_teil_des_buches_wird_gespeichert(self):
        entry = extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(10))
        self.assertEqual(entry["total"], 10)
        self.assertEqual(entry["count"], extras.default_preview_limit(10))
        self.assertLess(entry["count"], 10, "die Leseprobe darf nicht das ganze Buch enthalten")
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(len(list(folder.glob("p*.webp"))), entry["count"])
        self.assertFalse((folder / f"p{entry['count'] + 1:02d}.webp").exists())

    def test_eigene_seitenzahl_und_kuerzen(self):
        entry = extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(10), limit=6)
        self.assertEqual((entry["count"], entry["total"]), (6, 10))
        entry = extras.shrink_flipbook("testbuch", "de", 3)
        self.assertEqual((entry["count"], entry["total"]), (3, 10))
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(sorted(p.name for p in folder.glob("p*.webp")), ["p01.webp", "p02.webp", "p03.webp"])
        with self.assertRaises(extras.AdminError):
            extras.shrink_flipbook("testbuch", "de", 5)  # mehr geht nur mit erneutem Upload
        with self.assertRaises(extras.AdminError):
            extras.shrink_flipbook("testbuch", "de", 0)

    def test_vorabpruefung_kennt_webp_seiten_und_warnt_vor_ganzem_buch(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(12))
        checks = server.precheck_flipbook({"books": []}, [])
        self.assertFalse([c for c in checks if c[0] == "rot"], checks)
        self.assertFalse([c for c in checks if "ganze Buch" in c[1]], checks)
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(12), limit=12)
        checks = server.precheck_flipbook({"books": []}, [])
        self.assertTrue([c for c in checks if c[0] == "gelb" and "ganze Buch" in c[1]], checks)

    def test_quadratisches_bilderbuch_merkt_seitenverhaeltnis_und_ueberspringt_titelseite(self):
        import pymupdf
        doc = pymupdf.open()
        for number in range(12):
            doc.new_page(width=842, height=842).insert_text((72, 100), f"Seite {number}", fontsize=30)
        data = doc.tobytes()
        doc.close()
        entry = extras.set_flipbook("testbuch", "de", pdf_bytes=data, skip=1)
        self.assertEqual(entry["ratio"], 1.0)
        self.assertEqual(entry["total"], 11)  # PDF-Seite 1 ist das Titelbild
        normal = extras.set_flipbook("anderes", "de", pdf_bytes=make_pdf(3))
        self.assertAlmostEqual(normal["ratio"], 621 / 810, places=3)

    def test_standardlimit_ist_vierzig_prozent(self):
        self.assertEqual(extras.default_preview_limit(70), 27)
        self.assertEqual(extras.default_preview_limit(300), extras.FLIP_PREVIEW_MAX - 1)
        for total in range(1, 301):
            limit = extras.default_preview_limit(total)
            self.assertTrue(limit == total or limit % 2 == 1, f"{total}: gerade Vorschau {limit}")
        self.assertEqual(extras.default_preview_limit(3), 3)

    def test_neue_pdf_ersetzt_alte_seiten(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(6), limit=6)
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2), limit=2)
        folder = self.tmp / "public" / "images" / "buch-testbuch-de"
        self.assertEqual(sorted(p.name for p in folder.iterdir()), ["p01.webp", "p02.webp"])

    def test_kaputte_pdf_laesst_alten_stand_unveraendert(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(3), limit=3)
        with self.assertRaises(extras.AdminError):
            extras.set_flipbook("testbuch", "de", pdf_bytes=b"%PDF-1.4 kaputt")
        self.assertEqual(extras.load_flipbooks()["testbuch"]["de"]["count"], 3)
        self.assertTrue((self.tmp / "public" / "images" / "buch-testbuch-de" / "p03.webp").is_file())
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
        self.assertFalse((folder / "p01.webp").exists())
        self.assertNotIn("testbuch", extras.load_flipbooks())

    def test_ungueltige_ids_werden_abgelehnt(self):
        for bad_id, bad_lang in (("../x", "de"), ("Test Buch", "de"), ("testbuch", "../de"), ("testbuch", "d")):
            with self.assertRaises(extras.AdminError):
                extras.set_flipbook(bad_id, bad_lang, pdf_bytes=make_pdf(1))

    def test_vorschau_datei_nur_fuer_eigene_namen(self):
        extras.set_flipbook("testbuch", "de", pdf_bytes=make_pdf(2))
        self.assertIsNotNone(extras.flipbook_file("testbuch", "de", "p01.webp"))
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
        self.assertEqual(result["flipbooks"][book_id]["de"]["total"], 4)
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


FAKE_MP4 = b"\x00\x00\x00ftypmp42" + b"\x00" * 64


class MediaTests(ServerTests):
    """Startseiten-Medien: Bereiche, Titelbild, Kinder-Videos, Gratis-Ausmalbild, App-Screenshots."""

    def state(self):
        return json.loads(server.DATA_JSON.read_text(encoding="utf-8"))

    def ts(self):
        return server.BOOKS_TS.read_text(encoding="utf-8")

    def test_bereiche_ausblenden_erscheint_in_den_seitendaten(self):
        result = self.post_json("/api/media/sections", {"hidden": ["app", "kids", "gibtesnicht"]})
        self.assertTrue(result["ok"])
        self.assertEqual(self.state()["site"]["hiddenSections"], ["kids", "app"])
        self.assertIn('hiddenSections: ["kids", "app"] as string[]', self.ts())

    def test_ohne_felder_gelten_die_bisherigen_werte(self):
        site = self.state()["site"]
        self.assertNotIn("kidsVideos", site)  # noch nicht migriert → Standardwerte
        self.assertIn('"src": "videos/kids/ausmalen-meer.mp4"', self.ts() if self.ts_exists() else "")

    def ts_exists(self):
        if not server.BOOKS_TS.exists():
            server.render_books_ts(self.state())
        return True

    def test_titelbild_erzeugt_drei_groessen(self):
        result = self.post_multipart("/api/media/hero", {}, {"image": ("t.jpg", make_image(2800, 1575))})
        self.assertTrue(result["ok"], result)
        from PIL import Image
        folder = self.tmp / "public" / "images"
        self.assertEqual(Image.open(folder / "hero-titel-breit.jpg").width, 2560)
        self.assertEqual(Image.open(folder / "hero-titel.jpg").width, 1600)
        self.assertEqual(Image.open(folder / "hero-titel-mobil.jpg").width, 1000)
        for stem, width in (("hero-titel-breit", 2560), ("hero-titel", 1600), ("hero-titel-mobil", 1000)):
            self.assertEqual(Image.open(folder / f"{stem}.webp").width, width, f"{stem}.webp passt nicht zum JPG")
        og = Image.open(folder / "og-lambking.jpg")
        self.assertEqual(og.size, (1200, 630))
        self.assertFalse(list(folder.glob(".neu-*")))

    def test_titelbild_hochformat_wird_abgelehnt_und_nichts_veraendert(self):
        folder = self.tmp / "public" / "images"
        (folder / "hero-titel.jpg").write_bytes(b"alt")
        bad = self.post_multipart("/api/media/hero", {}, {"image": ("t.jpg", make_image(900, 1400))})
        self.assertFalse(bad["ok"])
        self.assertEqual((folder / "hero-titel.jpg").read_bytes(), b"alt")

    def test_kinder_videos_hinzufuegen_sortieren_entfernen(self):
        added = self.post_multipart("/api/media/kids/add", {}, {"video": ("Mein Video.mp4", FAKE_MP4), "poster": ("p.jpg", make_image(540, 960))})
        self.assertTrue(added["ok"], added)
        videos = added["media"]["kidsVideos"]
        self.assertEqual(len(videos), 5)
        new = videos[-1]
        self.assertEqual(new["src"], "videos/kids/mein-video.mp4")
        self.assertTrue((self.tmp / "public" / new["src"]).is_file())
        self.assertTrue((self.tmp / "public" / new["poster"]).is_file())
        moved = self.post_json("/api/media/kids/move", {"index": 4, "dir": -1})
        self.assertEqual(moved["media"]["kidsVideos"][3]["src"], "videos/kids/mein-video.mp4")
        removed = self.post_json("/api/media/kids/delete", {"index": 3})
        self.assertTrue(removed["ok"])
        self.assertFalse((self.tmp / "public" / new["src"]).exists())
        self.assertFalse(self.post_json("/api/media/kids/delete", {"index": 99})["ok"])

    def test_kein_mp4_oder_zu_grosses_video_wird_abgelehnt(self):
        bad = self.post_multipart("/api/media/kids/add", {}, {"video": ("v.mp4", b"das ist kein video"), "poster": ("p.jpg", make_image(100, 100))})
        self.assertFalse(bad["ok"])
        self.assertEqual(len(self.state()["site"].get("kidsVideos", media.DEFAULT_KIDS_VIDEOS)), 4)
        self.assertFalse(list((self.tmp / "public" / "videos" / "kids").glob("*"))) if (self.tmp / "public" / "videos" / "kids").exists() else None

    def test_gratis_ausmalbild_ersetzen(self):
        downloads = self.tmp / "public" / "downloads"
        downloads.mkdir(parents=True)
        (downloads / "LambKing-Ausmalbild-Kinder-Wiese.pdf").write_bytes(b"%PDF-alt")
        (self.tmp / "public" / "images" / "ausmalbild-wiese-vorschau.jpg").write_bytes(b"alt")
        result = self.post_multipart("/api/media/freebie", {}, {"pdf": ("Neues Bild.pdf", make_pdf(1))})
        self.assertTrue(result["ok"], result)
        freebie = result["media"]["freebie"]
        self.assertEqual(freebie["pdf"], "downloads/neues-bild.pdf")
        self.assertTrue((self.tmp / "public" / freebie["pdf"]).is_file())
        self.assertTrue((self.tmp / "public" / freebie["preview"]).stat().st_size > 1000)
        self.assertFalse((downloads / "LambKing-Ausmalbild-Kinder-Wiese.pdf").exists(), "alte Datei bleibt liegen")
        bad = self.post_multipart("/api/media/freebie", {}, {"pdf": ("x.pdf", b"kein pdf")})
        self.assertFalse(bad["ok"])

    def test_app_screenshots(self):
        (self.tmp / "public" / "images" / "app").mkdir(parents=True)
        for item in media.DEFAULT_APP_SCREENS:
            (self.tmp / "public" / item["src"]).write_bytes(b"x")
        added = self.post_multipart("/api/media/appscreens/add", {"titleDe": "Neu", "textDe": "Satz", "titleEn": "New", "textEn": "Sentence"}, {"image": ("s.png", make_image(900, 1900))})
        self.assertTrue(added["ok"], added)
        screens = added["media"]["appScreens"]
        self.assertEqual(len(screens), 7)
        self.assertEqual(screens[-1]["en"]["title"], "New")
        updated = self.post_json("/api/media/appscreens/update", {"index": 6, "titleDe": "Geändert", "textDe": "x", "titleEn": "Changed", "textEn": "y"})
        self.assertEqual(updated["media"]["appScreens"][6]["de"]["title"], "Geändert")
        self.post_json("/api/media/appscreens/move", {"index": 6, "dir": -1})
        self.assertEqual(self.state()["site"]["appScreens"][5]["de"]["title"], "Geändert")
        removed = self.post_json("/api/media/appscreens/delete", {"index": 5})
        self.assertTrue(removed["ok"])
        self.assertEqual(len(removed["media"]["appScreens"]), 6)
        self.assertIn('"title": "Willkommen"', self.ts())

    def test_letzten_screenshot_nicht_loeschbar(self):
        state = self.state()
        state["site"]["appScreens"] = media.DEFAULT_APP_SCREENS[:1]
        server.save_state(state)
        self.assertFalse(self.post_json("/api/media/appscreens/delete", {"index": 0})["ok"])

    def test_medien_vorschau_route_ist_eng_begrenzt(self):
        (self.tmp / "public" / "images" / "ok.jpg").write_bytes(b"jpgdaten")
        (self.tmp / "geheim.txt").write_text("geheim", encoding="utf-8")
        base = f"http://127.0.0.1:{self.port}"
        self.assertEqual(urllib.request.urlopen(base + "/media/images/ok.jpg").read(), b"jpgdaten")
        for bad in ("/media/../geheim.txt", "/media/images/../../geheim.txt", "/media/src/data/books.json", "/media/images/ok.txt"):
            with self.assertRaises(urllib.error.HTTPError, msg=bad):
                urllib.request.urlopen(base + bad)



def merge_texts(defaults, saved):
    """Python-Nachbau von mergeTexts() aus src/data/texts.ts – zum Vergleichen der wirksamen Texte."""
    if saved is None:
        return defaults
    if isinstance(defaults, list):
        return saved if isinstance(saved, list) else defaults
    if not isinstance(defaults, dict) or not isinstance(saved, dict):
        return saved
    result = dict(defaults)
    for key, value in saved.items():
        result[key] = merge_texts(defaults.get(key), value)
    return result


class TextOverrideTests(unittest.TestCase):
    def test_nur_abweichungen_bleiben_und_wirksame_texte_aendern_sich_nicht(self):
        site = json.loads((REAL_ROOT / "src" / "data" / "books.json").read_text(encoding="utf-8"))["site"]
        defaults = json.loads((REAL_ROOT / "src" / "data" / "texts.defaults.json").read_text(encoding="utf-8"))
        overrides = site.get("frontendTexts", {})
        for lang in ("de", "en"):
            pruned = extras.prune_text_overrides(overrides.get(lang, {}), defaults[lang])
            self.assertEqual(merge_texts(defaults[lang], overrides.get(lang)), merge_texts(defaults[lang], pruned), f"Wirksame Texte ({lang}) ändern sich")
            self.assertLessEqual(json.dumps(pruned), json.dumps(overrides.get(lang, {})))

    def test_prune_einzelfaelle(self):
        defaults = {"a": {"x": "1", "y": ["p", "q"]}, "b": "B"}
        self.assertEqual(extras.prune_text_overrides({"a": {"x": "1", "y": ["p", "q"]}, "b": "B"}, defaults), {})
        self.assertEqual(extras.prune_text_overrides({"a": {"x": "neu", "y": ["p", "q"]}, "b": "B"}, defaults), {"a": {"x": "neu"}})
        self.assertEqual(extras.prune_text_overrides({"a": {"y": ["p"]}}, defaults), {"a": {"y": ["p"]}})
        self.assertEqual(extras.prune_text_overrides({"neu": "k"}, defaults), {"neu": "k"})


class LegalTextTests(ServerTests):
    def test_speichern_aendert_den_datenschutztext_nicht_bei_anderen_zeilenumbruechen(self):
        before = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["site"]["datenschutz"]
        crlf = before.replace("\r\n", "\n").replace("\n", "\r\n")
        self.post_multipart("/api/site", {"datenschutz": crlf}, {})
        after = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["site"]["datenschutz"]
        self.assertEqual(after, before, "Datenschutztext darf sich nicht verändern")
        self.post_multipart("/api/site", {"datenschutz": before + "\nNeuer Absatz."}, {})
        changed = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["site"]["datenschutz"]
        self.assertTrue(changed.endswith("Neuer Absatz."))



class RatingsTests(ServerTests):
    def test_sterne_werden_uebernommen_und_fehler_abgefangen(self):
        saved = (server.fetch_amazon_html, server.parse_amazon)
        calls = {"n": 0}

        def fake_fetch(asin):
            calls["n"] += 1
            if calls["n"] == 2:
                raise OSError("blockiert")
            return asin

        server.fetch_amazon_html = fake_fetch
        server.parse_amazon = lambda html: {"amazonRating": 4.8, "amazonRatingCount": 12}
        try:
            result = self.post_json("/api/ratings/update", {})
        finally:
            server.fetch_amazon_html, server.parse_amazon = saved
        self.assertTrue(result["ok"])
        self.assertGreaterEqual(result["changed"], 1)
        states = {entry["status"] for entry in result["report"]}
        self.assertIn("ok", states)
        self.assertIn("unsure", states)  # ein Buch war nicht erreichbar, der Rest lief weiter
        books = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))["books"]
        self.assertTrue(any(b.get("amazonRating") == 4.8 for b in books))



class PublishFlowTests(unittest.TestCase):
    """Veröffentlichen und Zurücknehmen gegen ein echtes (lokales) Mini-Repository mit Test-Ziel."""

    def setUp(self):
        self.base = Path(tempfile.mkdtemp())
        git = lambda cwd, *a: subprocess.run(["git", "-C", str(cwd), *a], check=True, capture_output=True, text=True)
        self.git = git
        self.origin = self.base / "origin.git"
        subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(self.origin)], check=True, capture_output=True)
        self.work = self.base / "work"
        self.work.mkdir()
        git(self.work, "init", "-q", "-b", "main")
        git(self.work, "config", "user.email", "t@t")
        git(self.work, "config", "user.name", "t")
        (self.work / "src" / "data").mkdir(parents=True)
        (self.work / "src" / "data" / "books.json").write_text('{"books": [], "site": {}}', encoding="utf-8")
        git(self.work, "add", "-A")
        git(self.work, "commit", "-qm", "start")
        git(self.work, "remote", "add", "origin", str(self.origin))
        git(self.work, "push", "-q", "origin", "main")
        git(self.work, "fetch", "-q", "origin")
        self.saved = (server.ROOT, extras.ROOT, server.precheck, server.build_site, server.DATA_JSON)
        server.ROOT = self.work
        extras.ROOT = self.work
        server.DATA_JSON = self.work / "src" / "data" / "books.json"
        server.precheck = lambda state: [("gruen", "ok")]
        server.build_site = lambda command="build", timeout=600: (True, "")
        self.httpd = HTTPServer(("127.0.0.1", 0), server.Handler)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        server.ROOT, extras.ROOT, server.precheck, server.build_site, server.DATA_JSON = self.saved
        shutil.rmtree(self.base, ignore_errors=True)

    def post(self, path):
        request = urllib.request.Request(f"http://127.0.0.1:{self.port}{path}", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
        return json.loads(urllib.request.urlopen(request).read())

    def test_nur_seitendateien_werden_veroeffentlicht(self):
        (self.work / "src" / "data" / "neu.json").write_text("{}", encoding="utf-8")
        (self.work / "public" / "images").mkdir(parents=True)
        (self.work / "public" / "images" / "bild.jpg").write_bytes(b"jpg")
        (self.work / "_Entwuerfe").mkdir()
        (self.work / "_Entwuerfe" / "video.mp4").write_bytes(b"x" * 100)
        (self.work / "notiz.docx").write_bytes(b"x")
        result = self.post("/api/publish")
        self.assertTrue(result["ok"], result)
        self.assertEqual(sorted(result["excluded"]), ["_Entwuerfe/", "notiz.docx"])
        remote_files = self.git(self.origin, "ls-tree", "-r", "--name-only", "main").stdout.split()
        self.assertIn("src/data/neu.json", remote_files)
        self.assertIn("public/images/bild.jpg", remote_files)
        self.assertFalse(any(f.startswith("_Entwuerfe") or f.endswith(".docx") for f in remote_files), remote_files)
        self.assertTrue((self.work / "_Entwuerfe" / "video.mp4").is_file(), "lokale Datei darf nicht verschwinden")
        # beim zweiten Mal gibt es nichts mehr zu tun und die Entwürfe bleiben draußen
        (self.work / "_Entwuerfe" / "noch-eins.mp4").write_bytes(b"y")
        again = self.post("/api/publish")
        self.assertTrue(again["ok"])
        self.assertTrue(again.get("already"), again)

    def test_letzte_veroeffentlichung_zuruecknehmen(self):
        (self.work / "src" / "data" / "neu.json").write_text("{}", encoding="utf-8")
        self.assertTrue(self.post("/api/publish")["ok"])
        self.assertIn("src/data/neu.json", self.git(self.origin, "ls-tree", "-r", "--name-only", "main").stdout.split())
        undone = self.post("/api/undo-publish")
        self.assertTrue(undone["ok"], undone)
        self.assertNotIn("src/data/neu.json", self.git(self.origin, "ls-tree", "-r", "--name-only", "main").stdout.split())
        history = self.git(self.origin, "log", "--format=%s", "main").stdout.splitlines()
        self.assertEqual(len(history), 3)  # start, Veröffentlichung, Zurücknehmen – nichts wurde gelöscht
        # eine fremde Veröffentlichung (nicht aus dem Admin) wird nicht automatisch zurückgenommen
        (self.work / "src" / "data" / "x.json").write_text("{}", encoding="utf-8")
        self.git(self.work, "add", "-A")
        self.git(self.work, "commit", "-qm", "Handarbeit")
        self.git(self.work, "push", "-q", "origin", "main")
        self.assertFalse(self.post("/api/undo-publish")["ok"])

    def test_zu_grosse_datei_in_seitenordner_wird_ausgeschlossen(self):
        (self.work / "public" / "videos").mkdir(parents=True)
        big = self.work / "public" / "videos" / "riesig.mp4"
        with big.open("wb") as handle:
            handle.truncate(extras.MAX_PUBLISH_FILE_BYTES + 1024)
        (self.work / "src" / "data" / "ok.json").write_text("{}", encoding="utf-8")
        result = self.post("/api/publish")
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["excluded"], ["public/videos/riesig.mp4"])
        self.assertNotIn("public/videos/riesig.mp4", self.git(self.origin, "ls-tree", "-r", "--name-only", "main").stdout.split())



class HeroTests(MediaTests):
    """Titelbild: genaue Vorgaben (Größe/Format) und Einstellungen für Schrift und Ausschnitt."""

    def test_zu_kleines_oder_falsches_format_wird_abgelehnt(self):
        folder = self.tmp / "public" / "images"
        (folder / "hero-titel.jpg").write_bytes(b"alt")
        for width, height in ((1200, 675), (1599, 900), (2000, 2000), (3000, 1000)):
            bad = self.post_multipart("/api/media/hero", {}, {"image": ("t.jpg", make_image(width, height))})
            self.assertFalse(bad["ok"], (width, height))
        self.assertEqual((folder / "hero-titel.jpg").read_bytes(), b"alt")
        ok = self.post_multipart("/api/media/hero", {}, {"image": ("t.jpg", make_image(1600, 900))})
        self.assertTrue(ok["ok"], ok)
        also_ok = self.post_multipart("/api/media/hero", {}, {"image": ("t.jpg", make_image(2600, 1000))})
        self.assertTrue(also_ok["ok"], also_ok)

    def test_standardwerte_entsprechen_dem_bisherigen_aussehen(self):
        self.assertEqual(media.hero_settings({}), {"textTone": "dark", "scrim": 80, "focusDesktop": {"x": 50, "y": 35}, "focusMobile": {"x": 70, "y": 50}})

    def test_einstellungen_speichern_und_in_seitendaten(self):
        result = self.post_json("/api/media/hero-settings", {"textTone": "light", "scrim": 55, "focusDesktopX": 60, "focusDesktopY": 20, "focusMobileX": 80, "focusMobileY": 40})
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["media"]["hero"], {"textTone": "light", "scrim": 55, "focusDesktop": {"x": 60, "y": 20}, "focusMobile": {"x": 80, "y": 40}})
        self.assertIn('"textTone": "light"', self.ts())
        self.assertIn("as HeroSettings", self.ts())

    def test_ungueltige_einstellungen_werden_begrenzt_oder_abgelehnt(self):
        self.assertFalse(self.post_json("/api/media/hero-settings", {"textTone": "rot", "scrim": 50})["ok"])
        clamped = self.post_json("/api/media/hero-settings", {"textTone": "dark", "scrim": 999, "focusDesktopX": -50, "focusDesktopY": "abc", "focusMobileX": None, "focusMobileY": 100.4})
        self.assertTrue(clamped["ok"])
        hero = clamped["media"]["hero"]
        self.assertEqual(hero["scrim"], 100)
        self.assertEqual(hero["focusDesktop"], {"x": 0, "y": 35})
        self.assertEqual(hero["focusMobile"], {"x": 70, "y": 100})



class VersionTests(ServerTests):
    def test_state_nennt_die_programmversion(self):
        state = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/state").read())
        self.assertEqual(state["adminVersion"], server.ADMIN_VERSION)
        html = (REAL_ROOT / "admin" / "index.html").read_text(encoding="utf-8")
        self.assertIn(f"const ADMIN_VERSION = '{server.ADMIN_VERSION}'", html)



class PrecheckTests(TempProject):
    def test_hinweistext_und_unvollstaendige_eintraege_bringen_die_pruefung_nicht_zum_absturz(self):
        (self.tmp / "src" / "data" / "flipbooks.json").write_text(json.dumps({
            "_hinweis": "nur ein Hinweistext",
            "david": {"de": {"dir": "images/buch-david-de", "count": 3}, "kaputt": "text"},
            "seltsam": "kein Objekt",
        }), encoding="utf-8")
        state = json.loads(server.DATA_JSON.read_text(encoding="utf-8"))
        checks = server.precheck_flipbook(state, [])
        self.assertTrue(any(status == "rot" and "david" in text for status, text in checks), checks)  # Dateien fehlen → gemeldet, nicht abgestürzt


class PrecheckEchteDatenTests(unittest.TestCase):
    """Die komplette Vorab-Prüfung muss mit den ECHTEN Projektdaten ohne Fehler durchlaufen (nur lesend)."""

    def test_gesamte_vorabpruefung_laeuft_mit_den_echten_daten(self):
        from unittest import mock
        with mock.patch.object(server.urllib.request, "urlopen", return_value=None):
            checks = server.precheck(server.load_state())
        self.assertTrue(checks)
        self.assertTrue(all(status in ("gruen", "gelb", "rot") for status, _ in checks))
        blocker = [text for status, text in checks if status == "rot" and "GitHub" not in text and "Git " not in text]
        self.assertEqual(blocker, [], blocker)



class PublishE2ETests(PublishFlowTests):
    def test_fehlgeschlagener_browser_test_verhindert_das_hochladen(self):
        server.build_site = lambda command="build", timeout=600: (command != "test:e2e", "E2E kaputt")
        (self.work / "src" / "data" / "neu.json").write_text("{}", encoding="utf-8")
        result = self.post("/api/publish")
        self.assertFalse(result["ok"], result)
        self.assertIn("Browser-Test", result["error"])
        self.assertNotIn("src/data/neu.json", self.git(self.origin, "ls-tree", "-r", "--name-only", "main").stdout.split())

    def test_ohne_chrome_wird_der_browser_test_uebersprungen(self):
        server.build_site = lambda command="build", timeout=600: (command != "test:e2e", "Chrome/Chromium wurde nicht gefunden")
        (self.work / "src" / "data" / "neu.json").write_text("{}", encoding="utf-8")
        self.assertTrue(self.post("/api/publish")["ok"])


if __name__ == "__main__":
    unittest.main()
