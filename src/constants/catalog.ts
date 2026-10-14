/** Devise des indicateurs de prix : les produits dans une autre devise en sont exclus. */
export const BASE_CURRENCY = 'EUR'

/** Colonnes attendues dans chaque CSV fournisseur. */
export const EXPECTED_COLUMNS = [
  'sku',
  'provider',
  'product_name',
  'country_code',
  'country_name',
  'data_gb',
  'data_display',
  'validity_days',
  'price',
  'currency',
  'network',
  'top_up',
] as const
