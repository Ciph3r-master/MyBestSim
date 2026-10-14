import type { ComponentProps } from 'react'
import { Rectangle } from 'recharts'

/** Props reçues par le `shape` d'une `<Bar>` Recharts (remplace le composant `Cell` déprécié). */
export type BarShapeProps = ComponentProps<typeof Rectangle> & { payload?: { name: string } }

export function coloredBar(getStyle: (name: string) => { fill: string; fillOpacity?: number }) {
  return function ColoredBar(props: BarShapeProps) {
    return <Rectangle {...props} {...getStyle(props.payload?.name ?? '')} />
  }
}
