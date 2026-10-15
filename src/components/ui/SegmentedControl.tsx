import { useRef, type KeyboardEvent } from 'react'
import { rovingIndex } from '@/utils/rovingFocus'

export interface SegmentOption<T> {
  value: T
  label: string
  title?: string
}

interface SegmentedControlProps<T> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Classes du groupe, d'une option et de l'option sélectionnée (chaque écran garde son style). */
  classNames: { group?: string; option?: string; active?: string }
}

/**
 * Choix unique parmi quelques options (motif WAI-ARIA « radio group ») : un seul arrêt de tabulation,
 * flèches / Début / Fin pour changer de valeur.
 */
export function SegmentedControl<T>({ options, value, onChange, label, classNames }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const onKeyDown = (e: KeyboardEvent) => {
    const next = rovingIndex(e.key, selectedIndex, options.length)
    if (next === null) return
    e.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div className={classNames.group} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <button
            key={String(option.value)}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === selectedIndex ? 0 : -1}
            title={option.title}
            className={checked ? classNames.active : classNames.option}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
