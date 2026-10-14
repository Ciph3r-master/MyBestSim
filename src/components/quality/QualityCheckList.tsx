import type { QualityCategory, QualityCheck } from '@/types/quality'
import { Panel } from '@/components/ui/Panel'
import { QualityCheckItem } from './QualityCheckItem'
import styles from './QualityCheckList.module.css'

const CATEGORIES: { id: QualityCategory; subtitle: string }[] = [
  { id: 'Structure', subtitle: 'Format des fichiers et lignes exploitables' },
  { id: 'Unicité', subtitle: 'Doublons et variantes de produits' },
  { id: 'Cohérence', subtitle: 'Concordance entre les colonnes' },
  { id: 'Prix', subtitle: 'Valeurs atypiques et règles de calcul' },
]

export function QualityCheckList({ checks }: { checks: QualityCheck[] }) {
  return (
    <>
      {CATEGORIES.map(({ id, subtitle }) => {
        const items = checks.filter((c) => c.category === id)
        if (!items.length) return null
        return (
          <Panel key={id} title={id} subtitle={subtitle}>
            <ul className={styles.list}>
              {items.map((check) => (
                <QualityCheckItem key={check.id} check={check} />
              ))}
            </ul>
          </Panel>
        )
      })}
    </>
  )
}
