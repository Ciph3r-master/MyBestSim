import { useMemo } from 'react'
import type { Product } from '@/types/catalog'
import type { ProductSelection } from '@/types/selection'
import { dataTierLabel } from '@/services/catalogStats'
import { classifyDestination } from '@/services/destinations'
import { productInsight, selections } from '@/services/selections'
import { formatPrice, formatSignedPercent } from '@/utils/format'
import styles from './ProductSheet.module.css'

interface ProductSheetProps {
  product: Product
  /** Catalogue complet : référence pour situer le produit sur le marché. */
  marketProducts: Product[]
  onNavigate: (selection: ProductSelection) => void
}

export function ProductSheet({ product: p, marketProducts, onNavigate }: ProductSheetProps) {
  const insight = useMemo(() => productInsight(p, marketProducts), [p, marketProducts])
  const destination = classifyDestination(p.countryCode, p.countryName)

  const fields: [string, string][] = [
    ['Fournisseur', p.provider],
    [
      'Destination',
      `${p.countryName} (${p.countryCode})${destination.kind === 'country' ? '' : ' · zone multi-pays'}`,
    ],
    ['Volume', dataTierLabel(p)],
    ['Durée', `${p.validityDays} jours`],
    ['Prix', formatPrice(p.price, p.currency)],
    ['Prix au Go', p.dataGb ? formatPrice(p.price / p.dataGb, p.currency) : '— (illimité)'],
    ['Réseau', p.network],
    ['Rechargeable', p.topUp ? 'Oui' : 'Non'],
    ['SKU', p.sku],
    ['Fichier source', p.sourceFile],
  ]

  return (
    <div className={styles.sheet}>
      {insight ? (
        <section className={styles.insight} aria-label="Position sur le marché">
          <div>
            <strong className={insight.gapToMedian <= 0 ? styles.cheaper : styles.pricier}>
              {formatSignedPercent(insight.gapToMedian)}
            </strong>
            <span>vs prix médian des offres comparables</span>
          </div>
          <div>
            <strong>
              {insight.destinationRank}
              <small>/{insight.destinationCount}</small>
            </strong>
            <span>pour {p.countryName} à volume et durée égaux</span>
          </div>
          <div>
            <strong>
              {insight.rank}
              <small>/{insight.comparableCount}</small>
            </strong>
            <span>parmi toutes les destinations {destination.kind === 'country' ? 'pays' : 'zones'} comparables</span>
          </div>
        </section>
      ) : (
        <p className={styles.notice}>
          Prix en {p.currency || 'devise inconnue'} : non comparé au marché (les indicateurs de prix sont en EUR).
        </p>
      )}

      <dl className={styles.fields}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.actions}>
        {insight && (
          <button type="button" onClick={() => onNavigate(selections.comparable(p))}>
            Voir les {insight.comparableCount} offres comparables
          </button>
        )}
        <button type="button" onClick={() => onNavigate(selections.destination(p.countryName))}>
          Toutes les offres · {p.countryName}
        </button>
        <button type="button" onClick={() => onNavigate(selections.provider(p.provider))}>
          Tous les produits {p.provider}
        </button>
      </div>
    </div>
  )
}
