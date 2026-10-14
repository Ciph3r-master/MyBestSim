/**
 * État des fichiers chargés dans le dashboard (d'origine, importés, désactivés) et ses transitions.
 * Fonctions pures, sans React : le CatalogProvider ne fait que les appeler.
 */

/**
 * - `merge` : les fichiers importés s'ajoutent ; un fichier de même nom remplace l'ancien (mise à jour).
 * - `replace` : seuls les fichiers importés sont conservés.
 */
export type ImportMode = 'merge' | 'replace'

export interface CatalogSource {
  /** Contenu des fichiers, indexé par nom. */
  files: Record<string, string>
  /** Fichiers importés par l'utilisateur (par opposition aux fichiers d'origine). */
  imported: string[]
  /** Fichiers exclus des statistiques et des contrôles, sans être supprimés. */
  disabled: ReadonlySet<string>
}

export const initialSource = (files: Record<string, string>): CatalogSource => ({
  files,
  imported: [],
  disabled: new Set(),
})

/** Vrai tant que le catalogue est exactement le jeu d'origine, tous fichiers actifs. */
export const isPristine = (source: CatalogSource, originalFiles: Record<string, string>) =>
  source.files === originalFiles && source.imported.length === 0 && source.disabled.size === 0

export interface ImportOutcome {
  source: CatalogSource
  /** Fichiers importés qui remplacent un fichier de même nom déjà chargé. */
  overwritten: string[]
}

export function applyImport(source: CatalogSource, read: Record<string, string>, mode: ImportMode): ImportOutcome {
  const names = Object.keys(read)
  if (names.length === 0) return { source, overwritten: [] }

  if (mode === 'replace') {
    return { source: { files: { ...read }, imported: names, disabled: new Set() }, overwritten: [] }
  }

  return {
    source: {
      files: { ...source.files, ...read },
      imported: [...new Set([...source.imported, ...names])],
      // Une nouvelle version d'un fichier désactivé est réactivée : on l'importe pour l'utiliser.
      disabled: new Set([...source.disabled].filter((name) => !names.includes(name))),
    },
    overwritten: names.filter((name) => name in source.files),
  }
}

export function toggleFile(source: CatalogSource, name: string): CatalogSource {
  const disabled = new Set(source.disabled)
  if (!disabled.delete(name)) disabled.add(name)
  return { ...source, disabled }
}

export const enableAllFiles = (source: CatalogSource): CatalogSource =>
  source.disabled.size === 0 ? source : { ...source, disabled: new Set() }
