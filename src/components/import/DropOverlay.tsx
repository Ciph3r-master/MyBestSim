import { useCatalog } from '@/hooks/useCatalog'
import { useWindowFileDrop } from '@/hooks/useWindowFileDrop'
import { Icon } from '@/components/ui/Icon'
import styles from './DropOverlay.module.css'

/** Zone de dépôt plein écran, visible uniquement pendant un glisser-déposer de fichiers. */
export function DropOverlay() {
  const { importFiles, importMode } = useCatalog()
  const isDragging = useWindowFileDrop((files) => void importFiles(files))

  if (!isDragging) return null

  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.target}>
        <span className={styles.icon}>
          <Icon name="upload" size={40} />
        </span>
        <p className={styles.title}>Déposez vos fichiers CSV</p>
        <p className={styles.hint}>
          {importMode === 'merge'
            ? 'Ils seront ajoutés au catalogue (un fichier de même nom remplace l’ancien).'
            : 'Ils remplaceront l’ensemble du catalogue actuel.'}
        </p>
        <p className={styles.privacy}>Traitement 100 % local : aucun fichier n’est envoyé sur Internet.</p>
      </div>
    </div>
  )
}
