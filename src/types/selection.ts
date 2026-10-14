import type { Product } from './catalog'

export type SortKey = 'destination' | 'provider' | 'data' | 'validityDays' | 'price' | 'pricePerGb'

export interface SortOrder {
  key: SortKey
  direction: 'asc' | 'desc'
}

/**
 * Sélection de produits affichée dans le panneau de détail. Elle est décrite par un filtre
 * (et non une liste figée) : elle reste juste si le catalogue change pendant qu'elle est ouverte.
 */
export interface ProductSelection {
  /** Identifiant stable, utilisé pour le nom du fichier exporté. */
  id: string
  title: string
  description?: string
  filter: (product: Product) => boolean
  sort?: SortOrder
  /** Présent pour une sélection d'un seul produit : le panneau affiche alors sa fiche. */
  product?: Product
}
