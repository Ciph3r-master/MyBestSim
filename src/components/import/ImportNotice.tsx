import { useCatalog } from '@/hooks/useCatalog'
import { formatCount } from '@/utils/format'
import { Icon } from '@/components/ui/Icon'
import styles from './ImportNotice.module.css'

interface ImportNoticeProps {
  /** Nombre d'alertes qualité (avertissements + erreurs) sur le catalogue chargé. */
  qualityAlerts: number
  onShowQuality: () => void
  onShowChanges: () => void
}

/** « 1 fichier mis à jour », « 2 fichiers ajoutés », « 1 fichier chargé »… selon ce que l'import a fait. */
function headline(mode: 'merge' | 'replace', imported: number, overwritten: number): string {
  if (mode === 'replace') return formatCount(imported, 'fichier chargé', 'fichiers chargés')
  if (overwritten === imported) return formatCount(imported, 'fichier mis à jour', 'fichiers mis à jour')
  return formatCount(imported, 'fichier ajouté', 'fichiers ajoutés')
}

/** Compte rendu du dernier import : fichiers chargés, refusés, et lien vers la qualité. */
export function ImportNotice({ qualityAlerts, onShowQuality, onShowChanges }: ImportNoticeProps) {
  const { lastImport, lastChanges, dismissLastImport } = useCatalog()
  if (!lastImport) return null

  const { imported, rejected, overwritten, mode } = lastImport
  const success = imported.length > 0
  const tone = !success ? styles.error : rejected.length || qualityAlerts ? styles.warning : styles.ok

  return (
    <div className={`${styles.notice} ${tone}`} role="status">
      <Icon name={success ? 'check' : 'alert'} size={18} />
      <div className={styles.body}>
        {success ? (
          <p>
            <strong>{headline(mode, imported.length, overwritten.length)}</strong>
            {mode === 'replace' && ' (catalogue remplacé)'}
            {overwritten.length > 0 && overwritten.length < imported.length && ` · dont ${overwritten.join(', ')} mis à jour`}
            {' · '}
            {lastChanges?.diff.hasChanges ? (
              <button type="button" className={styles.link} onClick={onShowChanges}>
                voir les changements
              </button>
            ) : (
              'aucun changement de produit'
            )}
            {' · '}
            {qualityAlerts > 0 ? (
              <button type="button" className={styles.link} onClick={onShowQuality}>
                {formatCount(qualityAlerts, 'point qualité', 'points qualité')} à vérifier
              </button>
            ) : (
              'contrôles qualité OK'
            )}
          </p>
        ) : (
          <p>
            <strong>Aucun fichier importé.</strong>
          </p>
        )}
        {rejected.length > 0 && (
          <p className={styles.rejected}>
            {formatCount(rejected.length, 'fichier refusé', 'fichiers refusés')} :{' '}
            {rejected.map((r) => `${r.name} (${r.reason})`).join(', ')}
          </p>
        )}
      </div>
      <button type="button" className={styles.close} onClick={dismissLastImport} aria-label="Fermer">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}
