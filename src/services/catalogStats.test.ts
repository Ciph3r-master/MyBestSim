import { describe, expect, it } from 'vitest'
import { csv, unlimited } from '@/test/csv'
import { buildCatalog, defaultCsvFiles } from './catalogLoader'
import { computeStats, median } from './catalogStats'

const products = (rows: Parameters<typeof csv>[0]) => buildCatalog({ 'testsim.csv': csv(rows) }).products

describe('median', () => {
  it('gère les effectifs pairs, impairs et vides', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('computeStats', () => {
  it('compte les produits strictement au-dessus de 100 €', () => {
    const stats = computeStats(products([{ price: '100' }, { price: '100.01' }, { price: '20' }]))
    expect(stats.over100).toBe(1)
    expect(stats.minPrice).toBe(20)
    expect(stats.maxPrice).toBe(100.01)
  })

  it('exclut les illimités de la data moyenne mais pas du nombre de cartes', () => {
    const stats = computeStats(products([{ data_gb: '10', data_display: '10 Go' }, { data_gb: '20', data_display: '20 Go' }, unlimited()]))
    expect(stats.total).toBe(3)
    expect(stats.unlimited).toBe(1)
    expect(stats.avgData).toBe(15)
    expect(stats.medianData).toBe(15)
  })

  it('exclut les produits hors EUR des indicateurs de prix, pas des volumes', () => {
    const stats = computeStats(products([{ price: '10' }, { price: '30' }, { price: '1000', currency: 'USD' }]))
    expect(stats.total).toBe(3)
    expect(stats.pricedCount).toBe(2)
    expect(stats.excludedFromPrices).toEqual([{ name: 'USD', count: 1 }])
    expect(stats.avgPrice).toBe(20)
    expect(stats.maxPrice).toBe(30)
    expect(stats.byProvider[0].count).toBe(3)
  })

  it('renvoie null (et non 0) quand aucun produit n’est en EUR', () => {
    const stats = computeStats(products([{ currency: 'USD' }]))
    expect(stats.avgPrice).toBeNull()
    expect(stats.minPrice).toBeNull()
    expect(stats.avgPricePerGb).toBeNull()
    expect(stats.cheapest).toBeNull()
    expect(stats.byProvider[0].pricePerGb).toBeNull()
  })

  it('sépare pays et zones dans les destinations', () => {
    const stats = computeStats(
      products([
        {},
        {},
        { country_code: 'JP', country_name: 'Japon' },
        { country_code: 'WW', country_name: 'Monde' },
        { country_code: 'WW', country_name: 'Monde' },
        { country_code: 'WW', country_name: 'Monde' },
      ]),
    )
    expect(stats.countryCount).toBe(2)
    expect(stats.zoneCount).toBe(1)
    // La zone, pourtant la plus fournie, n'apparaît pas dans le classement des pays.
    expect(stats.topCountries).toEqual([
      { name: 'France', count: 2 },
      { name: 'Japon', count: 1 },
    ])
    expect(stats.zones).toEqual([{ name: 'Monde', count: 3 }])
  })

  it("calcule l'indice de prix à offre égale indépendamment de la composition du catalogue", () => {
    // A ne vend que des petits forfaits (€/Go élevé), B que des gros : mais à offre égale, A est moins cher.
    const stats = computeStats(
      products([
        { provider: 'A', data_gb: '1', data_display: '1 Go', price: '5' },
        { provider: 'C', data_gb: '1', data_display: '1 Go', price: '6' },
        { provider: 'B', data_gb: '50', data_display: '50 Go', price: '60' },
        { provider: 'C', data_gb: '50', data_display: '50 Go', price: '50' },
      ]),
    )
    const a = stats.byProvider.find((p) => p.name === 'A')!
    const b = stats.byProvider.find((p) => p.name === 'B')!
    expect(a.pricePerGb!).toBeGreaterThan(b.pricePerGb!) // le €/Go désavantage A…
    expect(a.priceIndex!).toBeLessThan(0) // …alors qu'il est moins cher que le marché
    expect(b.priceIndex!).toBeGreaterThan(0)
  })
})

describe('chiffres du jeu MyBestSim (partie 1 du test)', () => {
  const stats = computeStats(buildCatalog(defaultCsvFiles).products)

  it('donne les indicateurs attendus', () => {
    expect(stats.total).toBe(5056)
    expect(stats.over100).toBe(56)
    expect(stats.minPrice).toBe(5.36)
    expect(stats.maxPrice).toBe(154.63)
    expect(stats.avgPrice!).toBeCloseTo(29.3, 2)
    // Effectif pair : moyenne des deux valeurs centrales (20,69 et 20,70), affichée 20,70 €.
    expect(stats.medianPrice).toBe(20.695)
    expect(stats.avgData).toBeCloseTo(14.5, 1)
    expect(stats.medianData).toBe(5)
    expect(stats.unlimited).toBe(653)
    expect(stats.byProvider[0]).toMatchObject({ name: 'Airalo', count: 722 })
  })

  it('couvre 50 pays et 4 zones (et non « 54 destinations »)', () => {
    expect(stats.countryCount).toBe(50)
    expect(stats.zoneCount).toBe(4)
    expect(stats.zones.map((z) => z.name)).toEqual(['Europe', 'Asie', 'Amérique du Nord', 'Monde'])
    expect(stats.topCountries[0]).toEqual({ name: 'Indonésie', count: 104 })
  })

  it("ne montre aucun écart tarifaire structurel entre fournisseurs (±1 %)", () => {
    for (const p of stats.byProvider) expect(Math.abs(p.priceIndex!)).toBeLessThan(0.01)
  })
})
