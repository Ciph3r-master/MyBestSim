import { EXPECTED_COLUMNS } from '@/constants/catalog'

type Row = Record<(typeof EXPECTED_COLUMNS)[number], string>

const DEFAULT_ROW: Row = {
  sku: 'testsim-1',
  provider: 'TestSIM',
  product_name: 'eSIM France 5 Go 7 jours',
  country_code: 'FR',
  country_name: 'France',
  data_gb: '5',
  data_display: '5 Go',
  validity_days: '7',
  price: '10',
  currency: 'EUR',
  network: '4G',
  top_up: 'oui',
}

/**
 * Construit un CSV au format fournisseur. Chaque ligne ne précise que ce qui compte pour le test ;
 * le nom produit est déduit des colonnes sauf s'il est fourni.
 */
export function csv(rows: Partial<Row>[], columns: readonly string[] = EXPECTED_COLUMNS): string {
  const lines = rows.map((partial, i) => {
    const row: Row = { ...DEFAULT_ROW, sku: `testsim-${i + 1}`, ...partial }
    if (!partial.product_name) {
      row.product_name = `eSIM ${row.country_name} ${row.data_display} ${row.validity_days} jours`
    }
    // Comme un vrai export : une valeur contenant une virgule (« 12,5 ») est entourée de guillemets.
    return columns
      .map((c) => row[c as keyof Row] ?? '')
      .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
      .join(',')
  })
  return [columns.join(','), ...lines].join('\n')
}

/** Ligne d'un forfait illimité (data_gb vide). */
export const unlimited = (partial: Partial<Row> = {}): Partial<Row> => ({
  data_gb: '',
  data_display: 'Illimité',
  ...partial,
})

/** Les nombres fr-FR utilisent des espaces insécables : on les normalise pour comparer. */
export const plainSpaces = (s: string) => s.replace(/[  ]/g, ' ')
