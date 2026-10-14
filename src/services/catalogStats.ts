import type { CatalogStats, CountItem, Product } from '@/types/catalog'
import { BASE_CURRENCY } from '@/constants/catalog'
import { isIsoCountry } from '@/services/destinations'

export const PREMIUM_THRESHOLD = 100
const PRICE_BUCKETS = [0, 10, 20, 30, 50, 75, PREMIUM_THRESHOLD, Infinity]
const TOP_COUNTRIES = 8

const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
/** Moyenne d'un indicateur de prix : `null` plutôt que 0 quand il n'y a rien à moyenner. */
const priceAverage = (xs: number[]) => (xs.length ? average(xs) : null)
const isPriced = (p: Product) => p.currency === BASE_CURRENCY

export function median(xs: number[]): number | null {
  if (!xs.length) return null
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Offres comparables : même volume, même durée, et pays séparés des zones (structurellement plus chères). */
export const comparableKey = (p: Product) => `${isIsoCountry(p)}|${p.dataDisplay}|${p.validityDays}`

/** Écart relatif de chaque produit à la médiane de ses offres comparables (0 = prix médian du marché). */
function gapsToComparableMedian(priced: Product[]): Map<Product, number> {
  const groups = new Map<string, Product[]>()
  for (const p of priced) groups.set(comparableKey(p), [...(groups.get(comparableKey(p)) ?? []), p])
  const gaps = new Map<Product, number>()
  for (const group of groups.values()) {
    const m = median(group.map((p) => p.price))
    if (m) for (const p of group) gaps.set(p, p.price / m - 1)
  }
  return gaps
}
const ratio = (part: number, total: number) => (total ? part / total : 0)
const hasData = (p: Product): p is Product & { dataGb: number } => p.dataGb != null

function countBy<T>(items: T[], key: (item: T) => string): CountItem[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

function extreme(list: Product[], pick: (a: Product, b: Product) => boolean): Product | null {
  return list.reduce<Product | null>((best, p) => (!best || pick(p, best) ? p : best), null)
}

function priceDistribution(list: Product[]): CountItem[] {
  return PRICE_BUCKETS.slice(0, -1).map((lo, i) => {
    const hi = PRICE_BUCKETS[i + 1]
    return {
      name: hi === Infinity ? `${lo}+` : `${lo}–${hi}`,
      count: list.filter((p) => p.price >= lo && p.price < hi).length,
    }
  })
}

function byProvider(list: Product[]) {
  const gaps = gapsToComparableMedian(list.filter(isPriced))
  return countBy(list, (p) => p.provider).map((row) => {
    const priced = list.filter((p) => p.provider === row.name && isPriced(p))
    return {
      ...row,
      avgPrice: priceAverage(priced.map((p) => p.price)),
      pricePerGb: priceAverage(priced.filter(hasData).map((p) => p.price / p.dataGb)),
      priceIndex: priceAverage(priced.flatMap((p) => (gaps.has(p) ? [gaps.get(p)!] : []))),
    }
  })
}

export function computeStats(list: Product[]): CatalogStats {
  // Les prix d'une autre devise ne sont pas additionnables avec des euros : ils sont exclus des indicateurs de prix.
  const priced = list.filter(isPriced)
  const prices = priced.map((p) => p.price)
  const limited = list.filter(hasData)
  const unlimited = list.length - limited.length
  // Tri numérique des enveloppes, « Illimité » (NaN) en dernier.
  const tierOrder = (name: string) => parseFloat(name) || Infinity

  return {
    total: list.length,
    pricedCount: priced.length,
    excludedFromPrices: countBy(
      list.filter((p) => !isPriced(p)),
      (p) => p.currency || 'devise manquante',
    ),
    over100: priced.filter((p) => p.price > PREMIUM_THRESHOLD).length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    cheapest: extreme(priced, (a, b) => a.price < b.price),
    priciest: extreme(priced, (a, b) => a.price > b.price),
    avgPrice: priceAverage(prices),
    medianPrice: median(prices),
    avgData: average(limited.map((p) => p.dataGb)),
    medianData: median(limited.map((p) => p.dataGb)),
    unlimited,
    avgPricePerGb: priceAverage(priced.filter(hasData).map((p) => p.price / p.dataGb)),
    share5G: ratio(list.filter((p) => p.network === '5G').length, list.length),
    shareTopUp: ratio(list.filter((p) => p.topUp).length, list.length),
    shareUnlimited: ratio(unlimited, list.length),
    countries: new Set(list.map((p) => p.countryName)).size,
    byProvider: byProvider(list),
    priceDistribution: priceDistribution(priced),
    dataTiers: countBy(list, (p) => (p.dataGb == null ? 'Illimité' : `${p.dataGb} Go`)).sort(
      (a, b) => tierOrder(a.name) - tierOrder(b.name),
    ),
    topCountries: countBy(list, (p) => p.countryName).slice(0, TOP_COUNTRIES),
    validity: countBy(list, (p) => `${p.validityDays} jours`).sort((a, b) => parseInt(a.name) - parseInt(b.name)),
  }
}
