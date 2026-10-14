import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { assembleCatalog, defaultCsvFiles, parseCsvFiles } from '@/services/catalogLoader'
import {
  applyImport,
  enableAllFiles as enableAll,
  initialSource,
  isPristine,
  toggleFile as toggle,
  type ImportMode,
} from '@/services/catalogSource'
import { readCsvFiles } from '@/services/fileImport'
import { diffCatalogs } from '@/services/catalogDiff'
import {
  CatalogContext,
  type CatalogContextValue,
  type ImportChanges,
  type ImportResult,
  type LoadedFile,
} from './catalogContext'

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState(() => initialSource(defaultCsvFiles))
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [lastImport, setLastImport] = useState<ImportResult | null>(null)
  const [lastChanges, setLastChanges] = useState<ImportChanges | null>(null)

  // Lecture une seule fois par jeu de fichiers ; (dés)activer un fichier ne fait que réassembler.
  const parsed = useMemo(() => parseCsvFiles(source.files), [source.files])
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

  const toggleFile = useCallback((name: string) => setSource((s) => toggle(s, name)), [])
  const enableAllFiles = useCallback(() => setSource(enableAll), [])

  const importFiles = useCallback(
    async (input: Iterable<File>) => {
      const { files: read, rejected } = await readCsvFiles(input)
      const { source: next, overwritten } = applyImport(source, read, importMode)
      const result: ImportResult = { mode: importMode, imported: Object.keys(read), rejected, overwritten }
      if (next !== source) {
        // Catalogue tel qu'il sera affiché après l'import (fichiers désactivés exclus), comparé à l'actuel.
        const after = assembleCatalog(parseCsvFiles(next.files).filter((f) => !next.disabled.has(f.report.fileName)))
        setLastChanges({
          diff: diffCatalogs(catalog.products, after.products),
          files: result.imported,
          mode: importMode,
          at: new Date(),
        })
      }
      setSource(next)
      setLastImport(result)
      return result
    },
    [importMode, source, catalog],
  )

  const reset = useCallback(() => {
    setSource(initialSource(defaultCsvFiles))
    setLastImport(null)
    setLastChanges(null)
  }, [])

  const dismissLastImport = useCallback(() => setLastImport(null), [])

  const value = useMemo<CatalogContextValue>(
    () => ({
      catalog,
      files,
      toggleFile,
      enableAllFiles,
      isDefault: isPristine(source, defaultCsvFiles),
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
