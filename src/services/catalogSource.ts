import { providerOfCsv } from '@/services/catalogLoader'

/**
 * État des fichiers chargés dans le dashboard (d'origine, importés, désactivés) et ses transitions.
 * Fonctions pures, sans React : le CatalogProvider ne fait que les appeler.
 */

/**
 * - `merge` : les fichiers importés s'ajoutent ; un fichier du même fournisseur (ou de même nom) remplace
 *   l'ancienne version, quel que soit son nom (« airalo_2026-10-15.csv » remplace « airalo.csv »).
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

/** Un fichier importé qui remplace la version précédente d'un fournisseur. */
export interface FileReplacement {
  file: string
  /** Fichiers remplacés (ancien nom, ou même nom pour une simple mise à jour). */
  replaces: string[]
  /** Fournisseur reconnu dans le contenu, `null` si le remplacement vient seulement du nom. */
  provider: string | null
}

export interface ImportOutcome {
  source: CatalogSource
  replacements: FileReplacement[]
}

export function applyImport(source: CatalogSource, read: Record<string, string>, mode: ImportMode): ImportOutcome {
  const names = Object.keys(read)
  if (names.length === 0) return { source, replacements: [] }

  if (mode === 'replace') {
    return { source: { files: { ...read }, imported: names, disabled: new Set() }, replacements: [] }
  }

  // Le fournisseur d'un fichier est lu dans son contenu : le nom du fichier est libre.
  const loaded = Object.entries(source.files).filter(([name]) => !names.includes(name))
  const loadedProviders = new Map(loaded.map(([name, content]) => [name, providerOfCsv(name, content)]))
  const replaced = new Set<string>()
  const replacements: FileReplacement[] = []

  for (const name of names) {
    const provider = providerOfCsv(name, read[name])
    const previous = [
      ...(name in source.files ? [name] : []),
      ...(provider ? loaded.filter(([other]) => loadedProviders.get(other) === provider).map(([other]) => other) : []),
    ]
    if (previous.length) {
      previous.forEach((p) => p !== name && replaced.add(p))
      replacements.push({ file: name, replaces: previous, provider })
    }
  }

  const files = Object.fromEntries(Object.entries(source.files).filter(([name]) => !replaced.has(name)))
  return {
    source: {
      files: { ...files, ...read },
      imported: [...new Set([...source.imported.filter((n) => !replaced.has(n)), ...names])],
      // La nouvelle version d'un fichier désactivé est active : on l'importe pour l'utiliser.
      disabled: new Set([...source.disabled].filter((n) => !names.includes(n) && !replaced.has(n))),
    },
    replacements,
  }
}

export function toggleFile(source: CatalogSource, name: string): CatalogSource {
  const disabled = new Set(source.disabled)
  if (!disabled.delete(name)) disabled.add(name)
  return { ...source, disabled }
}

export const enableAllFiles = (source: CatalogSource): CatalogSource =>
  source.disabled.size === 0 ? source : { ...source, disabled: new Set() }
