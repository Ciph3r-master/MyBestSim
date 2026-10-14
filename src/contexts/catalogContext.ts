import { createContext } from 'react'
import type { Catalog } from '@/types/catalog'
import type { RejectedFile } from '@/services/fileImport'

/**
 * - `merge` : les fichiers importés s'ajoutent au catalogue ; un fichier de même nom remplace l'ancien.
 * - `replace` : seuls les fichiers importés sont pris en compte.
 */
export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  mode: ImportMode
  imported: string[]
  rejected: RejectedFile[]
  /** Fichiers importés qui ont remplacé un fichier de même nom. */
  overwritten: string[]
}

/** Fichier chargé (d'origine ou importé), actif ou non. */
export interface LoadedFile {
  name: string
  enabled: boolean
  imported: boolean
  provider: string
  rowCount: number
}

export interface CatalogContextValue {
  /** Catalogue construit à partir des seuls fichiers activés. */
  catalog: Catalog
  /** Tous les fichiers chargés, y compris désactivés, triés par nom. */
  files: LoadedFile[]
  /** Active ou désactive un fichier : il est exclu de toutes les statistiques et contrôles, sans être supprimé. */
  toggleFile: (name: string) => void
  enableAllFiles: () => void
  /** `true` tant que le catalogue correspond aux fichiers d'origine, tous activés. */
  isDefault: boolean
  /** Noms des fichiers importés par l'utilisateur et actuellement chargés. */
  importedFiles: string[]
  importMode: ImportMode
  setImportMode: (mode: ImportMode) => void
  importFiles: (files: Iterable<File>) => Promise<ImportResult>
  lastImport: ImportResult | null
  dismissLastImport: () => void
  reset: () => void
}

export const CatalogContext = createContext<CatalogContextValue | null>(null)
