import { useContext } from 'react'
import { ProductDetailContext } from '@/contexts/productDetailContext'

export function useProductDetail() {
  const context = useContext(ProductDetailContext)
  if (!context) throw new Error('useProductDetail doit être utilisé dans un <ProductDetailProvider>')
  return context
}
