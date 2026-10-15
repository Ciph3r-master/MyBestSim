import { describe, expect, it } from 'vitest'
import { csv } from '@/test/csv'
import { buildCatalog } from './catalogLoader'
import { diffCatalogs } from './catalogDiff'
import { applyImport, enableAllFiles, initialSource, isPristine, toggleFile } from './catalogSource'

const original = { 'a.csv': 'A', 'b.csv': 'B' }

describe('applyImport', () => {
  it('ajoute un fichier en mode « Ajouter »', () => {
    const { source, replacements } = applyImport(initialSource(original), { 'c.csv': 'C' }, 'merge')
    expect(source.files).toEqual({ 'a.csv': 'A', 'b.csv': 'B', 'c.csv': 'C' })
    expect(source.imported).toEqual(['c.csv'])
    expect(replacements).toEqual([])
  })

  it('remplace un fichier de même nom et le signale comme mis à jour', () => {
    const { source, replacements } = applyImport(initialSource(original), { 'a.csv': 'A v2' }, 'merge')
    expect(source.files['a.csv']).toBe('A v2')
    expect(replacements).toEqual([{ file: 'a.csv', replaces: ['a.csv'], provider: null }])
  })

  it('réactive un fichier désactivé quand on en importe une nouvelle version', () => {
    const disabled = toggleFile(toggleFile(initialSource(original), 'a.csv'), 'b.csv')
    const { source } = applyImport(disabled, { 'a.csv': 'A v2' }, 'merge')
    expect([...source.disabled]).toEqual(['b.csv'])
  })

  it('ne garde que les fichiers importés en mode « Remplacer », tous actifs', () => {
    const disabled = toggleFile(initialSource(original), 'a.csv')
    const { source, replacements } = applyImport(disabled, { 'c.csv': 'C' }, 'replace')
    expect(source.files).toEqual({ 'c.csv': 'C' })
    expect(source.imported).toEqual(['c.csv'])
    expect(source.disabled.size).toBe(0)
    expect(replacements).toEqual([])
  })

  it('ne change rien si aucun fichier n’a pu être lu', () => {
    const start = initialSource(original)
    expect(applyImport(start, {}, 'replace').source).toBe(start)
  })

  it('ne compte pas deux fois un fichier importé deux fois', () => {
    const once = applyImport(initialSource(original), { 'c.csv': 'C' }, 'merge').source
    expect(applyImport(once, { 'c.csv': 'C v2' }, 'merge').source.imported).toEqual(['c.csv'])
  })
})

describe('reconnaissance du fournisseur par le contenu', () => {
  const v1 = csv([{ sku: 'airalo-1', provider: 'Airalo', price: '10' }, { sku: 'airalo-2', provider: 'Airalo' }])
  const v2 = csv([{ sku: 'airalo-1', provider: 'Airalo', price: '9' }, { sku: 'airalo-3', provider: 'Airalo' }])
  const other = csv([{ sku: 'saily-1', provider: 'Saily' }])
  const start = initialSource({ 'airalo.csv': v1, 'saily.csv': other })

  it('remplace la version précédente d’un fournisseur quel que soit le nom du fichier', () => {
    const { source, replacements } = applyImport(start, { 'airalo_2026-10-15.csv': v2 }, 'merge')
    expect(Object.keys(source.files).sort()).toEqual(['airalo_2026-10-15.csv', 'saily.csv'])
    expect(replacements).toEqual([{ file: 'airalo_2026-10-15.csv', replaces: ['airalo.csv'], provider: 'Airalo' }])
  })

  it('compare la nouvelle version à l’ancienne (et non à un catalogue contenant les deux)', () => {
    const { source } = applyImport(start, { 'airalo_2026-10-15.csv': v2 }, 'merge')
    const diff = diffCatalogs(buildCatalog(start.files).products, buildCatalog(source.files).products)
    expect(diff.added.map((p) => p.sku)).toEqual(['airalo-3'])
    expect(diff.removed.map((p) => p.sku)).toEqual(['airalo-2'])
    expect(diff.decreases.map((c) => c.after.sku)).toEqual(['airalo-1'])
    // Le SKU airalo-1, présent dans les deux versions, n'est pas signalé en double.
    expect(buildCatalog(source.files).duplicateSkus).toEqual([])
  })

  it('ajoute simplement un nouveau fournisseur ou un fichier mélangeant plusieurs fournisseurs', () => {
    const mixed = csv([{ sku: 'x-1', provider: 'Airalo' }, { sku: 'x-2', provider: 'Saily' }])
    const { source, replacements } = applyImport(start, { 'nouveau.csv': csv([{ provider: 'Holafly' }]), 'mix.csv': mixed }, 'merge')
    expect(Object.keys(source.files)).toHaveLength(4)
    expect(replacements).toEqual([])
  })

  it('remplace aussi une ancienne version désactivée, la nouvelle étant active', () => {
    const off = toggleFile(start, 'airalo.csv')
    const { source } = applyImport(off, { 'airalo_v2.csv': v2 }, 'merge')
    expect(source.files['airalo.csv']).toBeUndefined()
    expect(source.disabled.size).toBe(0)
  })
})

describe('activation des fichiers', () => {
  it('bascule un fichier entre actif et désactivé', () => {
    const off = toggleFile(initialSource(original), 'a.csv')
    expect(off.disabled.has('a.csv')).toBe(true)
    expect(toggleFile(off, 'a.csv').disabled.has('a.csv')).toBe(false)
  })

  it('redevient « données d’origine » une fois tout réactivé', () => {
    const start = initialSource(original)
    const off = toggleFile(start, 'a.csv')
    expect(isPristine(off, original)).toBe(false)
    expect(isPristine(enableAllFiles(off), original)).toBe(true)
    expect(isPristine(toggleFile(off, 'a.csv'), original)).toBe(true)
  })

  it('ne considère plus le catalogue comme d’origine après un import', () => {
    const { source } = applyImport(initialSource(original), { 'c.csv': 'C' }, 'merge')
    expect(isPristine(source, original)).toBe(false)
  })
})
