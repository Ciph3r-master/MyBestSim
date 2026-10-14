/** Produit eSIM normalisé, indépendant du format CSV source. */
export interface Product {
  sku: string
  provider: string
  productName: string
  countryCode: string
  countryName: string
  /** `null` = forfait illimité (pas de volume en Go). */
  dataGb: number | null
  validityDays: number
  price: number
  network: string
  topUp: boolean
  /** Champs conservés tels quels pour les contrôles qualité. */
  dataDisplay: string
  currency: string
  sourceFile: string
}

/** Ligne brute telle qu'elle apparaît dans les CSV fournisseurs. */
export interface RawProductRow {
  sku: string
  provider: string
  product_name: string
  country_code: string
  country_name: string
  data_gb: string
  data_display: string
  validity_days: string
  price: string
  currency: string
  network: string
  top_up: string
}

export interface InvalidRow {
  /** Numéro de ligne dans le fichier (en-tête = ligne 1). */
  line: number
  sku: string
  reason: string
}

/** Compte rendu de lecture d'un fichier CSV. */
export interface FileReport {
  fileName: string
  providers: string[]
  rowCount: number
  validCount: number
  missingColumns: string[]
  invalidRows: InvalidRow[]
  /** SKU dont le préfixe ne correspond pas au nom du fichier. */
  skuPrefixMismatches: string[]
  /** SKU de ce fichier également présents dans un autre fichier, dont l'occurrence ici a été écartée. */
  duplicateSkus: string[]
}

export interface Catalog {
  products: Product[]
  fileCount: number
  providers: string[]
  files: FileReport[]
  /** SKU présents plusieurs fois (seule la première occurrence est conservée). */
  duplicateSkus: string[]
}

export interface CountItem {
  name: string
  count: number
}

export interface ProviderStat extends CountItem {
  /** `null` si le fournisseur n'a aucun produit dans la devise de référence. */
  avgPrice: number | null
  /** Prix moyen au Go, calculé uniquement sur les forfaits à volume fixe en devise de référence. */
  pricePerGb: number | null
  /**
   * Indice de prix à offre égale : écart moyen (ratio, 0 = marché) entre le prix de chaque produit et la médiane
   * des offres comparables (même volume, même durée, pays ou zone). Neutralise la composition du catalogue.
   */
  priceIndex: number | null
}

/**
 * Les comptages portent sur tous les produits ; les indicateurs de prix uniquement sur
 * ceux en devise de référence (`pricedCount`). Un indicateur de prix vaut `null` s'il n'y en a aucun.
 */
export interface CatalogStats {
  total: number
  /** Produits en devise de référence, base de tous les indicateurs de prix. */
  pricedCount: number
  /** Produits exclus des indicateurs de prix, par devise. */
  excludedFromPrices: CountItem[]
  over100: number
  minPrice: number | null
  maxPrice: number | null
  cheapest: Product | null
  priciest: Product | null
  avgPrice: number | null
  medianPrice: number | null
  avgData: number
  medianData: number | null
  unlimited: number
  avgPricePerGb: number | null
  share5G: number
  shareTopUp: number
  shareUnlimited: number
  countries: number
  byProvider: ProviderStat[]
  priceDistribution: CountItem[]
  dataTiers: CountItem[]
  topCountries: CountItem[]
  validity: CountItem[]
}
