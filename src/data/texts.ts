// ─────────────────────────────────────────────────────────────
// Alle sichtbaren Texte der Landingpage – Deutsch & English
// ─────────────────────────────────────────────────────────────

import type { Lang } from './lang'

export const TEXTS = {
  de: {
    nav: {
      books: 'Bücher',
      how: "So funktioniert's",
      app: 'App',
      about: 'Über das Projekt',
      faq: 'FAQ',
    },
    hero: {
      title1: 'Kleine Helden. Große Geschichten.',
      title2: 'Ein großer Gott.',
      subtitle:
        'Malbücher und Kinderbücher, die biblische Abenteuer lebendig machen und Kinderherzen für Jesus öffnen.',
      ctaBooks: 'Bücher entdecken',
      ctaApp: 'Zur kostenlosen App',
      trust: ['Bibeltreu & geprüft', 'Kindgerecht gestaltet', 'Druck & Versand über Amazon'],
      bookHint: 'Mit der Maus drüberfahren – das Buch blättert sich durch',
    },
    books: {
      eyebrow: 'Unsere Bücher',
      title: 'Aussuchen, reinschauen, bestellen.',
      subtitle:
        'Sorgfältig ausgewählt, bibeltreu erzählt. Klicke auf ein Buch, um den Inhalt anzusehen – der Kauf läuft sicher über Amazon oder den TikTok Shop.',
      all: 'Alle',
      categories: { geschichten: 'Geschichten', malbuecher: 'Malbücher', komics: 'Comics' },
      emptyKomis: 'Hier entstehen gerade biblische Comic-Abenteuer – schau bald wieder vorbei!',
      emptyAll: 'Hier entstehen gerade neue Bücher – schau bald wieder vorbei!',
      comingSoonSuffix: 'bald erhältlich',
      newBadge: 'Neu',
      lookInside: 'Inhalt ansehen',
      priceOnAmazon: 'Preis bei Amazon',
      seePrice: 'Aktuellen Preis bei Amazon ansehen',
      samplesHint: 'Blick ins Buch – klicken zum Vergrößern',
      zoom: 'Groß',
      backToBook: 'Zurück zum Buch',
      tiktokSoon: 'TikTok Shop folgt',
      tiktokSoonTitle: 'Der TikTok-Shop-Link folgt in Kürze',
      growing: 'Die Serie wächst – bald erhältlich:',
    },
    trust: {
      title: 'Vertrauen, das trägt.',
      items: [
        {
          title: 'Bibeltreu & geprüft',
          text: 'Alle Inhalte sind biblisch fundiert, ökumenisch geprüft und altersgerecht aufbereitet.',
        },
        {
          title: 'Kindgerecht & wertvoll',
          text: 'Spannende Geschichten, die Werte vermitteln und die Beziehung zu Gott stärken.',
        },
        {
          title: 'Werbefrei & sicher',
          text: 'Keine Werbung, kein Tracking. Eine ruhige, sichere Umgebung für Kinder und Familien.',
        },
      ],
    },
    how: {
      eyebrow: "So funktioniert's",
      title: 'In drei Schritten zum Buch',
      steps: [
        {
          title: '1. Inhalt ansehen',
          text: 'Jedes Buch lässt sich hier direkt durchblättern – mit echten Beispielseiten aus dem Inneren.',
        },
        {
          title: '2. Lieblingsbuch wählen',
          text: 'Malbuch oder Bilderbuch? Wähle die Geschichte, die zu deinem Kind passt.',
        },
        {
          title: '3. Sicher bestellen',
          text: 'Ein Klick führt zu Amazon oder zum TikTok Shop. Druck, Zahlung und Versand laufen dort – mit 14 Tagen Widerrufsrecht.',
        },
      ],
    },
    app: {
      eyebrow: 'Die App',
      title: 'Die Geschichten auch digital erleben',
      text: 'In der kostenlosen LambKing App entdecken Kinder Geschichten, die Glauben stärken und Gottes gute Botschaft lebendig machen – liebevoll erzählt und kindgerecht gestaltet. Von dort geht es auch zurück zu den Büchern.',
      soon: 'Bald im Google Play Store – der Link folgt in Kürze.',
    },
    about: {
      eyebrow: 'Über das Projekt',
      title: 'Geschichten, die Glauben wachsen lassen',
      role: 'Autor und Gründer von LambKing Stories',
      paragraphs: [
        'Als Vater einer großen Familie und überzeugter Christ liegt es mir besonders am Herzen, Kindern die Liebe Jesu und die Botschaft des Evangeliums näherzubringen.',
        'Mein Glaube und das Leben mit meinen Kindern inspirieren mich zu Geschichten, die biblische Werte verständlich und kindgerecht vermitteln. So entstehen mit viel Liebe zum Detail Bücher, die Freude bereiten, Hoffnung schenken und Kinder in ihrem Glauben stärken.',
      ],
      highlight:
        'Mit LambKing Stories möchte ich einen kleinen Beitrag dazu leisten, dass Kinder Jesus kennenlernen, im Glauben wachsen und Gottes Reich durch die nächste Generation sichtbar wird.',
    },
    donate: {
      title: 'Dieses Projekt dient einem guten Werk für Gott.',
      text: 'LambKing Stories ist ein unabhängiges Herzensprojekt. Mit deiner Unterstützung hilfst du mit, noch mehr glaubensstärkende Bücher für Kinder zu schaffen.',
      note: 'Sicher & schnell mit PayPal',
    },
    faq: {
      eyebrow: 'Häufige Fragen',
      title: 'Gut zu wissen',
      items: [
        {
          q: 'Wo kann ich die Bücher kaufen?',
          a: 'Alle Bücher bestellst du sicher über Amazon (Kindle Direct Publishing) – Druck, Zahlung und Versand laufen dort zuverlässig über dein Amazon-Konto. Ausgewählte Titel folgen zusätzlich im TikTok Shop; die Buttons dazu erscheinen direkt am Buch, sobald sie verfügbar sind.',
        },
        {
          q: 'Für welches Alter sind die Bücher geeignet?',
          a: 'Die Malbücher richten sich an Kinder ab ca. 4–5 Jahren, das Bilderbuch „Der Mann im Baum“ an Kinder von 6–12 Jahren. Alle Inhalte sind bibeltreu und kindgerecht geprüft.',
        },
        {
          q: 'Wie funktionieren Versand und Rückgabe?',
          a: 'Der Versand läuft komplett über Amazon – inklusive Prime-Lieferung, Sendungsverfolgung und 14-tägigem Widerrufsrecht. Du kaufst also mit allen Amazon-Vorteilen.',
        },
        {
          q: 'Gibt es die Geschichten auch digital?',
          a: 'Ja! Die kostenlose LambKing App gibt es im Google Play Store – liebevoll erzählte Geschichten, die Kinder interaktiv erleben können.',
        },
        {
          q: 'Wie kann ich das Projekt unterstützen?',
          a: 'LambKing Stories ist ein unabhängiges Herzensprojekt. Über den PayPal-Button kannst du das Werk mit einem frei gewählten Betrag unterstützen – jede Spende hilft, neue Bücher zu ermöglichen.',
        },
      ],
      playLink: 'Bei Google Play ansehen →',
    },
    footer: {
      tagline: 'Biblisch fundierte Malbücher und Kinderbücher – von einer Familie für Familien.',
      rights: 'Alle Rechte vorbehalten.',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      impressumTitle: 'Impressum',
      datenschutzTitle: 'Datenschutzerklärung',
      legalEmpty: 'Dieser Text wird gerade vorbereitet.',
    },
    buy: {
      amazon: 'Bei Amazon kaufen',
      tiktok: 'Im TikTok Shop kaufen',
    },
  },

  en: {
    nav: {
      books: 'Books',
      how: 'How it works',
      app: 'App',
      about: 'About the project',
      faq: 'FAQ',
    },
    hero: {
      title1: 'Little heroes. Big stories.',
      title2: 'A great God.',
      subtitle:
        "Coloring books and children's books that bring biblical adventures to life and open children's hearts to Jesus.",
      ctaBooks: 'Discover the books',
      ctaApp: 'Free app',
      trust: ['Faithful to Scripture & reviewed', 'Designed for children', 'Printing & shipping via Amazon'],
      bookHint: 'Hover with your mouse – the book flips through its pages',
    },
    books: {
      eyebrow: 'Our books',
      title: 'Choose, look inside, order.',
      subtitle:
        'Carefully selected and faithful to Scripture. Click a book to look inside – purchasing is safe and easy via Amazon or the TikTok Shop.',
      all: 'All',
      categories: { geschichten: 'Stories', malbuecher: 'Coloring Books', komics: 'Comics' },
      emptyKomis: 'Bible comic adventures are in the making – check back soon!',
      emptyAll: 'New books are in the making – check back soon!',
      comingSoonSuffix: 'coming soon',
      newBadge: 'New',
      lookInside: 'Look inside',
      priceOnAmazon: 'Price on Amazon',
      seePrice: 'See current price on Amazon',
      samplesHint: 'A look inside – click to enlarge',
      zoom: 'Zoom',
      backToBook: 'Back to the book',
      tiktokSoon: 'TikTok Shop coming soon',
      tiktokSoonTitle: 'The TikTok Shop link will follow shortly',
      growing: 'The series is growing – coming soon:',
    },
    trust: {
      title: 'Trust that carries.',
      items: [
        {
          title: 'Faithful to Scripture & reviewed',
          text: 'All content is rooted in the Bible, ecumenically reviewed, and prepared in an age-appropriate way.',
        },
        {
          title: 'Child-friendly & meaningful',
          text: "Exciting stories that teach values and strengthen children's relationship with God.",
        },
        {
          title: 'Ad-free & safe',
          text: 'No ads, no tracking. A calm, safe environment for children and families.',
        },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'Three steps to your book',
      steps: [
        {
          title: '1. Look inside',
          text: 'Every book can be flipped through right here – with real sample pages from inside.',
        },
        {
          title: '2. Pick your favorite',
          text: 'Coloring book or picture book? Choose the story that fits your child best.',
        },
        {
          title: '3. Order safely',
          text: 'One click takes you to Amazon or the TikTok Shop. Printing, payment, and shipping are handled there – with a 14-day return policy.',
        },
      ],
    },
    app: {
      eyebrow: 'The app',
      title: 'Experience the stories digitally',
      text: "In the free LambKing app, children discover stories that strengthen faith and bring God's good news to life – lovingly told and designed for kids. From there, it also leads back to the books.",
      soon: 'Coming soon to the Google Play Store – the link will follow shortly.',
    },
    about: {
      eyebrow: 'About the project',
      title: 'Stories that grow faith',
      role: 'Author and founder of LambKing Stories',
      paragraphs: [
        'As the father of a large family and a devoted Christian, it is especially close to my heart to bring the love of Jesus and the message of the Gospel closer to children.',
        'My faith and my life with my children inspire me to write stories that convey biblical values in a way children can understand. The result is lovingly crafted books that bring joy, give hope, and strengthen children in their faith.',
      ],
      highlight:
        "With LambKing Stories, I want to make a small contribution so that children get to know Jesus, grow in faith, and make God's kingdom visible through the next generation.",
    },
    donate: {
      title: 'This project serves a good work for God.',
      text: 'LambKing Stories is an independent passion project. With your support, you help create even more faith-building books for children.',
      note: 'Safe & fast with PayPal',
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Good to know',
      items: [
        {
          q: 'Where can I buy the books?',
          a: 'All books can be ordered safely via Amazon (Kindle Direct Publishing) – printing, payment, and shipping are handled reliably through your Amazon account. Selected titles will also be available in the TikTok Shop; the buttons appear directly on the book as soon as they are available.',
        },
        {
          q: 'What age are the books suitable for?',
          a: 'The coloring books are designed for children from around 4–5 years old, the picture book “The Man in the Tree” for children aged 6–12. All content is faithful to Scripture and reviewed for child-friendliness.',
        },
        {
          q: 'How do shipping and returns work?',
          a: 'Shipping is handled entirely by Amazon – including Prime delivery, shipment tracking, and a 14-day return policy. So you buy with all the benefits of Amazon.',
        },
        {
          q: 'Are the stories available digitally?',
          a: 'Yes! The free LambKing app is available on the Google Play Store – lovingly told stories that children can experience interactively.',
        },
        {
          q: 'How can I support the project?',
          a: 'LambKing Stories is an independent passion project. You can support the work with an amount of your choice via the PayPal button – every donation helps make new books possible.',
        },
      ],
      playLink: 'View on Google Play →',
    },
    footer: {
      tagline: "Bible-based coloring books and children's books – from a family for families.",
      rights: 'All rights reserved.',
      impressum: 'Imprint',
      datenschutz: 'Privacy Policy',
      impressumTitle: 'Imprint',
      datenschutzTitle: 'Privacy Policy',
      legalEmpty: 'This text is currently being prepared.',
    },
    buy: {
      amazon: 'Buy on Amazon',
      tiktok: 'Buy on TikTok Shop',
    },
  },
}

export type Texts = (typeof TEXTS)['de']

export function textsFor(lang: Lang): Texts {
  return TEXTS[lang]
}
