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

  it('chiffre le surcoût des zones et la part d’illimités', () => {
    expect(check(report, 'zone-premium')).toMatchObject({ status: 'info', value: '+40 % en moyenne' })
    expect(plainSpaces(check(report, 'unlimited').value)).toBe('653 forfaits · 13 %')
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

describe('chaque contrôle détecte son anomalie', () => {
  it('fichier sans les colonnes attendues : erreur de structure, fichier ignoré', () => {
    const report = reportFor({ 'broken.csv': csv([{}], ['sku', 'provider', 'product_name']) })
    expect(check(report, 'schema')).toMatchObject({ status: 'error', value: '0/1 fichiers conformes' })
    expect(file(report, 'broken.csv')).toMatchObject({ status: 'error', validCount: 0 })
    expect(file(report, 'broken.csv').issues[0].text).toMatch(/^colonnes manquantes : /)
  })

  it('fichier contenant deux fournisseurs', () => {
    const report = reportFor({ 'testsim.csv': csv([{ provider: 'A' }, { provider: 'B' }]) })
    expect(check(report, 'provider-files').status).toBe('warning')
    expect(file(report, 'testsim.csv').issues.map((i) => i.text)).toEqual(['2 fournisseurs'])
  })

  it('même produit publié sous deux SKU (prix, réseau et recharge identiques)', () => {
    const report = reportFor({ 'testsim.csv': csv([{}, {}, { price: '11' }]) })
    expect(check(report, 'identical-rows')).toMatchObject({ status: 'warning', value: '1 ligne' })
    expect(check(report, 'identical-rows').examples).toEqual(['eSIM France 5 Go 7 jours (TestSIM) : testsim-1, testsim-2'])
    // Le produit à 11 € est une variante (prix différent), pas un doublon.
    expect(check(report, 'variants').status).toBe('info')
  })

  it('nom produit qui ne correspond pas aux colonnes', () => {
    const report = reportFor({ 'testsim.csv': csv([{}, { product_name: 'eSIM France 50 Go 7 jours', price: '11' }]) })
    expect(check(report, 'product-name')).toMatchObject({ status: 'warning', value: '1 écart' })
    expect(file(report, 'testsim.csv').issues.map((i) => i.text)).toEqual(['1 nom produit incohérent'])
  })

  it('même code de destination avec deux noms différents', () => {
    const report = reportFor({ 'testsim.csv': csv([{}, { country_name: 'Francia' }]) })
    expect(check(report, 'country-codes')).toMatchObject({ status: 'warning', examples: ['FR → France / Francia'] })
  })

  it('prix aberrant au sein d’offres comparables', () => {
    const prices = ['10', '10.5', '11', '10.2', '50']
    const report = reportFor({ 'testsim.csv': csv(prices.map((price) => ({ price }))) })
    expect(check(report, 'price-outliers')).toMatchObject({ status: 'warning', value: '1 prix suspect' })
    expect(file(report, 'testsim.csv').issues.map((i) => i.text)).toEqual(['1 prix suspect'])
  })

  it('ne compare pas un forfait zone aux forfaits pays (zones structurellement plus chères)', () => {
    const rows = ['10', '10.5', '11', '10.2'].map((price) => ({ price }))
    const zone = { country_code: 'WW', country_name: 'Monde', price: '50' }
    const report = reportFor({ 'testsim.csv': csv([...rows, zone]) })
    expect(check(report, 'price-outliers').status).toBe('ok')
  })

  it('prix « 12,5 » non protégé par des guillemets : colonnes décalées, ligne signalée et exclue des prix', () => {
    const raw = csv([{}, {}]).replace(',10,EUR,', ',12,5,EUR,')
    const report = reportFor({ 'testsim.csv': raw })
    // La devise lue est « 5 » : la ligne sort des indicateurs de prix et le fichier est mis en cause.
    expect(check(report, 'currency').status).toBe('warning')
    expect(file(report, 'testsim.csv').issues.map((i) => i.text)).toContain('1 ligne en 5')
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
