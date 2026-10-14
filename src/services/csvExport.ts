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
  return Papa.unparse({ fields: [...EXPECTED_COLUMNS], data: rows.map((r) => EXPECTED_COLUMNS.map((c) => r[c])) })
}

/** Déclenche le téléchargement d'un CSV dans le navigateur (BOM UTF-8 pour qu'Excel lise les accents). */
export function downloadCsv(content: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
