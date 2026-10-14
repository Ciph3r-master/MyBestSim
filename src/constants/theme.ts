export const COLORS = {
  accent: '#8b9cff',
  teal: '#5eead4',
  pink: '#f9a8d4',
  grid: 'rgba(255,255,255,0.08)',
  axis: 'rgba(255,255,255,0.65)',
  label: 'rgba(255,255,255,0.8)',
  /** Paire divergente validée (CVD, contraste) sur la surface sombre : moins cher / plus cher. */
  cheaper: '#3987e5',
  pricier: '#e66767',
  /** Comparateur : meilleure offre, fournisseur sélectionné, autres offres (neutre). */
  best: '#199e70',
  highlight: '#3987e5',
  neutral: 'rgba(200,205,235,0.45)',
  surface: '#1d2040',
} as const

export const AXIS_TICK = { fill: COLORS.axis, fontSize: 12 }
export const AXIS_TICK_SMALL = { ...AXIS_TICK, fontSize: 11 }

export const TOOLTIP_PROPS = {
  cursor: { fill: 'rgba(255,255,255,0.06)' },
  contentStyle: {
    background: 'rgba(20,22,40,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    color: '#fff',
  },
  labelStyle: { color: '#fff', fontWeight: 600 },
  itemStyle: { color: '#d6dbff' },
}
