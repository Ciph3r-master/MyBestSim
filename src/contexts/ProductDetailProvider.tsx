import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/types/catalog'
import type { ProductSelection } from '@/types/selection'
import { ProductDrawer } from '@/components/detail/ProductDrawer'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ProductDetailContext } from './productDetailContext'

interface ProductDetailProviderProps {
  /** Produits visibles dans le dashboard (fournisseur filtré compris) : base des sélections. */
  products: Product[]
  /** Catalogue complet, référence du marché pour situer un produit. */
  marketProducts: Product[]
  /** Fournisseur filtré, rappelé dans le panneau. */
  scopeLabel: string | null
  children: ReactNode
}

export function ProductDetailProvider({ products, marketProducts, scopeLabel, children }: ProductDetailProviderProps) {
  // Pile de navigation : sélection d'origine, puis éventuellement la fiche d'un produit cliqué.
  const [stack, setStack] = useState<ProductSelection[]>([])

  const openDetail = useCallback((selection: ProductSelection) => setStack([selection]), [])
  const push = useCallback((selection: ProductSelection) => setStack((s) => [...s, selection]), [])
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  const close = useCallback(() => setStack([]), [])

  const value = useMemo(() => ({ openDetail }), [openDetail])

  return (
    <ProductDetailContext.Provider value={value}>
      {children}
      {stack.length > 0 && (
        <ErrorBoundary>
          <ProductDrawer
            selection={stack[stack.length - 1]}
            canGoBack={stack.length > 1}
            products={products}
            marketProducts={marketProducts}
            scopeLabel={scopeLabel}
            onNavigate={push}
            onBack={back}
            onClose={close}
          />
        </ErrorBoundary>
      )}
    </ProductDetailContext.Provider>
  )
}
