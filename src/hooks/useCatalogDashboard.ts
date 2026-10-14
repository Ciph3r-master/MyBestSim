import { useCallback, useMemo, useState } from 'react'
import { computeStats } from '@/services/catalogStats'
import { computeQualityReport } from '@/services/dataQuality'
import { useCatalog } from './useCatalog'

/**
 * État du dashboard : fournisseur sélectionné et statistiques associées.
 * `globalStats` reste calculé sur tout le catalogue pour les vues comparatives,
 * et le rapport qualité porte toujours sur l'ensemble des fichiers chargés.
 */
export function useCatalogDashboard() {
  const { catalog } = useCatalog()
  const [selectedProvider, setProvider] = useState<string | null>(null)

  // Un fournisseur sélectionné qui disparaît après un import n'est plus appliqué.
  const provider = selectedProvider && catalog.providers.includes(selectedProvider) ? selectedProvider : null

  const globalStats = useMemo(() => computeStats(catalog.products), [catalog])
  const qualityReport = useMemo(() => computeQualityReport(catalog), [catalog])

  const stats = useMemo(
    () => (provider ? computeStats(catalog.products.filter((p) => p.provider === provider)) : globalStats),
    [catalog, provider, globalStats],
  )

  const toggleProvider = useCallback(
    (name: string) => setProvider((current) => (current === name ? null : name)),
    [],
  )

  return { catalog, provider, setProvider, toggleProvider, stats, globalStats, qualityReport }
}
