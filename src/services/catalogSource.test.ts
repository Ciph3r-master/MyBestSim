import { describe, expect, it } from 'vitest'
import { applyImport, enableAllFiles, initialSource, isPristine, toggleFile } from './catalogSource'

const original = { 'a.csv': 'A', 'b.csv': 'B' }

describe('applyImport', () => {
  it('ajoute un fichier en mode « Ajouter »', () => {
    const { source, overwritten } = applyImport(initialSource(original), { 'c.csv': 'C' }, 'merge')
    expect(source.files).toEqual({ 'a.csv': 'A', 'b.csv': 'B', 'c.csv': 'C' })
    expect(source.imported).toEqual(['c.csv'])
    expect(overwritten).toEqual([])
  })

  it('remplace un fichier de même nom et le signale comme mis à jour', () => {
    const { source, overwritten } = applyImport(initialSource(original), { 'a.csv': 'A v2' }, 'merge')
    expect(source.files['a.csv']).toBe('A v2')
    expect(overwritten).toEqual(['a.csv'])
  })

  it('réactive un fichier désactivé quand on en importe une nouvelle version', () => {
    const disabled = toggleFile(toggleFile(initialSource(original), 'a.csv'), 'b.csv')
    const { source } = applyImport(disabled, { 'a.csv': 'A v2' }, 'merge')
    expect([...source.disabled]).toEqual(['b.csv'])
  })

  it('ne garde que les fichiers importés en mode « Remplacer », tous actifs', () => {
    const disabled = toggleFile(initialSource(original), 'a.csv')
    const { source, overwritten } = applyImport(disabled, { 'c.csv': 'C' }, 'replace')
    expect(source.files).toEqual({ 'c.csv': 'C' })
    expect(source.imported).toEqual(['c.csv'])
    expect(source.disabled.size).toBe(0)
    expect(overwritten).toEqual([])
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
