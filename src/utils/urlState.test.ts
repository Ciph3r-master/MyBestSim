import { describe, expect, it } from 'vitest'
import { parseUrlState, updateSearch } from './urlState'

describe('parseUrlState', () => {
  it('lit les paramètres de la vue', () => {
    expect(parseUrlState('?view=quality&provider=Maya%20Mobile&destination=%C3%89gypte&validity=15', '')).toEqual({
      view: 'quality',
      provider: 'Maya Mobile',
      destination: 'Égypte',
      validity: '15',
    })
  })

  it('ignore les paramètres vides ou inconnus', () => {
    expect(parseUrlState('?provider=&foo=bar', '')).toEqual({})
  })

  it('accepte encore l’ancien lien #qualite', () => {
    expect(parseUrlState('', '#qualite')).toEqual({ view: 'quality' })
    expect(parseUrlState('?view=stats', '#qualite').view).toBe('stats')
  })
})

describe('updateSearch', () => {
  it('ajoute, modifie et retire des paramètres en conservant les autres', () => {
    expect(updateSearch('?provider=Airalo&utm=mail', { provider: 'Saily', view: 'quality' })).toBe(
      '?provider=Saily&utm=mail&view=quality',
    )
    expect(updateSearch('?provider=Airalo', { provider: null })).toBe('')
  })

  it('encode les caractères spéciaux et les accents', () => {
    expect(updateSearch('', { destination: 'Rép. dominicaine' })).toBe('?destination=R%C3%A9p.+dominicaine')
    expect(parseUrlState(updateSearch('', { destination: 'Rép. dominicaine' }), '').destination).toBe('Rép. dominicaine')
  })
})
