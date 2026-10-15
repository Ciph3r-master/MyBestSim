import { afterEach, describe, expect, it, vi } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import { buildCatalog, parseCsvFile } from './catalogLoader'
import { downloadCsv, productsToCsv, REVOKE_DELAY_MS } from './csvExport'

describe('productsToCsv', () => {
  const products = buildCatalog({
    'testsim.csv': csv([
      { price: '12.5' },
      unlimited({ top_up: 'non', currency: 'USD' }),
      // Virgule dans une valeur : doit être protégée par des guillemets.
      { country_code: 'KR', country_name: 'Corée, Sud' },
    ]),
  }).products

  it('produit un fichier au format fournisseur, réimportable à l’identique', () => {
    const exported = productsToCsv(products)
    expect(exported.split('\r\n')[0]).toBe(
      'sku,provider,product_name,country_code,country_name,data_gb,data_display,validity_days,price,currency,network,top_up',
    )
    const reimported = parseCsvFile('testsim.csv', exported)
    expect(reimported.report.invalidRows).toEqual([])
    expect(reimported.products).toEqual(products)
  })

  it('neutralise les formules pour qu’un tableur ne les exécute pas', () => {
    const [product] = buildCatalog({ 'testsim.csv': csv([{ network: '=HYPERLINK("https://exemple.test")' }]) }).products
    const exported = productsToCsv([product])
    expect(exported).toContain(`"'=HYPERLINK(""https://exemple.test"")"`)
    expect(exported).not.toMatch(/(^|,)"?=/m)
  })

  it('exporte un en-tête seul pour une sélection vide', () => {
    expect(productsToCsv([]).trim().split('\r\n')).toHaveLength(1)
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ne libère l’URL du fichier qu’après le démarrage du téléchargement', () => {
    vi.useFakeTimers()
    const click = vi.fn()
    const link = { click, remove: vi.fn() }
    vi.stubGlobal('document', { createElement: () => link, body: { append: vi.fn() } })
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')

    downloadCsv('a,b', 'export.csv')
    expect(click).toHaveBeenCalledOnce()
    expect(link).toMatchObject({ href: 'blob:test', download: 'export.csv' })
    expect(revoke).not.toHaveBeenCalled()

    vi.advanceTimersByTime(REVOKE_DELAY_MS)
    expect(revoke).toHaveBeenCalledWith('blob:test')
  })
})
