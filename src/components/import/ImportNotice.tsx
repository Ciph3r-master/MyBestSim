import { useCatalog } from '@/hooks/useCatalog'
import { formatCount } from '@/utils/format'
import { Icon } from '@/components/ui/Icon'
import styles from './ImportNotice.module.css'

interface ImportNoticeProps {
  /** Nombre d'alertes qualité (avertissements + erreurs) sur le catalogue chargé. */
  qualityAlerts: number
  onShowQuality: () => void
}

/** Compte rendu du dernier import : fichiers chargés, refusés, et lien vers la qualité. */
export function ImportNotice({ qualityAlerts, onShowQuality }: ImportNoticeProps) {
  const { lastImport, dismissLastImport } = useCatalog()
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
            <strong>
              {mode === 'merge'
                ? formatCount(imported.length, 'fichier ajouté', 'fichiers ajoutés')
                : formatCount(imported.length, 'fichier chargé', 'fichiers chargés')}
            </strong>
            {mode === 'replace' && ' (catalogue remplacé)'}
            {overwritten.length > 0 && ` · ${overwritten.join(', ')} mis à jour`}
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
