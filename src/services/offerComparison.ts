import type { Product } from '@/types/catalog'
import { BASE_CURRENCY } from '@/constants/catalog'
import { isIsoCountry } from '@/services/destinations'
import { median } from '@/services/catalogStats'

export interface DestinationOption {
  name: string
  count: number
  /** `false` pour une zone ou une destination non reconnue comme pays ISO. */
  isCountry: boolean
}

export interface ComparedOffer {
  product: Product
  /** Position de l'enveloppe de data sur l'axe (0 = plus petit volume). */
  tierIndex: number
  pricePerGb: number | null
}

export interface BestOffer extends ComparedOffer {
  tier: string
  /** Écart relatif à la médiane des offres de la même enveloppe (négatif = moins cher). */
  gapToMedian: number
  offerCount: number
}

export interface OfferComparison {
  tiers: string[]
  offers: ComparedOffer[]
  best: BestOffer[]
}

const tierOrder = (p: Product) => p.dataGb ?? Infinity

/** Destinations triées par nombre d'offres comparables (prix en devise de référence). */
export function listDestinations(products: Product[]): DestinationOption[] {
  const byName = new Map<string, { count: number; isCountry: boolean }>()
  for (const p of products) {
    if (p.currency !== BASE_CURRENCY) continue
    const entry = byName.get(p.countryName) ?? { count: 0, isCountry: isIsoCountry(p) }
    entry.count++
    byName.set(p.countryName, entry)
  }
  return [...byName].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count)
}

export function listValidities(products: Product[]): number[] {
  return [...new Set(products.map((p) => p.validityDays))].sort((a, b) => a - b)
}

/**
 * Offres d'une destination pour une durée donnée (`null` = toutes durées), en devise de référence,
 * et meilleure offre de chaque enveloppe de data.
 */
export function compareOffers(products: Product[], destination: string, validity: number | null): OfferComparison {
  const selection = products.filter(
    (p) =>
      p.countryName === destination &&
      p.currency === BASE_CURRENCY &&
      (validity == null || p.validityDays === validity),
  )

  const tierProducts = [...new Map(selection.map((p) => [p.dataDisplay, p])).values()].sort(
    (a, b) => tierOrder(a) - tierOrder(b),
  )
  const tiers = tierProducts.map((p) => p.dataDisplay)
  const indexOf = new Map(tiers.map((t, i) => [t, i]))

  const offers: ComparedOffer[] = selection.map((product) => ({
    product,
    tierIndex: indexOf.get(product.dataDisplay) ?? 0,
    pricePerGb: product.dataGb ? product.price / product.dataGb : null,
  }))

  const best = tiers.flatMap((tier) => {
    const group = offers.filter((o) => o.product.dataDisplay === tier)
    const cheapest = group.reduce((a, b) => (b.product.price < a.product.price ? b : a))
    const m = median(group.map((o) => o.product.price)) ?? cheapest.product.price
    return [{ ...cheapest, tier, gapToMedian: cheapest.product.price / m - 1, offerCount: group.length }]
  })

  return { tiers, offers, best }
}
