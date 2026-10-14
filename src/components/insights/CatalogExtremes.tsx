import type { Product } from '@/types/catalog'
import { formatCurrency } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import styles from './CatalogExtremes.module.css'

interface ExtremeCardProps {
  tag: string
  product: Product
  tone: 'low' | 'high'
}

function ExtremeCard({ tag, product, tone }: ExtremeCardProps) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.tag}>{tag}</span>
      <strong className={styles.price}>{formatCurrency(product.price)}</strong>
      <span className={styles.name}>{product.productName}</span>
      <small className={styles.meta}>
        {product.provider} · {product.network} · {product.validityDays} j
      </small>
    </article>
  )
}

interface CatalogExtremesProps {
  cheapest: Product | null
  priciest: Product | null
}

export function CatalogExtremes({ cheapest, priciest }: CatalogExtremesProps) {
  return (
    <Panel title="Extrêmes du catalogue" subtitle="Produit le moins cher et le plus cher">
      {cheapest && priciest ? (
        <div className={styles.grid}>
          <ExtremeCard tag="Moins cher" product={cheapest} tone="low" />
          <ExtremeCard tag="Plus cher" product={priciest} tone="high" />
        </div>
      ) : (
        <PanelEmpty>Aucun produit en EUR : indicateur de prix indisponible.</PanelEmpty>
      )}
    </Panel>
  )
}
