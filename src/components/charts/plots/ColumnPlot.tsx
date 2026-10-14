import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CountItem } from '@/types/catalog'
import { AXIS_TICK, AXIS_TICK_SMALL, COLORS, TOOLTIP_PROPS } from '@/constants/theme'
import { coloredBar } from './barShape'

export interface ColumnPlotProps {
  data: CountItem[]
  colorFor: (name: string) => string
  unit: string
  height: number
  onSelect?: (name: string) => void
}

export function ColumnPlot({ data, colorFor, unit, height, onSelect }: ColumnPlotProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="name" tick={AXIS_TICK_SMALL} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
        <Tooltip {...TOOLTIP_PROPS} formatter={(v) => [`${v} ${unit}`, '']} />
        {/* Animations désactivées : rendu immédiat et fiable, y compris en capture/headless. */}
        <Bar
          dataKey="count"
          isAnimationActive={false}
          radius={[8, 8, 0, 0]}
          maxBarSize={72}
          cursor={onSelect ? 'pointer' : undefined}
          onClick={onSelect && ((entry) => onSelect((entry as unknown as CountItem).name))}
          shape={coloredBar((name) => ({ fill: colorFor(name), fillOpacity: 0.9 }))}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
