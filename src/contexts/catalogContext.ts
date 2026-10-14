import { createContext } from 'react'
import type { Catalog } from '@/types/catalog'
import type { RejectedFile } from '@/services/fileImport'

import type { ImportMode } from '@/services/catalogSource'
import type { CatalogDiff } from '@/services/catalogDiff'

export type { ImportMode }

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

/** Changements apportés par le dernier import (catalogue avant / après). */
export interface ImportChanges {
  diff: CatalogDiff
  files: string[]
  mode: ImportMode
  at: Date
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
  /** Conservé jusqu'au prochain import ou à la réinitialisation (contrairement au message d'import). */
  lastChanges: ImportChanges | null
  dismissLastImport: () => void
  reset: () => void
}

export const CatalogContext = createContext<CatalogContextValue | null>(null)
