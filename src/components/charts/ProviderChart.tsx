import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProviderStat } from '@/types/catalog'
import { AXIS_TICK, COLORS, TOOLTIP_PROPS } from '@/constants/theme'
import { Panel } from '@/components/ui/Panel'
import { coloredBar } from './barShape'

interface ProviderChartProps {
  data: ProviderStat[]
  selected: string | null
  onSelect: (provider: string) => void
}

export function ProviderChart({ data, selected, onSelect }: ProviderChartProps) {
  return (
    <Panel
      title="Répartition par fournisseur"
      subtitle="Nombre de cartes proposées · cliquez sur une barre pour filtrer"
      wide
    >
      <ResponsiveContainer width="100%" height={460}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 36 }}>
          <CartesianGrid horizontal={false} stroke={COLORS.grid} />
          <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={96} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_PROPS} formatter={(v) => [`${v} cartes`, 'Produits']} />
          <Bar
            dataKey="count"
            isAnimationActive={false}
            radius={[0, 8, 8, 0]}
            maxBarSize={28}
            label={{ position: 'right', fill: COLORS.label, fontSize: 12 }}
            cursor="pointer"
            onClick={(entry) => onSelect((entry as unknown as ProviderStat).name)}
            shape={coloredBar((name) => ({
              fill: COLORS.accent,
              fillOpacity: !selected || selected === name ? 0.9 : 0.25,
            }))}
          />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}
