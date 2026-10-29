"""Kleine Regressionstests für die portable Buchverwaltung."""

import unittest

from admin.admin_server import parse_amazon, split_amazon_description


class AmazonDescriptionTests(unittest.TestCase):
    def test_multilingual_coloring_books_keep_their_category(self):
        for title in (
            "Bible Stories to Color: David and Goliath",
            "Historias bíblicas para colorear: David y Goliat",
            "Mit Buntstift durch die Bibel: Die Schöpfung",
        ):
            html = f'<span id="productTitle">{title}</span>'
            self.assertEqual(parse_amazon(html)["category"], "malbuecher")

    def test_story_and_product_facts_are_separate(self):
        story, facts = split_amazon_description(
            "David hütet die Schafe seines Vaters. Er vertraut Gott und tritt Goliath entgegen. "
            "Das Buch umfasst 70 Seiten im DIN-A4-Format. Zusätzlich gibt es 5 Seiten mit Spielen."
        )
        self.assertIn("tritt Goliath entgegen", story)
        self.assertNotIn("70 Seiten", story)
        self.assertTrue(any("70 Seiten" in fact for fact in facts))

    def test_story_without_product_facts(self):
        story, facts = split_amazon_description(
            "Maria und Josef reisen nach Bethlehem. Dort wird Jesus geboren."
        )
        self.assertIn("Jesus geboren", story)
        self.assertEqual(facts, [])


if __name__ == "__main__":
    unittest.main()
