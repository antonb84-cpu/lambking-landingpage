import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

function KofiCup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" fill="#FF5E5B" stroke="none" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" stroke="#20242e" />
      <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" stroke="#20242e" />
      <path d="M7.5 4.5c0 1 .8 1.2.8 2M10.5 3.5c0 1 .8 1.2.8 2" stroke="#20242e" />
    </svg>
  )
}

export default function KofiButton({ compact = false }: { compact?: boolean }) {
  const t = textsFor(useLang())
  if (!SITE.kofiUrl) return null

  return (
    <a
      href={SITE.kofiUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.support.kofiAlt}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[#20242e]/15 bg-[#FFF8F0] font-bold text-[#20242e] shadow-sm transition-transform hover:scale-[1.05] ${
        compact ? 'h-10 gap-1.5 px-3 text-xs' : 'h-[45px] w-[240px] gap-2 px-4 text-sm'
      }`}
    >
      <KofiCup className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      <span className={compact ? 'hidden min-[1180px]:inline' : undefined}>{compact ? 'Ko-fi' : t.support.kofiAlt}</span>
    </a>
  )
}
