/**
 * État de la vue partagé dans l'URL (?view=quality&provider=Airalo&destination=Japon&validity=30),
 * pour qu'un lien copié rouvre exactement la même vue. L'adresse est remplacée sans créer d'entrée
 * d'historique : le bouton « Précédent » ne rejoue pas chaque clic.
 */
export type UrlParam = 'view' | 'provider' | 'destination' | 'validity'

/** Ancien lien direct vers l'onglet Qualité, toujours accepté. */
const LEGACY_QUALITY_HASH = '#qualite'

export function parseUrlState(search: string, hash: string): Partial<Record<UrlParam, string>> {
  const params = new URLSearchParams(search)
  const state: Partial<Record<UrlParam, string>> = {}
  for (const key of ['view', 'provider', 'destination', 'validity'] as const) {
    const value = params.get(key)?.trim()
    if (value) state[key] = value
  }
  if (!state.view && hash === LEGACY_QUALITY_HASH) state.view = 'quality'
  return state
}

/** Applique des modifications à une query string (`null` retire le paramètre). */
export function updateSearch(search: string, updates: Partial<Record<UrlParam, string | null>>): string {
  const params = new URLSearchParams(search)
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') params.delete(key)
    else params.set(key, value)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const readUrlParam = (key: UrlParam): string | null =>
  parseUrlState(window.location.search, window.location.hash)[key] ?? null

export function writeUrlParams(updates: Partial<Record<UrlParam, string | null>>) {
  const { pathname, search, hash } = window.location
  const next = `${pathname}${updateSearch(search, updates)}${hash === LEGACY_QUALITY_HASH ? '' : hash}`
  if (next !== `${pathname}${search}${hash}`) window.history.replaceState(null, '', next)
}
