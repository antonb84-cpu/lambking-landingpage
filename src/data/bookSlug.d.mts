export function splitTitle(book: { title: string; series?: string }): { main: string; sub?: string }
export function slugify(text: string): string
export function bookSlugs(books: { id: string; title: string; series?: string }[]): Record<string, string>
