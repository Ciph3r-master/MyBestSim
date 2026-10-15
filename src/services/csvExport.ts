import Papa from 'papaparse'
import type { Product } from '@/types/catalog'
import { EXPECTED_COLUMNS } from '@/constants/catalog'

/**
 * Exporte des produits au format des CSV fournisseurs : le fichier obtenu peut être réimporté
 * tel quel dans le dashboard.
 */
export function productsToCsv(products: Product[]): string {
  const rows = products.map((p) => ({
    sku: p.sku,
    provider: p.provider,
    product_name: p.productName,
    country_code: p.countryCode,
    country_name: p.countryName,
    data_gb: p.dataGb ?? '',
    data_display: p.dataDisplay,
    validity_days: p.validityDays,
    price: p.price,
    currency: p.currency,
    network: p.network,
    top_up: p.topUp ? 'oui' : 'non',
  }))
  return Papa.unparse(
    { fields: [...EXPECTED_COLUMNS], data: rows.map((r) => EXPECTED_COLUMNS.map((c) => r[c])) },
    // Les données viennent de fichiers importés : une valeur comme « =HYPERLINK(…) » serait exécutée
    // par Excel à l'ouverture. PapaParse la préfixe d'une apostrophe pour qu'elle reste du texte.
    { escapeFormulae: true },
  )
}

export const REVOKE_DELAY_MS = 1000

/** Déclenche le téléchargement d'un CSV dans le navigateur (BOM UTF-8 pour qu'Excel lise les accents). */
export function downloadCsv(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.append(link)
  link.click()
  link.remove()
  // Libérer l'URL immédiatement peut annuler le téléchargement sur certains navigateurs : on laisse le temps de démarrer.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
