import type { Product } from '@/types/catalog'
import type { ProductSelection, SortKey, SortOrder } from '@/types/selection'
import { BASE_CURRENCY } from '@/constants/catalog'
import { PREMIUM_THRESHOLD, PRICE_BUCKETS, comparableKey, dataTierLabel, isPriced, median } from '@/services/catalogStats'
import { isIsoCountry } from '@/services/destinations'

/**
 * Fabriques des sélections ouvertes depuis le dashboard. Une sélection = un titre + un filtre :
 * le panneau de détail l'applique au catalogue courant (fournisseur filtré compris).
 */
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const byPrice: SortOrder = { key: 'price', direction: 'asc' }

export const selections = {
  all: (): ProductSelection => ({ id: 'catalogue', title: 'Toutes les cartes eSIM', filter: () => true, sort: byPrice }),

  premium: (): ProductSelection => ({
    id: 'premium',
    title: `Produits à plus de ${PREMIUM_THRESHOLD} €`,
    description: `Prix strictement supérieur à ${PREMIUM_THRESHOLD} € (produits en ${BASE_CURRENCY}).`,
    filter: (p) => isPriced(p) && p.price > PREMIUM_THRESHOLD,
    sort: { key: 'price', direction: 'desc' },
  }),

  priced: (): ProductSelection => ({
    id: 'prix',
    title: `Produits en ${BASE_CURRENCY}`,
    description: 'Base des indicateurs de prix (fourchette, prix moyen, prix au Go).',
    filter: isPriced,
    sort: byPrice,
  }),

  withData: (): ProductSelection => ({
    id: 'volume-fixe',
    title: 'Forfaits à volume fixe',
    description: 'Base de la data moyenne : les forfaits illimités en sont exclus.',
    filter: (p) => p.dataGb != null,
    sort: { key: 'data', direction: 'desc' },
  }),

  priceBucket: (name: string): ProductSelection => {
    const bucket = PRICE_BUCKETS.find((b) => b.name === name)
    return {
      id: `prix-${slug(name)}`,
      title: bucket && bucket.max === Infinity ? `Produits à ${bucket.min} € et plus` : `Produits de ${name} €`,
      filter: (p) => !!bucket && isPriced(p) && p.price >= bucket.min && p.price < bucket.max,
      sort: byPrice,
    }
  },

  dataTier: (name: string): ProductSelection => ({
    id: `data-${slug(name)}`,
    title: name === 'Illimité' ? 'Forfaits illimités' : `Forfaits ${name}`,
    filter: (p) => dataTierLabel(p) === name,
    sort: byPrice,
  }),

  destination: (name: string): ProductSelection => ({
    id: `destination-${slug(name)}`,
    title: `Offres · ${name}`,
    filter: (p) => p.countryName === name,
    sort: { key: 'data', direction: 'asc' },
  }),

  network: (network: string): ProductSelection => ({
    id: `reseau-${slug(network)}`,
    title: `Forfaits compatibles ${network}`,
    filter: (p) => p.network === network,
    sort: byPrice,
  }),

  topUp: (): ProductSelection => ({ id: 'rechargeables', title: 'Forfaits rechargeables', filter: (p) => p.topUp, sort: byPrice }),

  validity: (days: number): ProductSelection => ({
    id: `validite-${days}-jours`,
    title: `Forfaits de ${days} jours`,
    filter: (p) => p.validityDays === days,
    sort: byPrice,
  }),

  provider: (name: string): ProductSelection => ({
    id: `fournisseur-${slug(name)}`,
    title: `Produits ${name}`,
    filter: (p) => p.provider === name,
    sort: { key: 'data', direction: 'asc' },
  }),

  product: (product: Product): ProductSelection => ({
    id: slug(product.sku),
    title: product.productName,
    description: product.provider,
    filter: (p) => p.sku === product.sku,
    product,
  }),

  /** Liste explicite de produits (ex. produits ajoutés par un import). */
  skus: (id: string, title: string, skus: ReadonlySet<string>, description?: string): ProductSelection => ({
    id,
    title,
    description,
    filter: (p) => skus.has(p.sku),
    sort: byPrice,
  }),

  comparable: (product: Product): ProductSelection => ({
    id: `comparables-${slug(product.sku)}`,
    title: `Offres comparables · ${dataTierLabel(product)} · ${product.validityDays} jours`,
    description: `${isIsoCountry(product) ? 'Forfaits pays' : 'Forfaits zones'} de même volume et même durée, en ${BASE_CURRENCY}.`,
    filter: (p) => isPriced(p) && comparableKey(p) === comparableKey(product),
    sort: byPrice,
  }),
}

/** Position d'un produit parmi ses offres comparables (même volume, même durée, pays ou zone). */
export interface ProductInsight {
  comparableCount: number
  /** 1 = le moins cher. */
  rank: number
  /** Écart à la médiane des offres comparables (négatif = moins cher). */
  gapToMedian: number
  /** Même destination, même volume, même durée : rang du produit (1 = meilleure offre). */
  destinationRank: number
  destinationCount: number
}

export function productInsight(product: Product, catalog: Product[]): ProductInsight | null {
  if (!isPriced(product)) return null
  const comparable = catalog.filter((p) => isPriced(p) && comparableKey(p) === comparableKey(product))
  const sameDestination = comparable.filter((p) => p.countryName === product.countryName)
  const m = median(comparable.map((p) => p.price))
  if (!m) return null
  const rankIn = (list: Product[]) => list.filter((p) => p.price < product.price).length + 1
  return {
    comparableCount: comparable.length,
    rank: rankIn(comparable),
    gapToMedian: product.price / m - 1,
    destinationRank: rankIn(sameDestination),
    destinationCount: sameDestination.length,
  }
}

const sortValue: Record<SortKey, (p: Product) => string | number> = {
  destination: (p) => p.countryName,
  provider: (p) => p.provider,
  data: (p) => p.dataGb ?? Infinity,
  validityDays: (p) => p.validityDays,
  price: (p) => p.price,
  pricePerGb: (p) => (p.dataGb ? p.price / p.dataGb : Infinity),
}

export function sortProducts(products: Product[], { key, direction }: SortOrder): Product[] {
  const factor = direction === 'asc' ? 1 : -1
  const value = sortValue[key]
  return [...products].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const cmp =
      typeof va === 'string' || typeof vb === 'string'
        ? String(va).localeCompare(String(vb))
        : va === vb
          ? 0
          : va < vb
            ? -1
            : 1
    return cmp * factor || a.sku.localeCompare(b.sku)
  })
}

/** Recherche plein texte tolérante aux accents (produit, fournisseur, destination, SKU). */
export function searchProducts(products: Product[], query: string): Product[] {
  const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const terms = plain(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return products
  return products.filter((p) => {
    const haystack = plain(`${p.productName} ${p.provider} ${p.countryName} ${p.countryCode} ${p.sku}`)
    return terms.every((t) => haystack.includes(t))
  })
}
