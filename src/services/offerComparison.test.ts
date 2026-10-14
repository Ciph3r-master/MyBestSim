import { describe, expect, it } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import { buildCatalog } from './catalogLoader'
import { compareOffers, listDestinations, listValidities } from './offerComparison'

const products = buildCatalog({
  'testsim.csv': csv([
    { provider: 'A', data_gb: '10', data_display: '10 Go', price: '20', validity_days: '30' },
    { provider: 'B', data_gb: '10', data_display: '10 Go', price: '18', validity_days: '30' },
    { provider: 'C', data_gb: '10', data_display: '10 Go', price: '25', validity_days: '30' },
    { provider: 'A', data_gb: '1', data_display: '1 Go', price: '6', validity_days: '30' },
    unlimited({ provider: 'B', price: '70', validity_days: '30' }),
    // Hors comparaison : autre durée, autre devise, autre destination.
    { provider: 'D', data_gb: '10', data_display: '10 Go', price: '5', validity_days: '7' },
    { provider: 'E', data_gb: '10', data_display: '10 Go', price: '1', validity_days: '30', currency: 'USD' },
    { provider: 'F', data_gb: '10', data_display: '10 Go', price: '2', validity_days: '30', country_code: 'JP', country_name: 'Japon' },
  ]),
}).products

describe('compareOffers', () => {
  const result = compareOffers(products, 'France', 30)

  it('ne compare que la destination, la durée et la devise demandées', () => {
    expect(result.offers.map((o) => o.product.provider).sort()).toEqual(['A', 'A', 'B', 'B', 'C'])
  })

  it('ordonne les volumes, illimité en dernier', () => {
    expect(result.tiers).toEqual(['1 Go', '10 Go', 'Illimité'])
  })

  it('retient la meilleure offre de chaque volume et son écart à la médiane', () => {
    const tenGb = result.best.find((b) => b.tier === '10 Go')!
    expect(tenGb.product.provider).toBe('B')
    expect(tenGb.offerCount).toBe(3)
    expect(tenGb.gapToMedian).toBeCloseTo(18 / 20 - 1)
    expect(tenGb.pricePerGb).toBeCloseTo(1.8)
    expect(result.best.find((b) => b.tier === 'Illimité')!.pricePerGb).toBeNull()
  })
})

describe('listes de choix', () => {
  it('trie les destinations par nombre d’offres en EUR', () => {
    expect(listDestinations(products).map((d) => [d.name, d.count])).toEqual([
      ['France', 6],
      ['Japon', 1],
    ])
  })

  it('liste les durées disponibles', () => {
    expect(listValidities(products)).toEqual([7, 30])
  })
})
