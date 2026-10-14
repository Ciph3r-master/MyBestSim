import { useEffect, useId, useMemo, useRef } from 'react'
import type { Product } from '@/types/catalog'
import type { ProductSelection } from '@/types/selection'
import { downloadCsv, productsToCsv } from '@/services/csvExport'
import { selections } from '@/services/selections'
import { formatCount } from '@/utils/format'
import { Icon } from '@/components/ui/Icon'
import { ProductSheet } from './ProductSheet'
import { ProductTable } from './ProductTable'
import { SelectionSummary } from './SelectionSummary'
import styles from './ProductDrawer.module.css'

interface ProductDrawerProps {
  selection: ProductSelection
  canGoBack: boolean
  products: Product[]
  marketProducts: Product[]
  scopeLabel: string | null
  onNavigate: (selection: ProductSelection) => void
  onBack: () => void
  onClose: () => void
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ProductDrawer({
  selection,
  canGoBack,
  products,
  marketProducts,
  scopeLabel,
  onNavigate,
  onBack,
  onClose,
}: ProductDrawerProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const selected = useMemo(() => products.filter(selection.filter), [products, selection])

  // Accessibilité : focus dans le panneau à l'ouverture, Échap pour fermer, Tab reste dans le panneau,
  // puis focus rendu à l'élément qui a ouvert le panneau. Le fond ne défile plus pendant l'ouverture.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [onClose])

  // Remonte en haut du panneau à chaque changement de vue (liste → fiche → retour).
  useEffect(() => {
    panelRef.current?.querySelector('[data-scroll]')?.scrollTo({ top: 0 })
  }, [selection])

  const exportCsv = () => {
    const date = new Date().toISOString().slice(0, 10)
    const scope = scopeLabel ? `-${scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : ''
    downloadCsv(productsToCsv(selected), `mybestsim-${selection.id}${scope}-${date}.csv`)
  }

  const product = selection.product ? selected[0] : undefined

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            {canGoBack && (
              <button type="button" className={styles.iconButton} onClick={onBack} aria-label="Retour à la liste">
                <Icon name="back" size={16} />
              </button>
            )}
            <div className={styles.titles}>
              <h2 id={titleId}>{selection.title}</h2>
              <p>
                {selection.product
                  ? selection.description
                  : formatCount(selected.length, 'produit')}
                {scopeLabel && <span className={styles.scope}>Filtre : {scopeLabel}</span>}
              </p>
            </div>
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fermer le détail">
              <Icon name="close" size={16} />
            </button>
          </div>
          {selection.description && !selection.product && <p className={styles.description}>{selection.description}</p>}
          <div className={styles.toolbar}>
            <button type="button" className={styles.export} onClick={exportCsv} disabled={selected.length === 0}>
              <Icon name="download" size={15} />
              Exporter en CSV
            </button>
            <span>Format fournisseur, réimportable dans le dashboard</span>
          </div>
        </header>

        <div className={styles.body} data-scroll>
          {selection.product ? (
            product ? (
              <ProductSheet product={product} marketProducts={marketProducts} onNavigate={onNavigate} />
            ) : (
              <p className={styles.empty}>Ce produit ne fait plus partie des données affichées.</p>
            )
          ) : (
            <>
              <SelectionSummary products={selected} />
              <ProductTable
                key={selection.id}
                products={selected}
                initialSort={selection.sort}
                onSelect={(p) => onNavigate(selections.product(p))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
