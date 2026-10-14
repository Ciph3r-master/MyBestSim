import { useContext } from 'react'
import { CatalogContext } from '@/contexts/catalogContext'

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog doit être utilisé dans un <CatalogProvider>')
  return context
}
