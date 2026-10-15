import { useRef } from 'react'
import { useCatalog } from '@/hooks/useCatalog'
import { formatCount } from '@/utils/format'
import { GlassCard } from '@/components/ui/GlassCard'
import { Icon } from '@/components/ui/Icon'
import type { ImportMode } from '@/contexts/catalogContext'
import styles from './DataSourceBar.module.css'

const MODES: { id: ImportMode; label: string; title: string }[] = [
  { id: 'merge', label: 'Ajouter', title: 'Ajouter au catalogue actuel (un fichier d’un fournisseur déjà présent remplace son ancienne version)' },
  { id: 'replace', label: 'Remplacer', title: 'Remplacer tout le catalogue par les fichiers importés' },
]

interface DataSourceBarProps {
  /** Ouvre la liste des fichiers (activation / désactivation). */
  onManageFiles: () => void
}

export function DataSourceBar({ onManageFiles }: DataSourceBarProps) {
  const { catalog, files, isDefault, importedFiles, importMode, setImportMode, importFiles, reset } = useCatalog()
  const inputRef = useRef<HTMLInputElement>(null)

  const imported = importedFiles.length
  const disabledCount = files.length - catalog.fileCount
  const origin =
    imported === 0
      ? `${formatCount(files.length, 'fichier')} d’origine`
      : imported === files.length
        ? formatCount(imported, 'fichier importé', 'fichiers importés')
        : `${formatCount(files.length, 'fichier')} dont ${formatCount(imported, 'importé')}`
  const description = disabledCount > 0 ? `${origin} · ${catalog.fileCount} actif${catalog.fileCount > 1 ? 's' : ''}` : origin

  return (
    <GlassCard className={styles.bar}>
      <div className={styles.source}>
        <span className={`${styles.icon} ${isDefault ? '' : styles.custom}`}>
          <Icon name="file" size={18} />
        </span>
        <div>
          <p className={styles.title}>
            Source : {description} · {formatCount(catalog.products.length, 'produit')}
          </p>
          <p className={styles.hint}>
            Glissez-déposez des CSV n’importe où sur la page · traitement 100 % local, rien n’est envoyé
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.modes} role="radiogroup" aria-label="Mode d’import">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={importMode === mode.id}
              title={mode.title}
              className={importMode === mode.id ? styles.modeActive : styles.mode}
              onClick={() => setImportMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <button type="button" className={styles.secondary} onClick={onManageFiles}>
          <Icon name="file" size={16} />
          Gérer les fichiers
          {disabledCount > 0 && <span className={styles.badge}>{disabledCount} off</span>}
        </button>

        <button type="button" className={styles.primary} onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={16} />
          Importer des CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void importFiles([...e.target.files])
            // Permet de réimporter le même fichier après modification.
            e.target.value = ''
          }}
        />

        {!isDefault && (
          <button type="button" className={styles.secondary} onClick={reset}>
            <Icon name="reset" size={16} />
            Données d’origine
          </button>
        )}
      </div>
    </GlassCard>
  )
}
