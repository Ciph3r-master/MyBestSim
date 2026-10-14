import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { ActiveFilter } from './ActiveFilter'

interface ProviderFilterProps {
  provider: string
  onClear: () => void
}

/** Filtre fournisseur actif, avec accès direct à la liste de ses produits. */
export function ProviderFilter({ provider, onClear }: ProviderFilterProps) {
  const { openDetail } = useProductDetail()
  return (
    <ActiveFilter label={provider} onClear={onClear} onShowProducts={() => openDetail(selections.provider(provider))} />
  )
}
