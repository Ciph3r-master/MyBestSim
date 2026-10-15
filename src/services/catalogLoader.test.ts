import { describe, expect, it } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import {
  assembleCatalog,
  buildCatalog,
  createParseCache,
  defaultCsvFiles,
  fileBaseName,
  parseCsvFile,
  parseCsvFiles,
  providerOfCsv,
} from './catalogLoader'

describe('parseCsvFile', () => {
  it('normalise une ligne valide', () => {
    const { products, report } = parseCsvFile('testsim.csv', csv([{ price: '12,5', top_up: 'non' }]))
    expect(report.invalidRows).toEqual([])
    expect(products[0]).toMatchObject({
      sku: 'testsim-1',
      provider: 'TestSIM',
      dataGb: 5,
      price: 12.5, // virgule décimale acceptée
      topUp: false,
      currency: 'EUR',
      sourceFile: 'testsim.csv',
    })
  })

  it("représente un forfait illimité par dataGb = null", () => {
    const { products } = parseCsvFile('testsim.csv', csv([unlimited()]))
    expect(products[0].dataGb).toBeNull()
  })

  it('rejette les lignes inexploitables en indiquant la ligne et la raison', () => {
    const { products, report } = parseCsvFile(
      'testsim.csv',
      csv([{}, { price: '' }, { price: '0' }, { data_gb: '' }, { sku: '' }]),
    )
    expect(products).toHaveLength(1)
    expect(report.rowCount).toBe(5)
    expect(report.invalidRows.map((r) => [r.line, r.reason])).toEqual([
      [3, 'prix manquant'],
      [4, 'prix invalide (« 0 »)'],
      [5, 'volume de data manquant pour un forfait non illimité'],
      [6, 'SKU manquant'],
    ])
  })

  it('rejette une ligne tronquée sans faire échouer le fichier', () => {
    // Deuxième ligne coupée juste après le prix : currency, network et top_up sont absents.
    const content = csv([{}, {}]).replace(/(\ntestsim-2,.*?,10),EUR,4G,oui$/, '$1')
    expect(() => parseCsvFile('testsim.csv', content)).not.toThrow()
    const { products, report } = parseCsvFile('testsim.csv', content)
    expect(products.map((p) => p.sku)).toEqual(['testsim-1'])
    expect(report.invalidRows).toEqual([
      { line: 3, sku: 'testsim-2', reason: 'ligne incomplète (colonnes manquantes : currency, network, top_up)' },
    ])
  })

  it('rejette une ligne sans fournisseur ou sans durée de validité exploitable', () => {
    const { products, report } = parseCsvFile(
      'testsim.csv',
      csv([{ provider: ' ' }, { validity_days: '' }, { validity_days: '0' }, { validity_days: 'trente' }]),
    )
    expect(products).toEqual([])
    expect(report.invalidRows.map((r) => r.reason)).toEqual([
      'fournisseur manquant',
      'durée de validité manquante',
      'durée de validité invalide (« 0 »)',
      'durée de validité invalide (« trente »)',
    ])
  })

  it("ignore un fichier auquel il manque des colonnes et les liste", () => {
    const { products, report } = parseCsvFile('broken.csv', csv([{}], ['sku', 'provider', 'product_name']))
    expect(products).toEqual([])
    expect(report.missingColumns).toContain('price')
    expect(report.missingColumns).toHaveLength(9)
  })

  it('signale les SKU dont le préfixe ne correspond pas au nom du fichier', () => {
    const { report } = parseCsvFile('testsim.csv', csv([{}, { sku: 'autre-1' }]))
    expect(report.skuPrefixMismatches).toEqual(['autre-1'])
  })
})

describe('nom de base et fournisseur d’un fichier', () => {
  it.each([
    ['airalo.csv', 'airalo'],
    ['airalo_2026-10-15.csv', 'airalo'],
    ['airalo-20261015.csv', 'airalo'],
    ['airalo 15-10-2026.csv', 'airalo'],
    ['airalo_v2.csv', 'airalo'],
    ['airalo (1).csv', 'airalo'],
    ['airalo_2026-10-15_v2.csv', 'airalo'],
    ['4sesim.csv', '4sesim'],
    ['2026-10-15.csv', '2026-10-15'],
  ])('« %s » → « %s »', (name, base) => expect(fileBaseName(name)).toBe(base))

  it('accepte une version datée sans signaler ses SKU comme hors préfixe', () => {
    const { report } = parseCsvFile('testsim_2026-10-15.csv', csv([{}]))
    expect(report.skuPrefixMismatches).toEqual([])
  })

  it('lit le fournisseur dans le contenu', () => {
    expect(providerOfCsv('x.csv', csv([{ provider: 'Airalo' }]))).toBe('Airalo')
    expect(providerOfCsv('x.csv', csv([{ provider: 'A' }, { provider: 'B' }]))).toBeNull()
    expect(providerOfCsv('x.csv', 'pas un csv')).toBeNull()
  })
})

describe('assembleCatalog', () => {
  const files = {
    'a.csv': csv([{ sku: 'x-1', provider: 'A' }]),
    'b.csv': csv([{ sku: 'x-1', provider: 'B' }, { sku: 'b-2', provider: 'B' }]),
  }

  it('garde la première occurrence d’un SKU et attribue le doublon au fichier suivant', () => {
    const catalog = buildCatalog(files)
    expect(catalog.products.map((p) => `${p.sku}:${p.provider}`)).toEqual(['x-1:A', 'b-2:B'])
    expect(catalog.duplicateSkus).toEqual(['x-1'])
    expect(catalog.files.find((f) => f.fileName === 'b.csv')?.duplicateSkus).toEqual(['x-1'])
    expect(catalog.files.find((f) => f.fileName === 'a.csv')?.duplicateSkus).toEqual([])
  })

  it('conserve l’occurrence du fichier qui porte le préfixe du SKU, quel que soit l’ordre des fichiers', () => {
    // « aaa.csv » est lu avant « testsim.csv » mais n'est pas propriétaire de « testsim-1 ».
    const catalog = buildCatalog({
      'aaa.csv': csv([{ sku: 'testsim-1', provider: 'Intrus' }]),
      'testsim.csv': csv([{ sku: 'testsim-1', provider: 'TestSIM' }]),
    })
    expect(catalog.products.map((p) => p.provider)).toEqual(['TestSIM'])
    expect(catalog.files.find((f) => f.fileName === 'aaa.csv')?.duplicateSkus).toEqual(['testsim-1'])
    expect(catalog.files.find((f) => f.fileName === 'testsim.csv')?.duplicateSkus).toEqual([])
  })

  it("n'accumule pas les doublons quand on réassemble les mêmes fichiers (activation/désactivation)", () => {
    const parsed = parseCsvFiles(files)
    assembleCatalog(parsed)
    const second = assembleCatalog(parsed)
    expect(second.files.find((f) => f.fileName === 'b.csv')?.duplicateSkus).toEqual(['x-1'])
  })

  it("n'inclut que les fichiers passés (fichiers désactivés exclus)", () => {
    const parsed = parseCsvFiles(files).filter((f) => f.report.fileName !== 'a.csv')
    const catalog = assembleCatalog(parsed)
    expect(catalog.providers).toEqual(['B'])
    expect(catalog.duplicateSkus).toEqual([])
  })
})

describe('jeu de données MyBestSim', () => {
  const catalog = buildCatalog(defaultCsvFiles)

  it('charge les 18 fichiers fournisseurs sans perte', () => {
    expect(catalog.fileCount).toBe(18)
    expect(catalog.products).toHaveLength(5056)
    expect(catalog.providers).toHaveLength(18)
    expect(catalog.duplicateSkus).toEqual([])
    expect(catalog.files.every((f) => f.invalidRows.length === 0 && f.missingColumns.length === 0)).toBe(true)
  })
})

describe('createParseCache', () => {
  it('ne relit un fichier que si son contenu a changé', () => {
    const cache = createParseCache()
    const content = csv([{}])
    const first = cache.parse('testsim.csv', content)
    expect(cache.parse('testsim.csv', content)).toBe(first)
    expect(cache.parseAll({ 'testsim.csv': content })[0]).toBe(first)

    const changed = cache.parse('testsim.csv', csv([{}, {}]))
    expect(changed).not.toBe(first)
    expect(changed.products).toHaveLength(2)
  })

  it('donne les mêmes résultats que la lecture sans cache', () => {
    const cache = createParseCache()
    expect(cache.parseAll(defaultCsvFiles)).toEqual(parseCsvFiles(defaultCsvFiles))
    expect(cache.providerOf('testsim.csv', csv([{}]))).toBe(providerOfCsv('testsim.csv', csv([{}])))
  })
})
