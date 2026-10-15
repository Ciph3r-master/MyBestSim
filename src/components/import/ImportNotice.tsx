import { useCatalog } from '@/hooks/useCatalog'
import type { FileReplacement } from '@/services/catalogSource'
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
function headline(mode: 'merge' | 'replace', imported: number, updates: number): string {
  if (mode === 'replace') return formatCount(imported, 'fichier chargé', 'fichiers chargés')
  if (updates === imported) return formatCount(imported, 'fichier mis à jour', 'fichiers mis à jour')
  return formatCount(imported, 'fichier ajouté', 'fichiers ajoutés')
}

/** « airalo_2026-10-15.csv remplace airalo.csv (Airalo) » ; une mise à jour sous le même nom n'est pas détaillée. */
function describeReplacement({ file, replaces, provider }: FileReplacement): string | null {
  const others = replaces.filter((name) => name !== file)
  if (!others.length) return null
  return `${file} remplace ${others.join(', ')}${provider ? ` (${provider})` : ''}`
}

/** Compte rendu du dernier import : fichiers chargés, refusés, et lien vers la qualité. */
export function ImportNotice({ qualityAlerts, onShowQuality, onShowChanges }: ImportNoticeProps) {
  const { lastImport, lastChanges, dismissLastImport } = useCatalog()
  if (!lastImport) return null

  const { imported, rejected, replacements, mode } = lastImport
  const details = replacements.map(describeReplacement).filter(Boolean)
  const success = imported.length > 0
  const tone = !success ? styles.error : rejected.length || qualityAlerts ? styles.warning : styles.ok

  return (
    <div className={`${styles.notice} ${tone}`} role={lastImport.error ? 'alert' : 'status'}>
      <Icon name={success ? 'check' : 'alert'} size={18} />
      <div className={styles.body}>
        {success ? (
          <p>
            <strong>{headline(mode, imported.length, replacements.length)}</strong>
            {mode === 'replace' && ' (catalogue remplacé)'}
            {details.length > 0 && ` · ${details.join(' · ')}`}
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
            {lastImport.error && ` L’import a échoué : ${lastImport.error}. Le catalogue n’a pas été modifié.`}
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
