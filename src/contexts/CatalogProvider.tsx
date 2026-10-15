import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { assembleCatalog, createParseCache, defaultCsvFiles } from '@/services/catalogLoader'
import {
  applyImport,
  enableAllFiles as enableAll,
  initialSource,
  isPristine,
  toggleFile as toggle,
  type CatalogSource,
  type ImportMode,
} from '@/services/catalogSource'
import { createStore } from '@/services/catalogStore'
import { readCsvFiles } from '@/services/fileImport'
import { diffCatalogs } from '@/services/catalogDiff'
import {
  CatalogContext,
  type CatalogContextValue,
  type ImportChanges,
  type ImportResult,
  type LoadedFile,
} from './catalogContext'

interface CatalogProviderProps {
  children: ReactNode
  /** Fichiers de départ (par défaut, les CSV intégrés au build) ; injectable pour les tests. */
  initialFiles?: Record<string, string>
}

export function CatalogProvider({ children, initialFiles = defaultCsvFiles }: CatalogProviderProps) {
  // Store hors React : les imports sont exécutés l'un après l'autre sur l'état courant (pas d'écrasement).
  const [store] = useState(() => createStore(initialSource(initialFiles)))
  // Cache de lecture : un import ne relit que les fichiers nouveaux ou modifiés.
  const [cache] = useState(createParseCache)
  const source = useSyncExternalStore(store.subscribe, store.getState)

  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [lastImport, setLastImport] = useState<ImportResult | null>(null)
  const [lastChanges, setLastChanges] = useState<ImportChanges | null>(null)

  const catalogOf = useCallback(
    (src: CatalogSource) => assembleCatalog(cache.parseAll(src.files).filter((f) => !src.disabled.has(f.report.fileName))),
    [cache],
  )

  const parsed = useMemo(() => cache.parseAll(source.files), [cache, source.files])
  const catalog = useMemo(
    () => assembleCatalog(parsed.filter((f) => !source.disabled.has(f.report.fileName))),
    [parsed, source.disabled],
  )

  const files = useMemo<LoadedFile[]>(
    () =>
      parsed.map(({ report }) => ({
        name: report.fileName,
        enabled: !source.disabled.has(report.fileName),
        imported: source.imported.includes(report.fileName),
        provider: report.providers.join(', ') || '—',
        rowCount: report.rowCount,
      })),
    [parsed, source.disabled, source.imported],
  )

  const toggleFile = useCallback((name: string) => store.setState((s) => toggle(s, name)), [store])
  const enableAllFiles = useCallback(() => store.setState(enableAll), [store])

  const importFiles = useCallback(
    (input: Iterable<File>) => {
      const mode = importMode
      return store.enqueue(async (): Promise<ImportResult> => {
        try {
          const { files: read, rejected } = await readCsvFiles(input)
          // État lu au moment où l'import s'exécute, après les imports précédents.
          const before = store.getState()
          const { source: next, replacements } = applyImport(before, read, mode, cache.providerOf)
          const result: ImportResult = { mode, imported: Object.keys(read), rejected, replacements }
          if (next !== before) {
            setLastChanges({
              diff: diffCatalogs(catalogOf(before).products, catalogOf(next).products),
              files: result.imported,
              mode,
              at: new Date(),
            })
          }
          store.setState(() => next)
          setLastImport(result)
          return result
        } catch (error) {
          // Une erreur inattendue ne doit jamais faire échouer l'import en silence.
          const result: ImportResult = {
            mode,
            imported: [],
            rejected: [],
            replacements: [],
            error: error instanceof Error ? error.message : String(error),
          }
          setLastImport(result)
          return result
        }
      })
    },
    [store, cache, catalogOf, importMode],
  )

  const reset = useCallback(() => {
    store.setState(() => initialSource(initialFiles))
    setLastImport(null)
    setLastChanges(null)
  }, [store, initialFiles])

  const dismissLastImport = useCallback(() => setLastImport(null), [])

  const value = useMemo<CatalogContextValue>(
    () => ({
      catalog,
      files,
      toggleFile,
      enableAllFiles,
      isDefault: isPristine(source, initialFiles),
      importedFiles: source.imported,
      importMode,
      setImportMode,
      importFiles,
      lastImport,
      lastChanges,
      dismissLastImport,
      reset,
    }),
    [
      catalog,
      files,
      toggleFile,
      enableAllFiles,
      source,
      initialFiles,
      importMode,
      importFiles,
      lastImport,
      lastChanges,
      dismissLastImport,
      reset,
    ],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
