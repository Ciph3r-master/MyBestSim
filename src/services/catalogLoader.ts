import Papa from 'papaparse'
import type { Catalog, FileReport, InvalidRow, Product, RawProductRow } from '@/types/catalog'
import { EXPECTED_COLUMNS } from '@/constants/catalog'

// Jeu de données par défaut : tous les CSV de src/data, intégrés au build.
// D'autres fichiers peuvent ensuite être importés dans le navigateur (voir fileImport.ts).
const bundledCsvFiles = import.meta.glob<string>('../data/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const fileNameOf = (path: string) => path.split('/').pop() ?? path

/** Fichiers par défaut, indexés par nom de fichier. */
export const defaultCsvFiles: Record<string, string> = Object.fromEntries(
  Object.entries(bundledCsvFiles).map(([path, content]) => [fileNameOf(path), content]),
)

const toNumber = (value: string | undefined): number | null => {
  if (value == null || value.trim() === '') return null
  const n = Number(value.replace(',', '.').trim())
  return Number.isFinite(n) ? n : null
}

// Suffixe de version ajouté au nom pour garder plusieurs exports côte à côte :
// « _2026-10-15 », « -20261015 », « 15-10-2026 », « _v2 », « (1) »… (répétable : « _2026-10-15_v2 »).
const VERSION_SUFFIX = /[\s._-]*(\(\d+\)|v\d+|\d{4}[-_.]?\d{2}[-_.]?\d{2}|\d{2}[-_.]\d{2}[-_.]\d{4})$/i

/** Nom d'un fichier sans extension ni suffixe de version : « airalo_2026-10-15.csv » → « airalo ». */
export function fileBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.csv$/i, '')
  let base = withoutExtension
  for (let previous = ''; previous !== base; ) {
    previous = base
    base = base.replace(VERSION_SUFFIX, '')
  }
  // Un nom qui n'est qu'une date (« 2026-10-15.csv ») est gardé tel quel.
  return base || withoutExtension
}

/** Préfixe attendu des SKU d'un fichier : « airalo.csv » ou « airalo_2026-10-15.csv » → « airalo- ». */
const skuPrefixOf = (fileName: string) => `${fileBaseName(fileName)}-`
const ownsSku = (p: Product) => p.sku.startsWith(skuPrefixOf(p.sourceFile))

/** Normalise une ligne, ou renvoie la raison de son rejet. */
function normalizeRow(row: RawProductRow, sourceFile: string): Product | string {
  // Une ligne tronquée (moins de champs que l'en-tête) laisse des colonnes à `undefined` :
  // elle est rejetée avec la liste des colonnes absentes, au lieu de faire échouer tout le fichier.
  const absent = EXPECTED_COLUMNS.filter((column) => row[column] === undefined)
  if (absent.length) return `ligne incomplète (colonnes manquantes : ${absent.join(', ')})`
  const field = (column: keyof RawProductRow) => (row[column] ?? '').trim()

  if (!field('sku')) return 'SKU manquant'
  if (!field('provider')) return 'fournisseur manquant'

  if (!field('price')) return 'prix manquant'
  const price = toNumber(field('price'))
  if (price == null || price <= 0) return `prix invalide (« ${field('price')} »)`

  const validityDays = toNumber(field('validity_days'))
  if (validityDays == null || validityDays <= 0) {
    return field('validity_days') ? `durée de validité invalide (« ${field('validity_days')} »)` : 'durée de validité manquante'
  }

  const dataDisplay = field('data_display')
  const unlimited = /illimit/i.test(dataDisplay)
  const dataGb = toNumber(field('data_gb'))
  if (!unlimited && dataGb == null) return 'volume de data manquant pour un forfait non illimité'

  return {
    sku: field('sku'),
    provider: field('provider'),
    productName: field('product_name'),
    countryCode: field('country_code'),
    countryName: field('country_name'),
    dataGb: unlimited ? null : dataGb,
    validityDays,
    price,
    network: field('network'),
    topUp: field('top_up').toLowerCase() === 'oui',
    dataDisplay,
    currency: field('currency'),
    sourceFile,
  }
}

export function parseCsvFile(fileName: string, content: string): { products: Product[]; report: FileReport } {
  const { data, meta } = Papa.parse<RawProductRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const headers = meta.fields ?? []
  const missingColumns = EXPECTED_COLUMNS.filter((c) => !headers.includes(c))
  const products: Product[] = []
  const invalidRows: InvalidRow[] = []

  if (missingColumns.length === 0) {
    data.forEach((row, i) => {
      const result = normalizeRow(row, fileName)
      if (typeof result === 'string') invalidRows.push({ line: i + 2, sku: row.sku ?? '', reason: result })
      else products.push(result)
    })
  }

  const expectedPrefix = skuPrefixOf(fileName)
  return {
    products,
    report: {
      fileName,
      providers: [...new Set(products.map((p) => p.provider))],
      rowCount: data.length,
      validCount: products.length,
      missingColumns,
      invalidRows,
      skuPrefixMismatches: products.filter((p) => !p.sku.startsWith(expectedPrefix)).map((p) => p.sku),
      duplicateSkus: [],
    },
  }
}

export type ParsedFile = ReturnType<typeof parseCsvFile>

type Parser = (fileName: string, content: string) => ParsedFile

/**
 * Fournisseur d'un fichier, lu dans son contenu : `null` si le fichier est inexploitable
 * ou mélange plusieurs fournisseurs.
 */
export function providerOfCsv(fileName: string, content: string, parse: Parser = parseCsvFile): string | null {
  const { providers } = parse(fileName, content).report
  return providers.length === 1 ? providers[0] : null
}

/** Lit tous les fichiers (indexés par nom), triés par nom. */
export function parseCsvFiles(files: Record<string, string>, parse: Parser = parseCsvFile): ParsedFile[] {
  return Object.entries(files)
    .map(([name, content]) => parse(fileNameOf(name), content))
    .sort((a, b) => a.report.fileName.localeCompare(b.report.fileName))
}

export interface ParseCache {
  parse: Parser
  parseAll: (files: Record<string, string>) => ParsedFile[]
  providerOf: (fileName: string, content: string) => string | null
}

/**
 * Cache de lecture : un fichier n'est relu que si son contenu a changé. Un import ne lit donc que
 * les nouveaux fichiers, au lieu de relire tout le catalogue (reconnaissance du fournisseur,
 * comparaison avant/après, affichage). Les résultats sont partagés : `assembleCatalog` ne les modifie pas.
 */
export function createParseCache(): ParseCache {
  const entries = new Map<string, { content: string; parsed: ParsedFile }>()
  const parse: Parser = (fileName, content) => {
    const name = fileNameOf(fileName)
    const hit = entries.get(name)
    if (hit && hit.content === content) return hit.parsed
    const parsed = parseCsvFile(name, content)
    entries.set(name, { content, parsed })
    return parsed
  }
  return {
    parse,
    parseAll: (files) => parseCsvFiles(files, parse),
    providerOf: (fileName, content) => providerOfCsv(fileName, content, parse),
  }
}

/** Assemble le catalogue à partir de fichiers déjà lus (par exemple les seuls fichiers activés). */
export function assembleCatalog(files: ParsedFile[]): Catalog {
  // Copie des comptes rendus : les fichiers lus sont réutilisés d'un assemblage à l'autre.
  const parsed = files.map((f) => ({ ...f, report: { ...f.report, duplicateSkus: [] as string[] } }))

  // Dédoublonnage par SKU. Un SKU appartient au fichier dont il porte le préfixe (« airalo-… » → airalo.csv) :
  // c'est cette occurrence qui est conservée, quel que soit l'ordre des fichiers. À défaut, la première lue.
  // L'occurrence écartée est signalée dans le compte rendu de son fichier.
  const reports = new Map(parsed.map((f) => [f.report.fileName, f.report]))
  const bySku = new Map<string, Product>()
  const duplicateSkus = new Set<string>()
  for (const { products } of parsed) {
    for (const product of products) {
      const kept = bySku.get(product.sku)
      if (!kept) {
        bySku.set(product.sku, product)
        continue
      }
      duplicateSkus.add(product.sku)
      const replaces = ownsSku(product) && !ownsSku(kept)
      const discarded = replaces ? kept : product
      if (replaces) bySku.set(product.sku, product)
      reports.get(discarded.sourceFile)?.duplicateSkus.push(product.sku)
    }
  }

  const products = [...bySku.values()]
  return {
    products,
    providers: [...new Set(products.map((p) => p.provider))].sort((a, b) => a.localeCompare(b)),
    files: parsed.map((f) => f.report),
    fileCount: parsed.length,
    duplicateSkus: [...duplicateSkus],
  }
}

/** Construit le catalogue à partir de fichiers CSV indexés par nom de fichier. */
export const buildCatalog = (files: Record<string, string>) => assembleCatalog(parseCsvFiles(files))
