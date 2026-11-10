import { isMiddleClick, trackLinkClick } from '@/data/analytics'
import { SITE } from '@/data/books'
import { useLang } from '@/data/lang'
import { textsFor } from '@/data/texts'

// Die beiden Store-Knöpfe (Google Play, App Store): im App-Bereich und oben im Titelbereich.
// `onlyLinks`: Knöpfe ohne Link werden weggelassen statt als „folgt“ gezeigt (für den Titelbereich).
export default function StoreBadges({ onlyLinks = false, className = '' }: { onlyLinks?: boolean; className?: string }) {
  const t = textsFor(useLang())
  const hasPlayStoreLink = SITE.playStoreUrl.startsWith('https://')
  const hasAppStoreLink = SITE.iosStoreUrl.startsWith('https://')
  if (onlyLinks && !hasPlayStoreLink && !hasAppStoreLink) return null

  const playBadge = (
    <span className="relative block h-11 w-[132px] overflow-hidden rounded-[7px] sm:h-12 sm:w-36">
      <img
        src="images/buttons/google-play.png"
        alt={t.app.playAlt}
        className="absolute left-1/2 top-1/2 h-[55px] max-w-none -translate-x-1/2 -translate-y-1/2 sm:h-[60px]"
      />
    </span>
  )

  const appStoreBadge = (
    <span className="flex h-11 w-[132px] items-center justify-center sm:h-12 sm:w-36">
      <img src="images/buttons/app-store.svg" alt={t.app.appStoreAlt} className="h-11 w-auto sm:h-12" />
    </span>
  )

  return (
    <div className={`flex flex-wrap items-start gap-3 sm:gap-4 ${className}`}>
      {hasPlayStoreLink ? (
        <a
          href={SITE.playStoreUrl}
          onClick={() => trackLinkClick('playstore')}
          onAuxClick={(event) => isMiddleClick(event) && trackLinkClick('playstore')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform hover:scale-[1.04]"
          aria-label={t.app.playAlt}
        >
          {playBadge}
        </a>
      ) : onlyLinks ? null : (
        <div className="w-[132px] sm:w-36">
          {playBadge}
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.app.playSoon}</p>
        </div>
      )}
      {hasAppStoreLink ? (
        <a
          href={SITE.iosStoreUrl}
          onClick={() => trackLinkClick('appstore')}
          onAuxClick={(event) => isMiddleClick(event) && trackLinkClick('appstore')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform hover:scale-[1.04]"
          aria-label={t.app.appStoreAlt}
        >
          {appStoreBadge}
        </a>
      ) : onlyLinks ? null : (
        <div className="w-[132px] sm:w-36" aria-disabled="true">
          <span className="block opacity-45 grayscale">{appStoreBadge}</span>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.app.appStoreSoon}</p>
        </div>
      )}
    </div>
  )
}
