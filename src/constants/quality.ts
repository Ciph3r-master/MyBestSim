import type { IconName } from '@/components/ui/Icon'
import type { QualityStatus } from '@/types/quality'

/** Ancre d'un contrôle qualité dans l'onglet Qualité, pour y renvoyer depuis les statistiques. */
export const qualityCheckAnchor = (checkId: string) => `check-${checkId}`

export const STATUS_META: Record<QualityStatus, { label: string; countLabel: (n: number) => string; icon: IconName }> = {
  ok: { label: 'Validé', countLabel: (n) => (n > 1 ? 'validés' : 'validé'), icon: 'check' },
  info: { label: 'À savoir', countLabel: () => 'à savoir', icon: 'info' },
  warning: { label: 'À surveiller', countLabel: () => 'à surveiller', icon: 'alert' },
  error: { label: 'Erreur', countLabel: (n) => (n > 1 ? 'erreurs' : 'erreur'), icon: 'error' },
}
