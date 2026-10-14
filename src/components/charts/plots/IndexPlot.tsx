import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, COLORS, TOOLTIP_PROPS } from '@/constants/theme'
import { formatSignedPercent as signedPercent } from '@/utils/format'
import { coloredBar } from './barShape'

export interface IndexPlotProps {
  data: { name: string; index: number }[]
  /** Borne du domaine symétrique autour de 0. */
  bound: number
  ticks: number[]
  tickDecimals: number
  selected: string | null
  onSelect: (provider: string) => void
  height: number
}

export function IndexPlot({ data, bound, ticks, tickDecimals, selected, onSelect, height }: IndexPlotProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke={COLORS.grid} />
        <XAxis
          type="number"
          domain={[-bound, bound]}
          ticks={ticks}
          tickFormatter={(v: number) => signedPercent(v, tickDecimals)}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis type="category" dataKey="name" width={96} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <ReferenceLine x={0} stroke="rgba(255,255,255,0.35)" />
        <Tooltip {...TOOLTIP_PROPS} formatter={(v) => [signedPercent(Number(v), 2), 'vs médiane du marché']} />
        <Bar
          dataKey="index"
          isAnimationActive={false}
          radius={4}
          maxBarSize={16}
          cursor="pointer"
          onClick={(entry) => onSelect((entry as unknown as { name: string }).name)}
          shape={coloredBar((name) => {
            const d = data.find((x) => x.name === name)
            return {
              fill: (d?.index ?? 0) <= 0 ? COLORS.cheaper : COLORS.pricier,
              fillOpacity: !selected || selected === name ? 0.95 : 0.3,
            }
          })}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
