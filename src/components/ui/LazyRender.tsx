import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'

interface LazyRenderProps {
  /** Hauteur réservée : identique à celle du contenu, pour qu'il n'y ait aucun saut de mise en page. */
  height: number
  children: ReactNode
}

/**
 * Ne construit son contenu (un graphique, coûteux) qu'à l'approche de la zone visible.
 * Au chargement, seuls les éléments à l'écran sont rendus : la page devient utilisable plus vite.
 * Le contenu peut aussi être un composant chargé à la demande (React.lazy).
 */
export function LazyRender({ height, children }: LazyRenderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (visible || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  const placeholder = <div ref={ref} style={{ height }} aria-hidden />
  // Le contenu peut lui-même être chargé à la demande (React.lazy) : même emplacement réservé pendant ce temps.
  return visible ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder
}
