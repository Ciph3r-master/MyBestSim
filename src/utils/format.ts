const LOCALE = 'fr-FR'

// Créer un formateur Intl est coûteux ; `toLocaleString` en recrée un à chaque appel.
// On les met en cache : des milliers de valeurs sont formatées au chargement.
const formatters = new Map<string, Intl.NumberFormat>()
function formatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options)
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, options)
    formatters.set(key, f)
  }
  return f
}

export const formatCurrency = (n: number) => formatter({ style: 'currency', currency: 'EUR' }).format(n)

export const formatNumber = (n: number, decimals = 0) =>
  formatter({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)

/** Prix dans la devise du produit ; une devise invalide (ex. colonnes décalées) est affichée telle quelle. */
export const formatPrice = (price: number, currency: string) => {
  try {
    return formatter({ style: 'currency', currency }).format(price)
  } catch {
    return `${formatNumber(price, 2)} ${currency || '?'}`
  }
}

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
