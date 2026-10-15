// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Broken(): never {
  throw new Error('Failed to fetch dynamically imported module')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('affiche son contenu tant qu’il n’y a pas d’erreur', () => {
    render(<ErrorBoundary>Graphique</ErrorBoundary>)
    expect(screen.getByText('Graphique')).toBeTruthy()
  })

  it('remplace seulement la zone en erreur, avec un bouton pour recharger', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <>
        <p>Reste de la page</p>
        <ErrorBoundary>
          <Broken />
        </ErrorBoundary>
      </>,
    )
    expect(screen.getByText('Reste de la page')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('Cette partie n’a pas pu s’afficher.')
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeTruthy()
  })

  it('affiche un écran de secours plein page en variante page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary variant="page">
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert').textContent).toContain('Le dashboard a rencontré une erreur.')
  })
})
