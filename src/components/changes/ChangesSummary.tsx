import type { ImportChanges } from '@/contexts/catalogContext'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { formatCount, formatNumber, formatSignedPercent } from '@/utils/format'
import { KpiCard } from '@/components/kpi/KpiCard'
import styles from './ChangesSummary.module.css'

const time = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function ChangesSummary({ changes }: { changes: ImportChanges }) {
  const { openDetail } = useProductDetail()
  const { diff, files, mode, at } = changes
  const addedSkus = new Set(diff.added.map((p) => p.sku))

  return (
    <>
      <p className={styles.context}>
        Import de {formatCount(files.length, 'fichier')} ({files.join(', ')}) à {time(at)} · mode{' '}
        {mode === 'merge' ? 'Ajouter' : 'Remplacer'} · comparé au catalogue affiché juste avant ·{' '}
        {formatCount(diff.unchangedCount, 'produit inchangé', 'produits inchangés')}
      </p>
      <div className={styles.grid}>
        <KpiCard
          icon="upload"
          label="Ajoutés"
          value={formatNumber(diff.added.length)}
          hint="nouveaux SKU"
          onSelect={
            diff.added.length
              ? () => openDetail(selections.skus('produits-ajoutes', 'Produits ajoutés par l’import', addedSkus))
              : undefined
          }
        />
        <KpiCard icon="close" label="Retirés" value={formatNumber(diff.removed.length)} hint="SKU absents de la nouvelle version" />
        <KpiCard icon="chart" label="Hausses de prix" value={formatNumber(diff.increases.length)} hint="même SKU, même devise" />
        <KpiCard icon="chart" label="Baisses de prix" value={formatNumber(diff.decreases.length)} hint="même SKU, même devise" />
        <KpiCard
          icon="euro"
          label="Variation moyenne"
          value={diff.averageChange == null ? '—' : formatSignedPercent(diff.averageChange, 1)}
          hint="sur les prix modifiés"
        />
        <KpiCard icon="file" label="Autres modifications" value={formatNumber(diff.modified.length)} hint="réseau, recharge, volume…" />
      </div>
    </>
  )
}
