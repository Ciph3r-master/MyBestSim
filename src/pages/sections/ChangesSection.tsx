import type { ImportChanges } from '@/contexts/catalogContext'
import { ChangesSummary } from '@/components/changes/ChangesSummary'
import {
  FieldChangesTable,
  PriceChangesTable,
  ProductChangesList,
  ProviderChangesTable,
} from '@/components/changes/ChangesTables'
import styles from './sections.module.css'

export function ChangesSection({ changes }: { changes: ImportChanges }) {
  const { diff } = changes
  const priceChanges = [...diff.increases, ...diff.decreases].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  return (
    <>
      <ChangesSummary changes={changes} />
      <div className={styles.grid}>
        <ProviderChangesTable providers={diff.byProvider} />
        <PriceChangesTable changes={priceChanges} />
        <ProductChangesList
          title="Produits ajoutés"
          subtitle="Nouveaux SKU · cliquez pour la fiche"
          products={diff.added}
          linkable
          empty="Aucun produit ajouté."
        />
        <ProductChangesList
          title="Produits retirés"
          subtitle="Absents de la nouvelle version"
          products={diff.removed}
          linkable={false}
          empty="Aucun produit retiré."
        />
        <FieldChangesTable changes={diff.modified} />
      </div>
    </>
  )
}
