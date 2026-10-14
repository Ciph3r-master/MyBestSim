import { useCallback, useMemo, useState } from 'react'
import { computeStats } from '@/services/catalogStats'
import { computeQualityReport } from '@/services/dataQuality'
import { readUrlParam } from '@/utils/urlState'
import { useCatalog } from './useCatalog'
import { useSyncUrlParam } from './useUrlState'

/**
 * État du dashboard : fournisseur sélectionné et statistiques associées.
 * `globalStats` reste calculé sur tout le catalogue pour les vues comparatives,
 * et le rapport qualité porte toujours sur l'ensemble des fichiers chargés.
 */
export function useCatalogDashboard() {
  const { catalog } = useCatalog()
  const [selectedProvider, setProvider] = useState<string | null>(() => readUrlParam('provider'))

  // Un fournisseur sélectionné qui disparaît après un import (ou inconnu dans un lien) n'est pas appliqué.
  const provider = selectedProvider && catalog.providers.includes(selectedProvider) ? selectedProvider : null
  useSyncUrlParam('provider', provider)

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

  // Produits visibles avec le filtre fournisseur : base des sélections du panneau de détail.
  const scopedProducts = useMemo(
    () => (provider ? catalog.products.filter((p) => p.provider === provider) : catalog.products),
    [catalog, provider],
  )

  return { catalog, provider, setProvider, toggleProvider, stats, globalStats, qualityReport, scopedProducts }
}
