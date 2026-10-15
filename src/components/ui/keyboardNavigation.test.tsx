// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { rovingIndex } from '@/utils/rovingFocus'
import { SegmentedControl } from './SegmentedControl'
import { Tabs } from './Tabs'
import { tabPanelProps } from './tabPanelProps'

afterEach(cleanup)

describe('rovingIndex', () => {
  it('passe à l’élément voisin en boucle et va aux extrémités avec Début / Fin', () => {
    expect(rovingIndex('ArrowRight', 2, 3)).toBe(0)
    expect(rovingIndex('ArrowLeft', 0, 3)).toBe(2)
    expect(rovingIndex('ArrowDown', 0, 3)).toBe(1)
    expect(rovingIndex('Home', 2, 3)).toBe(0)
    expect(rovingIndex('End', 0, 3)).toBe(2)
    expect(rovingIndex('Enter', 0, 3)).toBeNull()
    expect(rovingIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

function TabsDemo() {
  const [view, setView] = useState<'stats' | 'quality' | 'changes'>('stats')
  return (
    <>
      <Tabs
        label="Vue"
        idPrefix="view"
        value={view}
        onChange={setView}
        items={[
          { id: 'stats', label: 'Statistiques' },
          { id: 'quality', label: 'Qualité' },
          { id: 'changes', label: 'Changements' },
        ]}
      />
      <div {...tabPanelProps('view', view)}>Contenu {view}</div>
    </>
  )
}

describe('Tabs', () => {
  it('relie chaque onglet à la zone de contenu', () => {
    render(<TabsDemo />)
    const tab = screen.getByRole('tab', { name: 'Statistiques' })
    const panel = screen.getByRole('tabpanel')
    expect(tab.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
  })

  it('ne garde qu’un arrêt de tabulation et change d’onglet avec les flèches, Début et Fin', () => {
    render(<TabsDemo />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1])

    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[1])
    expect(screen.getByRole('tabpanel').textContent).toBe('Contenu quality')

    fireEvent.keyDown(tabs[1], { key: 'End' })
    expect(document.activeElement).toBe(tabs[2])
    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[0])
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1])
  })
})

function SegmentedDemo() {
  const [validity, setValidity] = useState(7)
  return (
    <SegmentedControl
      label="Durée de validité"
      value={validity}
      onChange={setValidity}
      options={[7, 15, 30].map((v) => ({ value: v, label: `${v} jours` }))}
      classNames={{}}
    />
  )
}

describe('SegmentedControl', () => {
  it('se comporte comme un groupe de boutons radio au clavier', () => {
    render(<SegmentedDemo />)
    expect(screen.getByRole('radiogroup', { name: 'Durée de validité' })).toBeTruthy()
    const radios = screen.getAllByRole('radio')
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1])

    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' })
    expect(radios[2].getAttribute('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(radios[2])

    fireEvent.click(radios[1])
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false'])
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1])
  })
})
