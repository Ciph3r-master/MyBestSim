import { describe, expect, it } from 'vitest'
import { classifyDestination, sameCountryName } from './destinations'

describe('sameCountryName', () => {
  it.each([
    ['Vietnam', 'Viêt Nam'],
    ['Rép. dominicaine', 'République dominicaine'],
    ['Royaume Uni', 'Royaume-Uni'],
    ['Corée du Sud', 'corée du sud'],
  ])('reconnaît « %s » = « %s »', (a, b) => expect(sameCountryName(a, b)).toBe(true))

  it.each([
    ['Europe', 'Union européenne'],
    ['Guinée', 'Guinée équatoriale'],
    ['Asie', 'Samoa américaines'],
    ['Corée', 'Corée du Sud'],
  ])('distingue « %s » de « %s »', (a, b) => expect(sameCountryName(a, b)).toBe(false))
})

describe('classifyDestination', () => {
  it('reconnaît les pays, variantes d’écriture comprises', () => {
    expect(classifyDestination('FR', 'France').kind).toBe('country')
    expect(classifyDestination('VN', 'Vietnam').kind).toBe('country')
    expect(classifyDestination('DO', 'Rép. dominicaine').kind).toBe('country')
  })

  it('détecte les zones du jeu de données sans liste écrite en dur', () => {
    expect(classifyDestination('WW', 'Monde')).toEqual({ kind: 'unknown-code', isoName: null })
    expect(classifyDestination('NA', 'Amérique du Nord')).toEqual({ kind: 'other-meaning', isoName: 'Namibie' })
    expect(classifyDestination('AS', 'Asie').kind).toBe('other-meaning')
    expect(classifyDestination('EU', 'Europe').kind).toBe('other-meaning')
  })

  it('détecte une zone inédite', () => {
    expect(classifyDestination('AF', 'Afrique')).toEqual({ kind: 'other-meaning', isoName: 'Afghanistan' })
  })

  it('signale aussi un nom non officiel : limite assumée', () => {
    expect(classifyDestination('US', 'USA').kind).toBe('other-meaning')
  })

  it('traite « ZZ » (région inconnue) et un code mal formé comme inconnus', () => {
    expect(classifyDestination('ZZ', 'Inconnu').kind).toBe('unknown-code')
    expect(classifyDestination('XYZ', 'Quelque part').kind).toBe('unknown-code')
  })
})
