import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { assembleCatalog, defaultCsvFiles, parseCsvFiles } from '@/services/catalogLoader'
import { readCsvFiles } from '@/services/fileImport'
import {
  CatalogContext,
  type CatalogContextValue,
  type ImportMode,
  type ImportResult,
  type LoadedFile,
} from './catalogContext'

interface SourceState {
  files: Record<string, string>
  imported: string[]
}

const DEFAULT_SOURCE: SourceState = { files: defaultCsvFiles, imported: [] }
const NONE_DISABLED = new Set<string>()

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<SourceState>(DEFAULT_SOURCE)
  const [disabled, setDisabled] = useState<Set<string>>(NONE_DISABLED)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [lastImport, setLastImport] = useState<ImportResult | null>(null)

  // Lecture une seule fois par jeu de fichiers ; (dés)activer un fichier ne fait que réassembler.
  const parsed = useMemo(() => parseCsvFiles(source.files), [source.files])
  const catalog = useMemo(
    () => assembleCatalog(parsed.filter((f) => !disabled.has(f.report.fileName))),
    [parsed, disabled],
  )

  const files = useMemo<LoadedFile[]>(
    () =>
      parsed.map(({ report }) => ({
        name: report.fileName,
        enabled: !disabled.has(report.fileName),
        imported: source.imported.includes(report.fileName),
        provider: report.providers.join(', ') || '-',
        rowCount: report.rowCount,
      })),
    [parsed, disabled, source.imported],
  )

  const toggleFile = useCallback((name: string) => {
    setDisabled((current) => {
      const next = new Set(current)
      if (!next.delete(name)) next.add(name)
      return next
    })
  }, [])

  const enableAllFiles = useCallback(() => setDisabled(NONE_DISABLED), [])

  const importFiles = useCallback(
    async (input: Iterable<File>) => {
      const { files: read, rejected } = await readCsvFiles(input)
      const imported = Object.keys(read)
      const base = importMode === 'merge' ? source : { files: {}, imported: [] }
      const result: ImportResult = {
        mode: importMode,
        imported,
        rejected,
        overwritten: importMode === 'merge' ? imported.filter((name) => name in source.files) : [],
      }

      if (imported.length) {
        setSource({
          files: { ...base.files, ...read },
          imported: [...new Set([...base.imported, ...imported])],
        })
        // Un fichier réimporté (nouvelle version) est réactivé ; un remplacement repart de zéro.
        setDisabled((current) =>
          importMode === 'replace' ? NONE_DISABLED : new Set([...current].filter((n) => !imported.includes(n))),
        )
      }
      setLastImport(result)
      return result
    },
    [importMode, source],
  )

  const reset = useCallback(() => {
    setSource(DEFAULT_SOURCE)
    setDisabled(NONE_DISABLED)
    setLastImport(null)
  }, [])

  const dismissLastImport = useCallback(() => setLastImport(null), [])

  const value = useMemo<CatalogContextValue>(
    () => ({
      catalog,
      files,
      toggleFile,
      enableAllFiles,
      isDefault: source === DEFAULT_SOURCE && disabled.size === 0,
      importedFiles: source.imported,
      importMode,
      setImportMode,
      importFiles,
      lastImport,
      dismissLastImport,
      reset,
    }),
    [catalog, files, toggleFile, enableAllFiles, source, disabled, importMode, importFiles, lastImport, dismissLastImport, reset],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
