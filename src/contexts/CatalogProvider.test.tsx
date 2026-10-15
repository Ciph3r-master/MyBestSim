// @vitest-environment jsdom
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { csv } from '@/test/csv'
import { useCatalog } from '@/hooks/useCatalog'
import { ImportNotice } from '@/components/import/ImportNotice'
import { CatalogProvider } from './CatalogProvider'
import type { CatalogContextValue } from './catalogContext'

afterEach(cleanup)

const INITIAL = { 'testsim.csv': csv([{}]) }

const providerFile = (name: string, provider: string) =>
  new File([csv([{ sku: `${name}-1`, provider }])], `${name}.csv`, { type: 'text/csv' })

/** Rend le provider et donne accès à la valeur du contexte, toujours à jour. */
function renderProvider() {
  const current: { value: CatalogContextValue | null } = { value: null }
  function Probe() {
    const value = useCatalog()
    useEffect(() => {
      current.value = value
    })
    return null
  }
  render(
    <CatalogProvider initialFiles={INITIAL}>
      <Probe />
      <ImportNotice qualityAlerts={0} onShowQuality={() => {}} onShowChanges={() => {}} />
    </CatalogProvider>,
  )
  return () => current.value!
}

describe('CatalogProvider', () => {
  it('garde les deux fichiers quand deux imports se chevauchent', async () => {
    const ctx = renderProvider()
    // Deux imports lancés coup sur coup (deux glisser-déposer rapides), avec la même valeur de contexte.
    const { importFiles } = ctx()
    await act(() => Promise.all([importFiles([providerFile('alpha', 'Alpha')]), importFiles([providerFile('beta', 'Beta')])]))

    expect([...ctx().catalog.providers].sort()).toEqual(['Alpha', 'Beta', 'TestSIM'])
    expect(ctx().importedFiles).toEqual(['alpha.csv', 'beta.csv'])
  })

  it('calcule les changements apportés par un import', async () => {
    const ctx = renderProvider()
    await act(() => ctx().importFiles([providerFile('alpha', 'Alpha')]))
    expect(ctx().lastChanges?.diff.hasChanges).toBe(true)
    expect(ctx().lastChanges?.files).toEqual(['alpha.csv'])
  })

  it('affiche une erreur inattendue au lieu d’échouer en silence, sans modifier le catalogue', async () => {
    const ctx = renderProvider()
    const before = ctx().catalog
    const unreadable: Iterable<File> = {
      [Symbol.iterator]() {
        throw new Error('dossier illisible')
      },
    }
    const result = await act(() => ctx().importFiles(unreadable))

    expect(result.error).toBe('dossier illisible')
    expect(ctx().catalog).toBe(before)
    expect(screen.getByRole('alert').textContent).toContain('L’import a échoué : dossier illisible.')
  })
})
