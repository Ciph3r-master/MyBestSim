const LOCALE = 'fr-FR'

export const formatCurrency = (n: number) => n.toLocaleString(LOCALE, { style: 'currency', currency: 'EUR' })

export const formatNumber = (n: number, decimals = 0) =>
  n.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** Indicateur de prix éventuellement indisponible (aucun produit dans la devise de référence). */
export const formatOptionalCurrency = (n: number | null) => (n == null ? '-' : formatCurrency(n))

export const formatPercent = (ratio: number) => `${formatNumber(ratio * 100)} %`

/** Pourcentage signé (« +0,4 % », « -12 % ») ; un écart qui s'arrondit à zéro s'affiche « 0 % », jamais « -0 % ». */
export const formatSignedPercent = (ratio: number, decimals = 0) => {
  const rounded = Number((ratio * 100).toFixed(decimals))
  return `${rounded > 0 ? '+' : ''}${formatNumber(rounded === 0 ? 0 : rounded, decimals)} %`
}

/** « 1 fichier », « 3 fichiers » ; le pluriel est explicite pour les expressions composées. */
export const formatCount = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n > 1 ? many : one}`
