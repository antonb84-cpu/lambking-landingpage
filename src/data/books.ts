// ─────────────────────────────────────────────────────────────
// Zentrale Konfiguration der Landingpage
// Diese Datei wird vom Admin-Programm automatisch erzeugt.
// Änderungen bitte im Admin-Programm vornehmen (ADMIN-STARTEN.bat).
// ─────────────────────────────────────────────────────────────

export const SITE = {
  brand: "LambKing Stories",
  appUrl: "https://konstantinsteinmiller.github.io/little-bible-stories/#/app",
  // Google-Play-Link hier eintragen, sobald die App im Store ist.
  // Solange das Feld leer ist, führt der Download-Button zur Web-App.
  playStoreUrl: "",
  paypalUrl: "https://www.paypal.com/ncp/payment/DWHKRPTCU6N3W",
  authorPhoto: "/images/autor.jpg",
  authorName: "Anton Bernt",
  // Foto-Darstellung – im Admin-Programm einstellbar.
  authorPhotoShape: 'rund' as const,
  authorPhotoSize: 'klein' as const,
  // Impressum & Datenschutz – im Admin-Programm bearbeitbar.
  impressum: "Angaben gemäß § 5 TMG / DDG\n\nAnton Bernt\nLambKing Stories\n[Straße und Hausnummer]\n[PLZ und Ort]\n\nKontakt\nE-Mail: [deine@email.de]\n\nVerantwortlich für den Inhalt nach § 18 Abs. 2 MStV\nAnton Bernt, Anschrift wie oben",
  datenschutz: "Datenschutzerklärung\n\n1. Verantwortlicher\nAnton Bernt, LambKing Stories, [Straße und Hausnummer], [PLZ und Ort], E-Mail: [deine@email.de]\n\n2. Erhebung und Speicherung personenbezogener Daten\nDiese Website speichert selbst keine personenbezogenen Daten und setzt keine Cookies. Beim Aufruf der Seite werden durch den Hosting-Anbieter technisch notwendige Server-Logfiles (z. B. IP-Adresse, Datum und Uhrzeit) verarbeitet.\n\n3. Externe Dienste\nBeim Klick auf Kauf-Buttons (Amazon, TikTok Shop), den PayPal-Spendenbutton oder den Google-Play-Button verlassen Sie diese Website. Es gelten die Datenschutzerklärungen der jeweiligen Anbieter.\n\n4. Ihre Rechte\nSie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.",
}

export type Category = 'geschichten' | 'malbuecher' | 'komics'

export const CATEGORIES: { id: Category; label: string; emptyHint: string }[] = [
  { id: 'geschichten', label: 'Geschichten', emptyHint: '' },
  { id: 'malbuecher', label: 'Malbücher', emptyHint: '' },
  {
    id: 'komics',
    label: 'Comics',
    emptyHint: 'Hier entstehen gerade biblische Comic-Abenteuer – schau bald wieder vorbei!',
  },
]

export interface Book {
  id: string
  /** Sprache der Buchausgabe */
  lang: 'de' | 'en'
  title: string
  series?: string
  category: Category
  type: 'Malbuch' | 'Kinderbuch' | 'Comic'
  age: string
  detail: string
  price?: string
  cover: string
  description: string
  highlights: string[]
  samples: string[]
  amazon: string
  tiktok?: string
  /** ISO-Datum 'YYYY-MM-DD' der Veröffentlichung – das „Neu"-Badge
      erscheint automatisch für 30 Tage ab diesem Datum. */
  releaseDate?: string
  rating?: string
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

/** true, wenn das Buch vor weniger als 30 Tagen veröffentlicht wurde */
export function isNew(book: Book): boolean {
  if (!book.releaseDate) return false
  const released = new Date(`${book.releaseDate}T00:00:00`).getTime()
  const diff = Date.now() - released
  return diff >= 0 && diff < THIRTY_DAYS
}

export const BOOKS: Book[] = [
  {
    id: 'schoepfung',
    lang: 'de',
    title: "Die Schöpfung – Gott macht die Welt",
    series: "Bibelgeschichten zum Ausmalen · Band 1",
    category: 'malbuecher',
    type: 'Malbuch',
    age: "Ab 5 Jahren",
    detail: "25 Ausmalbilder",
    price: "11,99 €",
    cover: '/images/cover-schoepfung.jpg',
    description: "Von Licht, Himmel, Land und Meer über Pflanzen, Sonne, Sterne und Tiere bis hin zu Adam und Eva im Garten Eden: 25 liebevoll gestaltete Ausmalbilder mit klaren Linien erzählen die biblische Schöpfungsgeschichte Schritt für Schritt (1. Mose 1–3) und laden zum Malen, Entdecken und Erzählen ein.",
    highlights: ["25 große, klare Motive", "Biblisch fundiert", "Ideal für Familie & Kindergottesdienst"],
    samples: [
      '/images/schoepfung-seite-gehoert.jpg',
      '/images/schoepfung-seite-geschichte.jpg',
      '/images/schoepfung-seite-1.jpg',
      '/images/schoepfung-seite-2.jpg',
      '/images/schoepfung-seite-3.jpg',
      '/images/schoepfung-seite-4.jpg',
    ],
    amazon: "https://www.amazon.de/dp/B0HFWX8DH5",
    tiktok: "",
  },
  {
    id: 'david',
    lang: 'de',
    title: "David und Goliath – Ein Malbuch für kleine Helden",
    series: "Bibelgeschichten zum Ausmalen · Band 6",
    category: 'malbuecher',
    type: 'Malbuch',
    age: "6–10 Jahre",
    detail: "35 Seiten",
    price: "11,95 €",
    cover: '/images/cover-david.jpg',
    description: "Begleite David auf seinem Weg vom Hirtenjungen zum mutigen Helden. Kindgerechte Ausmalbilder und einfache Begleittexte greifen Themen wie Mut, Vertrauen und Glauben auf – ideal für Kinder, Familien, Sonntagsschule und kreative Bibelstunden.",
    highlights: ["Große, klare Motive", "Themen: Mut, Vertrauen, Glauben", "Taschenbuch · 21,6 × 27,9 cm"],
    samples: [
      '/images/david-seite-gehoert.jpg',
      '/images/david-seite-geschichte.jpg',
      '/images/david-seite-1.jpg',
      '/images/david-seite-2.jpg',
      '/images/david-seite-3.jpg',
      '/images/david-seite-4.jpg',
    ],
    amazon: "https://www.amazon.de/dp/B0H33VYPY7",
    tiktok: "",
    releaseDate: '2026-08-20',
  },
  {
    id: 'zachaeus',
    lang: 'de',
    title: "Der Mann im Baum – Zachäus begegnet Jesus",
    series: "Bilderbuch",
    category: 'geschichten',
    type: 'Kinderbuch',
    age: "6–12 Jahre",
    detail: "29 Seiten · auch als eBook",
    price: "10,95 €",
    cover: '/images/cover-zachaeus.jpg',
    description: "Zachäus ist klein, aber seine Gier ist groß – bis Jesus in die Stadt kommt und ihn beim Namen ruft. Diese liebevoll illustrierte Geschichte (Lukas 19,1–10) zeigt Kindern auf farbenfrohe Weise: Jesus schenkt jedem Vergebung, Frieden und eine neue Chance.",
    highlights: ["Farbenfroh illustriert", "Bibeltreu & kindgerecht", "Taschenbuch & Kindle"],
    samples: [],
    amazon: "https://www.amazon.de/dp/B0G9MDSJVL",
    tiktok: "",
    rating: "5,0 von 5",
  },
]

export const COMING_SOON = [
  "Noah und die Arche",
  "Abraham vertraut Gott",
  "Josef und seine Brüder",
  "Mose",
  "Daniel in der Löwengrube",
  "Jona und der große Fisch",
  "Die Weihnachtsgeschichte",
  "Ostern: Jesus lebt!",
  "Die Wunder von Jesus",
]
