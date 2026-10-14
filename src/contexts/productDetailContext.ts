import { createContext } from 'react'
import type { ProductSelection } from '@/types/selection'

export interface ProductDetailContextValue {
  /** Ouvre le panneau de détail sur une sélection (remplace la navigation en cours). */
  openDetail: (selection: ProductSelection) => void
}

export const ProductDetailContext = createContext<ProductDetailContextValue | null>(null)
