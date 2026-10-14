import { describe, expect, it } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import { buildCatalog, parseCsvFile } from './catalogLoader'
import { productsToCsv } from './csvExport'

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

  it('exporte un en-tête seul pour une sélection vide', () => {
    expect(productsToCsv([]).trim().split('\r\n')).toHaveLength(1)
  })
})
