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
      trust: ['Biblisch fundiert & kindgerecht', 'Liebevoll gestaltet', 'Druck & Versand über Amazon'],
      bookHint: 'Mit der Maus drüberfahren – das Buch blättert sich durch · Klicken zum Ansehen',
    },
    books: {
      eyebrow: 'Unsere Bücher',
      title: 'Aussuchen, reinschauen, bestellen.',
      subtitle:
        'Sorgfältig ausgewählt, biblisch fundiert erzählt. Klicke auf ein Buch, um den Inhalt anzusehen – zur Bestellung geht es über den Amazon-Link.',
      all: 'Alle',
      categories: { geschichten: 'Geschichten', malbuecher: 'Malbücher', komics: 'Comics' },
      types: { geschichten: 'Kinderbuch', malbuecher: 'Malbuch', komics: 'Comic' },
      emptyComics: 'Hier entstehen gerade biblische Comic-Abenteuer – schau bald wieder vorbei!',
      emptyAll: 'Hier entstehen gerade neue Bücher – schau bald wieder vorbei!',
      comingSoonSuffix: 'bald erhältlich',
      newBadge: 'Neu',
      lookInside: 'Inhalt ansehen',
      seePrice: 'Aktuellen Preis bei Amazon ansehen',
      samplesHint: 'Blick ins Buch – klicken zum Vergrößern',
      zoom: 'Groß',
      backToBook: 'Zurück zum Buch',
      growing: 'Die Serie wächst – bald erhältlich:',
      buyAmazon: 'Bei Amazon ansehen',
    },
    trust: {
      title: 'Vertrauen, das trägt.',
      items: [
        {
          title: 'Biblisch fundiert & kindgerecht',
          text: 'Alle Inhalte sind biblisch fundiert und altersgerecht aufbereitet.',
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
          title: '3. Bei Amazon bestellen',
          text: 'Ein Klick führt zur Amazon-Produktseite. Bestellung, Bezahlung, Versand und Rückgabe werden dort abgewickelt.',
        },
      ],
    },
    app: {
      eyebrow: 'Die App',
      title: 'Die Geschichten auch digital erleben',
      text: 'In der kostenlosen LambKing App entdecken Kinder Geschichten, die Glauben stärken und Gottes gute Botschaft lebendig machen – liebevoll erzählt und kindgerecht gestaltet. Von dort geht es auch zurück zu den Büchern.',
      ctaWebApp: 'Web-App kostenlos öffnen',
      playSoon: 'Android-App – bald im Google Play Store',
      playAlt: 'Jetzt bei Google Play',
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
    support: {
      title: 'LambKing Stories unterstützen',
      text: 'Wenn dir LambKing Stories gefällt und du die Entwicklung weiterer biblischer Geschichten und Bücher unterstützen möchtest, kannst du das Projekt freiwillig über PayPal oder Ko-fi unterstützen.',
      paypalAlt: 'Projekt mit PayPal unterstützen',
      kofiAlt: 'Support me on Ko-fi',
    },
    faq: {
      eyebrow: 'Häufige Fragen',
      title: 'Gut zu wissen',
      items: [
        {
          q: 'Wo kann ich die Bücher kaufen?',
          a: 'Über die jeweilige Buchseite gelangst du zur Amazon-Produktseite des Buches. Bestellung, Bezahlung und Versand erfolgen über Amazon.',
        },
        {
          q: 'Verkauft LambKing Stories die Bücher direkt über diese Website?',
          a: 'Die Bücher werden auf dieser Website vorgestellt. Der eigentliche Bestell- und Bezahlvorgang erfolgt über die verlinkte Amazon-Produktseite.',
        },
        {
          q: 'Für welches Alter sind die Bücher geeignet?',
          a: 'Die Altersempfehlung steht jeweils direkt beim Buch – klicke dazu einfach auf „Inhalt ansehen“.',
        },
        {
          q: 'Wie funktionieren Versand, Rückgabe und Widerruf?',
          a: 'Es gelten die Bedingungen der Verkaufsplattform Amazon. Alle Details dazu findest du auf der jeweiligen Amazon-Produktseite.',
        },
        {
          q: 'Gibt es die Geschichten auch digital?',
          a: 'Ja! Es gibt eine kostenlose LambKing Web-App, in der Kinder die Geschichten interaktiv erleben können. Eine Android-App im Google Play Store ist außerdem geplant.',
        },
        {
          q: 'Wie kann ich LambKing Stories unterstützen?',
          a: 'Wenn dir das Projekt am Herzen liegt, kannst du es freiwillig über PayPal oder Ko-fi unterstützen. Jede Unterstützung hilft, neue Bücher zu ermöglichen.',
        },
        {
          q: 'Wie kann ich Kontakt aufnehmen?',
          a: 'Du erreichst mich per E-Mail – ich freue mich über Nachrichten, Feedback und Anregungen.',
        },
      ],
      webAppLink: 'Web-App öffnen →',
      mailLink: 'hello@lambking.de',
    },
    footer: {
      tagline: 'Biblisch fundierte Malbücher und Kinderbücher – von einer Familie für Familien.',
      rights: 'Alle Rechte vorbehalten.',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
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
      trust: ['Rooted in Scripture & child-friendly', 'Lovingly designed', 'Printing & shipping via Amazon'],
      bookHint: 'Hover to flip through the pages · Click to look inside',
    },
    books: {
      eyebrow: 'Our books',
      title: 'Choose, look inside, order.',
      subtitle:
        'Carefully selected and faithfully told. Click a book to look inside – ordering takes place via the Amazon link.',
      all: 'All',
      categories: { geschichten: 'Stories', malbuecher: 'Coloring Books', komics: 'Comics' },
      types: { geschichten: "Children's Book", malbuecher: 'Coloring Book', komics: 'Comic' },
      emptyComics: 'Bible comic adventures are in the making – check back soon!',
      emptyAll: 'Our English editions are on their way – check back soon!',
      comingSoonSuffix: 'coming soon',
      newBadge: 'New',
      lookInside: 'Look inside',
      seePrice: 'See current price on Amazon',
      samplesHint: 'A look inside – click to enlarge',
      zoom: 'Zoom',
      backToBook: 'Back to the book',
      growing: 'The series is growing – coming soon:',
      buyAmazon: 'View on Amazon',
    },
    trust: {
      title: 'Trust that carries.',
      items: [
        {
          title: 'Rooted in Scripture & child-friendly',
          text: 'All content is rooted in the Bible and prepared in an age-appropriate way.',
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
          title: '3. Order on Amazon',
          text: 'One click takes you to the Amazon product page. Ordering, payment, shipping, and returns are handled there.',
        },
      ],
    },
    app: {
      eyebrow: 'The app',
      title: 'Experience the stories digitally',
      text: "In the free LambKing app, children discover stories that strengthen faith and bring God's good news to life – lovingly told and designed for kids. From there, it also leads back to the books.",
      ctaWebApp: 'Open the free web app',
      playSoon: 'Android app – coming soon to the Google Play Store',
      playAlt: 'Get it on Google Play',
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
    support: {
      title: 'Support LambKing Stories',
      text: 'If you enjoy LambKing Stories and would like to support the creation of more biblical stories and books, you can voluntarily support the project via PayPal or Ko-fi.',
      paypalAlt: 'Support the project with PayPal',
      kofiAlt: 'Support me on Ko-fi',
    },
    faq: {
      eyebrow: 'Frequently asked questions',
      title: 'Good to know',
      items: [
        {
          q: 'Where can I buy the books?',
          a: 'Each book page links to its Amazon product page. Ordering, payment, and shipping are handled by Amazon.',
        },
        {
          q: 'Does LambKing Stories sell the books directly through this website?',
          a: 'The books are presented on this website. The actual ordering and payment process takes place on the linked Amazon product page.',
        },
        {
          q: 'What age are the books suitable for?',
          a: 'The age recommendation is shown directly with each book – simply click “Look inside”.',
        },
        {
          q: 'How do shipping, returns, and cancellations work?',
          a: 'The terms of the Amazon sales platform apply. You can find all details on the respective Amazon product page.',
        },
        {
          q: 'Are the stories available digitally?',
          a: 'Yes! There is a free LambKing web app where children can experience the stories interactively. An Android app on the Google Play Store is also planned.',
        },
        {
          q: 'How can I support LambKing Stories?',
          a: 'If the project is close to your heart, you can voluntarily support it via PayPal or Ko-fi. Every bit of support helps make new books possible.',
        },
        {
          q: 'How can I get in touch?',
          a: 'You can reach me by email – I look forward to messages, feedback, and suggestions.',
        },
      ],
      webAppLink: 'Open the web app →',
      mailLink: 'hello@lambking.de',
    },
    footer: {
      tagline: "Bible-based coloring books and children's books – from a family for families.",
      rights: 'All rights reserved.',
      impressum: 'Imprint',
      datenschutz: 'Privacy Policy',
    },
  },
}

export type Texts = (typeof TEXTS)['de']

export function textsFor(lang: Lang): Texts {
  return TEXTS[lang]
}
