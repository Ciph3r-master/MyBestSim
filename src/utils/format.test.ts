import { describe, expect, it } from 'vitest'
import { plainSpaces } from '@/test/csv'
import { formatCount, formatCurrency, formatOptionalCurrency, formatPercent, formatSignedPercent } from './format'

describe('format', () => {
  it('formate les montants en euros à la française', () => {
    expect(plainSpaces(formatCurrency(1234.5))).toBe('1 234,50 €')
  })

  it('affiche « - » pour un indicateur de prix indisponible', () => {
    expect(formatOptionalCurrency(null)).toBe('-')
    expect(plainSpaces(formatOptionalCurrency(29.3))).toBe('29,30 €')
  })

  it('accorde les libellés au nombre, y compris les expressions composées', () => {
    expect(formatCount(1, 'fichier')).toBe('1 fichier')
    expect(formatCount(3, 'fichier')).toBe('3 fichiers')
    expect(formatCount(2, 'ligne rejetée', 'lignes rejetées')).toBe('2 lignes rejetées')
    expect(formatCount(0, 'produit')).toBe('0 produit')
  })

  it('signe les pourcentages sans jamais afficher « -0 % »', () => {
    expect(formatSignedPercent(0.123)).toBe('+12 %')
    expect(formatSignedPercent(-0.0042, 1)).toBe('-0,4 %')
    expect(formatSignedPercent(-0.001)).toBe('0 %')
    expect(formatPercent(0.5)).toBe('50 %')
  })
})
