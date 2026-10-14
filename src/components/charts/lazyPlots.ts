import { lazy } from 'react'

/**
 * Les tracés (et donc la librairie Recharts, ~180 Ko compressés) sont chargés à la demande :
 * le premier affichage (en-tête, chiffres clés) n'attend pas leur téléchargement.
 */
const plots = () => import('./plots')

export const ColumnPlot = lazy(() => plots().then((m) => ({ default: m.ColumnPlot })))
export const ProviderPlot = lazy(() => plots().then((m) => ({ default: m.ProviderPlot })))
export const IndexPlot = lazy(() => plots().then((m) => ({ default: m.IndexPlot })))
export const ComparatorPlot = lazy(() => plots().then((m) => ({ default: m.ComparatorPlot })))
