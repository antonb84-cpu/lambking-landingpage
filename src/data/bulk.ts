// Mengenrabatt für Gruppen (Kinderstunde, Schule, Gemeinde) – wird im Buchfenster und im Gruppen-Bereich gezeigt.
export const BULK_DISCOUNT_TIERS = [
  { quantity: 10, discount: 15 },
  { quantity: 25, discount: 25 },
  { quantity: 50, discount: 35 },
  { quantity: 100, discount: 40 },
] as const
