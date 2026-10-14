import type { LoadedFile } from '@/contexts/catalogContext'
import type { FileQuality } from '@/types/quality'
import { formatNumber } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Switch } from '@/components/ui/Switch'
import styles from './FileQualityTable.module.css'

export const FILES_PANEL_ID = 'fichiers'

interface FileQualityTableProps {
  /** Tous les fichiers chargés, actifs ou non. */
  files: LoadedFile[]
  /** Résultat qualité des fichiers actifs. */
  quality: FileQuality[]
  onToggle: (name: string) => void
  onEnableAll: () => void
}

export function FileQualityTable({ files, quality, onToggle, onEnableAll }: FileQualityTableProps) {
  const qualityByName = new Map(quality.map((q) => [q.fileName, q]))
  const disabledCount = files.filter((f) => !f.enabled).length

  return (
    <Panel
      id={FILES_PANEL_ID}
      title="Détail par fichier"
      subtitle="Désactivez un fichier pour l’exclure des statistiques et des contrôles, sans le supprimer"
      wide
    >
      {disabledCount > 0 && (
        <p className={styles.disabledNote}>
          {disabledCount} fichier{disabledCount > 1 ? 's' : ''} désactivé{disabledCount > 1 ? 's' : ''} ·{' '}
          <button type="button" onClick={onEnableAll}>
            Tout réactiver
          </button>
        </p>
      )}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Inclus</th>
              <th>Fichier</th>
              <th>Fournisseur</th>
              <th className={styles.num}>Lignes</th>
              <th className={styles.num}>Valides</th>
              <th>Statut</th>
              <th>Remarques</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const q = file.enabled ? qualityByName.get(file.name) : undefined
              return (
                <tr key={file.name} className={file.enabled ? '' : styles.disabledRow}>
                  <td>
                    <Switch
                      checked={file.enabled}
                      onChange={() => onToggle(file.name)}
                      label={`${file.enabled ? 'Désactiver' : 'Activer'} ${file.name}`}
                    />
                  </td>
                  <td className={styles.file}>
                    {file.name}
                    {file.imported && <span className={styles.tag}>importé</span>}
                  </td>
                  <td>{file.provider}</td>
                  <td className={styles.num}>{formatNumber(file.rowCount)}</td>
                  <td className={styles.num}>{q ? formatNumber(q.validCount) : '-'}</td>
                  <td>{q ? <StatusBadge status={q.status} /> : <span className={styles.off}>Désactivé</span>}</td>
                  <td className={styles.issues}>
                    {!q
                      ? 'exclu des statistiques et des contrôles'
                      : q.issues.length === 0
                        ? '-'
                        : q.issues.map((issue) => (
                            <span key={issue.text} className={`${styles.issue} ${styles[issue.status]}`}>
                              {issue.text}
                            </span>
                          ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
