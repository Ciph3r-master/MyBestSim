import type { CountItem } from '@/types/catalog'
import { COLORS } from '@/constants/theme'
import { LazyRender } from '@/components/ui/LazyRender'
import { ColumnPlot } from './lazyPlots'

interface ColumnChartProps {
  data: CountItem[]
  /** Couleur de chaque colonne en fonction de son libellé. */
  colorFor?: (name: string) => string
  unit?: string
  height?: number
  /** Clic sur une colonne (détail des produits de la catégorie). */
  onSelect?: (name: string) => void
}

export function ColumnChart({ data, colorFor = () => COLORS.accent, unit = 'produits', height = 260, onSelect }: ColumnChartProps) {
  return (
    <LazyRender height={height}>
      <ColumnPlot data={data} colorFor={colorFor} unit={unit} height={height} onSelect={onSelect} />
    </LazyRender>
  )
}
