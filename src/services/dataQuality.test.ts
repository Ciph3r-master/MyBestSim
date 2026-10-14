import { describe, expect, it } from 'vitest'
import { csv, plainSpaces } from '@/test/csv'
import { buildCatalog, defaultCsvFiles } from './catalogLoader'
import { computeQualityReport } from './dataQuality'

const reportFor = (files: Record<string, string>) => computeQualityReport(buildCatalog(files))
const check = (report: ReturnType<typeof reportFor>, id: string) => report.checks.find((c) => c.id === id)!
const file = (report: ReturnType<typeof reportFor>, name: string) => report.files.find((f) => f.fileName === name)!

describe('rapport qualité sur le jeu MyBestSim', () => {
  const report = reportFor(defaultCsvFiles)

  it('valide la structure, l’unicité et la cohérence', () => {
    for (const id of ['schema', 'invalid-rows', 'provider-files', 'duplicate-sku', 'identical-rows', 'currency', 'product-name', 'country-codes', 'price-outliers'])
      expect(check(report, id).status, id).toBe('ok')
  })

  it('signale les 4 zones et les 620 offres déclinées en variantes', () => {
    expect(check(report, 'non-country-destinations')).toMatchObject({ status: 'warning', exampleCount: 4 })
    expect(plainSpaces(check(report, 'variants').value)).toBe('620 offres · 1 351 lignes')
  })

  it('valide chacun des 18 fichiers (les constats de jeu de données ne sont pas imputés aux fichiers)', () => {
    expect(report.files).toHaveLength(18)
    expect(report.files.every((f) => f.status === 'ok')).toBe(true)
  })
})

describe('attribution des anomalies aux fichiers', () => {
  const base = { 'testsim.csv': csv([{}, { country_name: 'Japon', country_code: 'JP' }]) }

  it('impute une devise étrangère au fichier concerné (cas remonté en test manuel)', () => {
    const report = reportFor({ ...base, 'usdsim.csv': csv([{ sku: 'usdsim-1', currency: 'USD' }]) })
    expect(check(report, 'currency').status).toBe('warning')
    expect(file(report, 'usdsim.csv')).toMatchObject({
      status: 'warning',
      issues: [{ status: 'warning', text: '1 ligne en USD' }],
    })
    expect(file(report, 'testsim.csv').status).toBe('ok')
  })

  it('signale comme hors EUR un catalogue entièrement dans une autre devise', () => {
    const report = reportFor({ 'usdsim.csv': csv([{ sku: 'usdsim-1', currency: 'USD' }]) })
    expect(check(report, 'currency').status).toBe('warning')
  })

  it('donne au fichier le statut le plus grave de ses anomalies', () => {
    const report = reportFor({
      ...base,
      'badsim.csv': csv([{ sku: 'badsim-1', price: '' }, { sku: 'testsim-1' }]),
    })
    const bad = file(report, 'badsim.csv')
    expect(bad.status).toBe('error')
    expect(bad.issues.map((i) => i.text)).toEqual([
      '1 ligne rejetée',
      '1 SKU hors préfixe',
      '1 SKU déjà présent dans un autre fichier',
    ])
  })
})
