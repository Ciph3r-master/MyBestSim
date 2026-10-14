import { describe, expect, it } from 'vitest'
import { csv } from '@/test/csv'
import { buildCatalog, defaultCsvFiles } from './catalogLoader'
import { countChanges, diffCatalogs } from './catalogDiff'

const catalog = (rows: Parameters<typeof csv>[0]) => buildCatalog({ 'testsim.csv': csv(rows) }).products

describe('diffCatalogs', () => {
  const before = catalog([{ price: '10' }, { price: '20' }, { price: '30' }, { price: '40' }])
  const after = catalog([
    { price: '11' }, // +10 %
    { price: '15' }, // -25 %
    { price: '30', network: '5G' }, // même prix, réseau modifié
    // testsim-4 retiré
    { sku: 'testsim-9', price: '50' }, // ajouté
  ])
  const diff = diffCatalogs(before, after)

  it('repère les produits ajoutés et retirés par SKU', () => {
    expect(diff.added.map((p) => p.sku)).toEqual(['testsim-9'])
    expect(diff.removed.map((p) => p.sku)).toEqual(['testsim-4'])
  })

  it('classe les variations de prix en hausses et baisses', () => {
    expect(diff.increases.map((c) => [c.after.sku, c.change])).toEqual([['testsim-1', expect.closeTo(0.1)]])
    expect(diff.decreases.map((c) => [c.after.sku, c.change])).toEqual([['testsim-2', -0.25]])
    expect(diff.averageChange).toBeCloseTo((0.1 - 0.25) / 2)
  })

  it('signale les changements autres que le prix', () => {
    expect(diff.modified).toHaveLength(1)
    expect(diff.modified[0]).toMatchObject({ fields: ['network'] })
    expect(diff.unchangedCount).toBe(0)
  })

  it('compte une seule fois un produit à la fois repricé et modifié', () => {
    expect(countChanges(diff)).toBe(5) // 1 ajouté, 1 retiré, 2 prix, 1 réseau
    const both = diffCatalogs(catalog([{ price: '10' }]), catalog([{ price: '12', network: '5G' }]))
    expect(countChanges(both)).toBe(1)
  })

  it('résume par fournisseur', () => {
    expect(diff.byProvider).toEqual([
      { provider: 'TestSIM', added: 1, removed: 1, increases: 1, decreases: 1, averageChange: expect.closeTo(-0.075) },
    ])
  })

  it('ne compte pas un changement de devise comme une hausse de prix', () => {
    const d = diffCatalogs(catalog([{ price: '10' }]), catalog([{ price: '11', currency: 'USD' }]))
    expect(d.increases).toEqual([])
    expect(d.modified[0].fields).toEqual(['currency'])
  })

  it('ne voit aucun changement entre deux catalogues identiques', () => {
    const d = diffCatalogs(before, before)
    expect(d.hasChanges).toBe(false)
    expect(d.unchangedCount).toBe(4)
  })

  it('compare une nouvelle version réaliste d’un fichier fournisseur', () => {
    // airalo.csv du jour : 2 produits retirés, 3 prix modifiés, 1 produit ajouté.
    const lines = defaultCsvFiles['airalo.csv'].trim().split('\n')
    const [header, ...rows] = lines
    const reprice = (line: string, factor: number) => {
      const cells = line.split(',')
      cells[8] = (Number(cells[8]) * factor).toFixed(2)
      return cells.join(',')
    }
    const updated = [
      header,
      reprice(rows[0], 0.9),
      reprice(rows[1], 0.8),
      reprice(rows[2], 1.05),
      ...rows.slice(3, -2),
      'airalo-999999,Airalo,eSIM Japon 3 Go 7 jours,JP,Japon,3,3 Go,7,8.5,EUR,5G,oui',
    ].join('\n')
    const d = diffCatalogs(
      buildCatalog(defaultCsvFiles).products,
      buildCatalog({ ...defaultCsvFiles, 'airalo.csv': updated }).products,
    )
    expect(d.added.map((p) => p.sku)).toEqual(['airalo-999999'])
    expect(d.removed).toHaveLength(2)
    expect(d.decreases).toHaveLength(2)
    expect(d.increases).toHaveLength(1)
    expect(d.unchangedCount).toBe(5056 - 2 - 3)
    expect(d.byProvider.map((p) => p.provider)).toEqual(['Airalo'])
  })
})
