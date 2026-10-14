import { describe, expect, it } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import { buildCatalog, defaultCsvFiles } from './catalogLoader'
import { computeStats } from './catalogStats'
import { productInsight, searchProducts, selections, sortProducts } from './selections'

const products = buildCatalog({
  'testsim.csv': csv([
    { price: '100', provider: 'A' },
    { price: '120', provider: 'B' },
    { price: '150', provider: 'A', currency: 'USD' },
    unlimited({ price: '45', provider: 'C', network: '5G', validity_days: '30' }),
    { price: '25', country_code: 'JP', country_name: 'Japon', data_gb: '10', data_display: '10 Go' },
  ]),
}).products
const pick = (selection: ReturnType<typeof selections.all>) => products.filter(selection.filter).map((p) => p.sku)

describe('selections', () => {
  it('reprend exactement la règle des indicateurs (> 100 € strict, EUR uniquement)', () => {
    expect(pick(selections.premium())).toEqual(['testsim-2'])
  })

  it('associe chaque tranche de prix à ses bornes (borne haute exclue)', () => {
    expect(pick(selections.priceBucket('100+'))).toEqual(['testsim-1', 'testsim-2'])
    expect(pick(selections.priceBucket('20–30'))).toEqual(['testsim-5'])
    expect(selections.priceBucket('100+').title).toBe('Produits à 100 € et plus')
  })

  it('sélectionne enveloppes de data, destinations, réseau et durée', () => {
    expect(pick(selections.dataTier('Illimité'))).toEqual(['testsim-4'])
    expect(pick(selections.withData())).toHaveLength(4)
    expect(pick(selections.destination('Japon'))).toEqual(['testsim-5'])
    expect(pick(selections.network('5G'))).toEqual(['testsim-4'])
    expect(pick(selections.validity(30))).toEqual(['testsim-4'])
  })

  it('retrouve les mêmes effectifs que les statistiques sur le jeu MyBestSim', () => {
    const catalog = buildCatalog(defaultCsvFiles).products
    const stats = computeStats(catalog)
    const count = (s: ReturnType<typeof selections.all>) => catalog.filter(s.filter).length
    expect(count(selections.premium())).toBe(stats.over100)
    for (const bucket of stats.priceDistribution) expect(count(selections.priceBucket(bucket.name))).toBe(bucket.count)
    for (const tier of stats.dataTiers) expect(count(selections.dataTier(tier.name))).toBe(tier.count)
    expect(count(selections.destination('Europe'))).toBe(206)
  })

  it('sélectionne un fournisseur, un produit, les produits en EUR et les rechargeables', () => {
    expect(pick(selections.provider('A'))).toEqual(['testsim-1', 'testsim-3'])
    expect(pick(selections.product(products[1]))).toEqual(['testsim-2'])
    expect(selections.product(products[1]).product).toBe(products[1])
    expect(pick(selections.priced())).not.toContain('testsim-3') // en USD
    expect(pick(selections.topUp())).toHaveLength(5)
  })

  it('compare un produit aux seules offres de même volume, même durée, en EUR', () => {
    // testsim-1 (5 Go, 7 j, France) : comparable à testsim-2, pas à l'offre USD ni au 10 Go.
    expect(pick(selections.comparable(products[0]))).toEqual(['testsim-1', 'testsim-2'])
  })

  it('produit des identifiants utilisables comme noms de fichiers', () => {
    expect(selections.destination('Émirats arabes unis').id).toBe('destination-emirats-arabes-unis')
    expect(selections.priceBucket('20–30').id).toBe('prix-20-30')
  })
})

describe('tri et recherche', () => {
  it('trie par prix, illimités en dernier pour la data, avec un ordre stable', () => {
    expect(sortProducts(products, { key: 'price', direction: 'desc' }).map((p) => p.price)).toEqual([150, 120, 100, 45, 25])
    expect(sortProducts(products, { key: 'data', direction: 'asc' }).at(-1)?.dataGb).toBeNull()
  })

  it('trie sur chaque colonne du tableau', () => {
    const order = (key: Parameters<typeof sortProducts>[1]['key'], direction: 'asc' | 'desc' = 'asc') =>
      sortProducts(products, { key, direction }).map((p) => p.sku)
    expect(order('provider')).toEqual(['testsim-1', 'testsim-3', 'testsim-2', 'testsim-4', 'testsim-5'])
    expect(order('destination', 'desc')[0]).toBe('testsim-5') // Japon après France
    expect(order('validityDays', 'desc')[0]).toBe('testsim-4') // seul forfait 30 jours
    // Prix au Go : 25 € / 10 Go = 2,50 € en premier ; illimité (pas de prix au Go) en dernier.
    expect(order('pricePerGb')[0]).toBe('testsim-5')
    expect(order('pricePerGb').at(-1)).toBe('testsim-4')
  })

  it('départage les ex aequo par SKU pour un ordre stable', () => {
    const ties = sortProducts(products, { key: 'validityDays', direction: 'asc' }).map((p) => p.sku)
    expect(ties.slice(0, 4)).toEqual(['testsim-1', 'testsim-2', 'testsim-3', 'testsim-5'])
  })

  it('cherche sans tenir compte des accents ni de l’ordre des mots', () => {
    expect(searchProducts(products, 'japon 10').map((p) => p.sku)).toEqual(['testsim-5'])
    expect(searchProducts(products, 'ILLIMITE')).toHaveLength(1)
    expect(searchProducts(products, '  ')).toHaveLength(5)
  })
})

describe('productInsight', () => {
  const catalog = buildCatalog(defaultCsvFiles).products

  it('situe un produit parmi ses offres comparables', () => {
    const cheapest = computeStats(catalog).cheapest!
    const insight = productInsight(cheapest, catalog)!
    expect(insight.rank).toBe(1)
    expect(insight.destinationRank).toBe(1)
    expect(insight.gapToMedian).toBeLessThan(0)
    expect(insight.comparableCount).toBeGreaterThan(insight.destinationCount)
  })

  it('ne compare pas un prix hors EUR', () => {
    expect(productInsight(products[2], products)).toBeNull()
  })
})
