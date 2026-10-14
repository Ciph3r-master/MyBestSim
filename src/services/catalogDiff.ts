import type { Product } from '@/types/catalog'

/**
 * Comparaison de deux états du catalogue (avant / après un import), produit par produit via le SKU.
 * C'est la question d'un import quotidien : « qu'est-ce qui a changé depuis la dernière version ? »
 */

export interface PriceChange {
  before: Product
  after: Product
  /** Variation relative du prix (0,05 = +5 %). */
  change: number
}

export type ChangedField = 'productName' | 'destination' | 'data' | 'validityDays' | 'network' | 'topUp' | 'currency'

export interface FieldChange {
  before: Product
  after: Product
  fields: ChangedField[]
}

export interface ProviderDiff {
  provider: string
  added: number
  removed: number
  increases: number
  decreases: number
  /** Variation moyenne des prix modifiés, `null` si aucun prix n'a changé. */
  averageChange: number | null
}

export interface CatalogDiff {
  added: Product[]
  removed: Product[]
  increases: PriceChange[]
  decreases: PriceChange[]
  /** Changements autres que le prix (réseau, recharge, volume…). */
  modified: FieldChange[]
  unchangedCount: number
  averageChange: number | null
  byProvider: ProviderDiff[]
  hasChanges: boolean
}

const FIELD_ACCESSORS: Record<ChangedField, (p: Product) => unknown> = {
  productName: (p) => p.productName,
  destination: (p) => `${p.countryCode}|${p.countryName}`,
  data: (p) => p.dataGb,
  validityDays: (p) => p.validityDays,
  network: (p) => p.network,
  topUp: (p) => p.topUp,
  currency: (p) => p.currency,
}

/** Nombre de produits concernés par un changement (un produit à la fois repricé et modifié compte une fois). */
export function countChanges(diff: CatalogDiff): number {
  const touched = new Set([...diff.increases, ...diff.decreases, ...diff.modified].map((c) => c.after.sku))
  return diff.added.length + diff.removed.length + touched.size
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function diffCatalogs(before: Product[], after: Product[]): CatalogDiff {
  const previous = new Map(before.map((p) => [p.sku, p]))
  const current = new Map(after.map((p) => [p.sku, p]))

  const added = after.filter((p) => !previous.has(p.sku))
  const removed = before.filter((p) => !current.has(p.sku))
  const priceChanges: PriceChange[] = []
  const modified: FieldChange[] = []
  let unchangedCount = 0

  for (const next of after) {
    const prev = previous.get(next.sku)
    if (!prev) continue
    const fields = (Object.keys(FIELD_ACCESSORS) as ChangedField[]).filter(
      (f) => FIELD_ACCESSORS[f](prev) !== FIELD_ACCESSORS[f](next),
    )
    // Un prix n'est comparable que dans la même devise : sinon c'est un changement de devise, pas une hausse.
    const priceChanged = prev.price !== next.price && prev.currency === next.currency
    if (priceChanged) priceChanges.push({ before: prev, after: next, change: next.price / prev.price - 1 })
    if (fields.length) modified.push({ before: prev, after: next, fields })
    if (!priceChanged && !fields.length) unchangedCount++
  }

  const byMagnitude = (a: PriceChange, b: PriceChange) => Math.abs(b.change) - Math.abs(a.change)
  const increases = priceChanges.filter((c) => c.change > 0).sort(byMagnitude)
  const decreases = priceChanges.filter((c) => c.change < 0).sort(byMagnitude)

  const providers = [...new Set([...added, ...removed, ...priceChanges.map((c) => c.after)].map((p) => p.provider))]
  const byProvider = providers
    .map((provider) => {
      const changes = priceChanges.filter((c) => c.after.provider === provider)
      return {
        provider,
        added: added.filter((p) => p.provider === provider).length,
        removed: removed.filter((p) => p.provider === provider).length,
        increases: changes.filter((c) => c.change > 0).length,
        decreases: changes.filter((c) => c.change < 0).length,
        averageChange: mean(changes.map((c) => c.change)),
      }
    })
    .sort((a, b) => b.added + b.removed + b.increases + b.decreases - (a.added + a.removed + a.increases + a.decreases))

  return {
    added,
    removed,
    increases,
    decreases,
    modified,
    unchangedCount,
    averageChange: mean(priceChanges.map((c) => c.change)),
    byProvider,
    hasChanges: added.length + removed.length + priceChanges.length + modified.length > 0,
  }
}
