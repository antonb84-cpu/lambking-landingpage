import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useLang } from '@/data/lang'

// Ruhiges, stummes Video. Es läuft nur, solange es im Bild ist, und startet am Ende
// sanft neu (ein Schleier blendet kurz darüber, das Video selbst bleibt immer sichtbar).
// Jedes Video hat einen Play/Pause-Knopf: Browser im Energiesparmodus oder mit
// abgeschalteten System-Animationen starten Videos nicht von selbst – dann genügt ein Klick.
// Der Elternbereich muss `relative` sein (der Knopf sitzt unten rechts darin).
export default function LoopVideo({
  src,
  poster,
  label,
  className = '',
  eager = false,
  manual = false,
}: {
  src: string
  poster: string
  label: string
  className?: string
  eager?: boolean
  /** true: Standbild mit Play-Knopf, das Video wird erst beim Antippen geladen und gestartet */
  manual?: boolean
}) {
  const lang = useLang()
  const ref = useRef<HTMLVideoElement>(null)
  const [veil, setVeil] = useState(false)
  const [playing, setPlaying] = useState(false)
  const userPaused = useRef(false)
  const reduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!manual && !userPaused.current && !reduced.current) void video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [manual])

  const toggle = () => {
    const video = ref.current
    if (!video) return
    if (video.paused) {
      userPaused.current = false
      reduced.current = false
      void video.play().catch(() => undefined)
    } else {
      userPaused.current = true
      video.pause()
    }
  }

  const restart = () => {
    setVeil(true)
    window.setTimeout(() => {
      const video = ref.current
      if (video) {
        video.currentTime = 0
        void video.play().catch(() => undefined)
      }
      setVeil(false)
    }, 600)
  }

  const de = lang !== 'en'
  return (
    <>
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster}
        muted
        playsInline
        preload={eager ? 'auto' : 'none'}
        onEnded={manual ? undefined : restart}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        role="img"
        aria-label={label}
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background"
        style={{ opacity: veil ? 0.9 : 0, transition: 'opacity 600ms ease-in-out' }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? (de ? 'Video anhalten' : 'Pause video') : de ? 'Video abspielen' : 'Play video'}
        className={`absolute z-10 flex items-center justify-center rounded-full bg-background/85 text-primary shadow-md backdrop-blur transition hover:bg-background ${
          manual && !playing ? 'inset-0 m-auto h-14 w-14' : 'bottom-3 right-3 h-10 w-10'
        } ${playing ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
      </button>
    </>
  )
}
