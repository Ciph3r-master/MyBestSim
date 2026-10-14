import type { Catalog, FileReport, Product } from '@/types/catalog'
import type { FileQuality, QualityCheck, QualityReport, QualityStatus } from '@/types/quality'
import { BASE_CURRENCY, EXPECTED_COLUMNS } from '@/constants/catalog'
import { classifyDestination, isIsoCountry, isoLookupSupported } from '@/services/destinations'
import { comparableKey } from '@/services/catalogStats'
import { formatCount as plural, formatCurrency, formatNumber, formatPercent } from '@/utils/format'

const MAX_EXAMPLES = 5

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const group = groups.get(k)
    if (group) group.push(item)
    else groups.set(k, [item])
  }
  return groups
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.min(lo + 1, sorted.length - 1)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const ratio = (part: number, total: number) => (total ? part / total : 0)

/** Décrit, pour chaque fichier source, les produits concernés par un contrôle. */
function issuesByFile(products: Product[], describe: (items: Product[]) => string): Record<string, string> {
  return Object.fromEntries([...groupBy(products, (p) => p.sourceFile)].map(([file, items]) => [file, describe(items)]))
}

/** Même chose à partir des comptes rendus de lecture (problèmes détectés avant normalisation). */
function issuesFromReports(files: FileReport[], describe: (f: FileReport) => string | null): Record<string, string> {
  return Object.fromEntries(
    files.flatMap((f) => {
      const text = describe(f)
      return text ? [[f.fileName, text]] : []
    }),
  )
}

const expectedName = (p: Product) => `eSIM ${p.countryName} ${p.dataDisplay} ${p.validityDays} jours`

/** Clé « offre » : même fournisseur, même destination, même volume, même durée. */
const offerKey = (p: Product) => `${p.provider}|${p.countryCode}|${p.dataDisplay}|${p.validityDays}`

// ---------- Structure ----------

function checkSchema(files: FileReport[]): QualityCheck {
  const broken = files.filter((f) => f.missingColumns.length > 0)
  return {
    id: 'schema',
    category: 'Structure',
    label: 'Colonnes attendues',
    status: broken.length ? 'error' : 'ok',
    value: `${files.length - broken.length}/${files.length} fichiers conformes`,
    detail: `Chaque fichier doit contenir les ${EXPECTED_COLUMNS.length} colonnes du format fournisseur. Un fichier non conforme est ignoré.`,
    examples: broken.map((f) => `${f.fileName} : manque ${f.missingColumns.join(', ')}`),
    fileIssues: issuesFromReports(files, (f) =>
      f.missingColumns.length ? `colonnes manquantes : ${f.missingColumns.join(', ')}` : null,
    ),
  }
}

function checkInvalidRows(files: FileReport[]): QualityCheck {
  const invalid = files.flatMap((f) => f.invalidRows.map((r) => ({ ...r, fileName: f.fileName })))
  const total = files.reduce((n, f) => n + f.rowCount, 0)
  return {
    id: 'invalid-rows',
    category: 'Structure',
    label: 'Lignes exploitables',
    status: invalid.length ? 'error' : 'ok',
    value: invalid.length ? plural(invalid.length, 'ligne rejetée', 'lignes rejetées') : `${formatNumber(total)}/${formatNumber(total)} lignes`,
    detail: 'Une ligne est rejetée si son SKU est vide, si son prix est absent ou nul, ou si un forfait non illimité n\'a pas de volume de data.',
    examples: invalid.map((r) => `${r.fileName} l.${r.line} (${r.sku || 'sans SKU'}) : ${r.reason}`),
    fileIssues: issuesFromReports(files, (f) =>
      f.invalidRows.length ? plural(f.invalidRows.length, 'ligne rejetée', 'lignes rejetées') : null,
    ),
  }
}

function checkProviderFiles(files: FileReport[]): QualityCheck {
  const multi = files.filter((f) => f.providers.length > 1)
  const prefix = files.filter((f) => f.skuPrefixMismatches.length > 0)
  const issues = [
    ...multi.map((f) => `${f.fileName} : ${f.providers.length} fournisseurs (${f.providers.join(', ')})`),
    ...prefix.map((f) => `${f.fileName} : ${plural(f.skuPrefixMismatches.length, 'SKU', 'SKU')} hors préfixe (${f.skuPrefixMismatches[0]}…)`),
  ]
  return {
    id: 'provider-files',
    category: 'Structure',
    label: 'Un fichier = un fournisseur',
    status: issues.length ? 'warning' : 'ok',
    value: issues.length ? plural(issues.length, 'anomalie') : `${files.length}/${files.length} fichiers`,
    detail: 'Chaque fichier ne contient qu\'un seul fournisseur et ses SKU commencent par le nom du fichier.',
    examples: issues,
    fileIssues: issuesFromReports(files, (f) => {
      const parts = [
        f.providers.length > 1 && `${f.providers.length} fournisseurs`,
        f.skuPrefixMismatches.length > 0 && plural(f.skuPrefixMismatches.length, 'SKU hors préfixe', 'SKU hors préfixe'),
      ].filter(Boolean)
      return parts.length ? parts.join(' · ') : null
    }),
  }
}

// ---------- Unicité ----------

function checkDuplicateSkus(catalog: Catalog): QualityCheck {
  const n = catalog.duplicateSkus.length
  return {
    id: 'duplicate-sku',
    category: 'Unicité',
    label: 'SKU uniques',
    status: n ? 'warning' : 'ok',
    value: n ? plural(n, 'SKU en double', 'SKU en double') : '0 doublon',
    detail: 'Un SKU identifie un produit de façon unique. En cas de doublon, seule la première occurrence est comptée.',
    examples: catalog.duplicateSkus,
    fileIssues: issuesFromReports(catalog.files, (f) =>
      f.duplicateSkus.length
        ? `${plural(f.duplicateSkus.length, 'SKU déjà présent', 'SKU déjà présents')} dans un autre fichier`
        : null,
    ),
  }
}

function checkIdenticalRows(products: Product[]): QualityCheck {
  const signature = (p: Product) =>
    [offerKey(p), p.price, p.network, p.topUp, p.currency].join('|')
  const dupGroups = [...groupBy(products, signature).values()].filter((g) => g.length > 1)
  const extra = dupGroups.reduce((n, g) => n + g.length - 1, 0)
  return {
    id: 'identical-rows',
    category: 'Unicité',
    label: 'Lignes identiques sous deux SKU',
    status: extra ? 'warning' : 'ok',
    value: extra ? plural(extra, 'ligne') : '0 doublon',
    detail: 'Recherche des produits strictement identiques (prix, réseau, recharge compris) publiés sous des SKU différents.',
    examples: dupGroups.map((g) => `${g[0].productName} (${g[0].provider}) : ${g.map((p) => p.sku).join(', ')}`),
    // La première ligne de chaque groupe est l'originale, les suivantes sont les doublons.
    fileIssues: issuesByFile(dupGroups.flatMap((g) => g.slice(1)), (items) =>
      plural(items.length, 'ligne en double', 'lignes en double'),
    ),
  }
}

function checkVariants(products: Product[]): QualityCheck {
  const groups = [...groupBy(products, offerKey).values()].filter((g) => g.length > 1)
  const rows = groups.reduce((n, g) => n + g.length, 0)
  return {
    id: 'variants',
    category: 'Unicité',
    label: 'Offres déclinées en variantes',
    status: groups.length ? 'info' : 'ok',
    value: groups.length ? `${plural(groups.length, 'offre')} · ${formatNumber(rows)} lignes` : 'aucune',
    detail:
      'Même fournisseur, destination, volume et durée, mais prix, réseau (4G/5G) ou rechargeabilité différents. ' +
      'Ce sont des produits distincts (SKU différents) : ils sont tous comptés dans les statistiques.',
    examples: groups.map(
      (g) =>
        `${g[0].productName} (${g[0].provider}) : ` +
        g.map((p) => `${formatCurrency(p.price)} ${p.network}${p.topUp ? ' rech.' : ''}`).join(' / '),
    ),
  }
}

// ---------- Cohérence ----------

function checkCurrency(products: Product[]): QualityCheck {
  const currencies = [...groupBy(products, (p) => p.currency).entries()].sort((a, b) => b[1].length - a[1].length)
  const foreign = products.filter((p) => p.currency !== BASE_CURRENCY)
  return {
    id: 'currency',
    category: 'Cohérence',
    label: `Prix en ${BASE_CURRENCY}`,
    // Les lignes hors devise sont exclues des indicateurs de prix : elles ne faussent plus les calculs, d'où « à surveiller ».
    status: foreign.length ? 'warning' : 'ok',
    // Mélange de devises : on affiche des effectifs, un pourcentage arrondi masquerait une ligne isolée (« 0 % »).
    value:
      currencies.length === 0
        ? 'aucun produit'
        : foreign.length === 0
          ? `${BASE_CURRENCY} 100 %`
          : currencies.map(([c, list]) => `${c || '∅'} ${formatNumber(list.length)}`).join(' · '),
    detail:
      `Les indicateurs de prix sont exprimés en ${BASE_CURRENCY}. Les produits dans une autre devise ne sont pas convertis ` +
      '(un taux de change serait une hypothèse) : ils sont exclus des calculs de prix, mais comptés dans les volumes.',
    examples: foreign.map((p) => `${p.sourceFile} · ${p.sku} : ${p.price} ${p.currency || '(devise manquante)'}`),
    fileIssues: issuesByFile(foreign, (items) =>
      [...groupBy(items, (p) => p.currency || '∅')]
        .map(([currency, list]) => `${plural(list.length, 'ligne', 'lignes')} en ${currency}`)
        .join(' · '),
    ),
  }
}

function checkProductNames(products: Product[]): QualityCheck {
  const mismatches = products.filter((p) => p.productName !== expectedName(p))
  return {
    id: 'product-name',
    category: 'Cohérence',
    label: 'Nom produit cohérent avec les colonnes',
    status: mismatches.length ? 'warning' : 'ok',
    value: mismatches.length ? plural(mismatches.length, 'écart') : `${formatNumber(products.length)}/${formatNumber(products.length)}`,
    detail: 'Le nom affiché doit correspondre à la destination, au volume et à la durée renseignés dans les colonnes.',
    examples: mismatches.map((p) => `${p.sku} : « ${p.productName} » ≠ « ${expectedName(p)} »`),
    fileIssues: issuesByFile(mismatches, (items) => plural(items.length, 'nom produit incohérent', 'noms produit incohérents')),
  }
}

function checkCountryCodes(products: Product[]): QualityCheck {
  const namesByCode = groupBy(products, (p) => p.countryCode)
  const codesByName = groupBy(products, (p) => p.countryName)
  const conflictingCodes = [...namesByCode]
    .map(([code, list]) => [code, new Set(list.map((p) => p.countryName))] as const)
    .filter(([, names]) => names.size > 1)
  const conflictingNames = [...codesByName]
    .map(([name, list]) => [name, new Set(list.map((p) => p.countryCode))] as const)
    .filter(([, codes]) => codes.size > 1)
  const issues = [
    ...conflictingCodes.map(([code, names]) => `${code} → ${[...names].join(' / ')}`),
    ...conflictingNames.map(([name, codes]) => `${name} → ${[...codes].join(' / ')}`),
  ]
  const codes = new Set(conflictingCodes.map(([code]) => code))
  const names = new Set(conflictingNames.map(([name]) => name))
  const affected = products.filter((p) => codes.has(p.countryCode) || names.has(p.countryName))
  return {
    id: 'country-codes',
    category: 'Cohérence',
    label: 'Code ↔ nom de destination',
    status: issues.length ? 'warning' : 'ok',
    value: issues.length ? plural(issues.length, 'conflit') : `${namesByCode.size} codes cohérents`,
    detail: 'Chaque code destination correspond à un seul nom, et inversement, dans tous les fichiers.',
    examples: issues,
    fileIssues: issuesByFile(affected, (items) =>
      plural(items.length, 'ligne au couple code/nom divergent', 'lignes au couple code/nom divergent'),
    ),
  }
}

function checkNonCountryDestinations(products: Product[]): QualityCheck {
  if (!isoLookupSupported) {
    return {
      id: 'non-country-destinations',
      category: 'Cohérence',
      label: 'Destinations non reconnues comme pays',
      status: 'info',
      value: 'vérification indisponible',
      detail: 'Ce navigateur ne fournit pas les noms ISO 3166 (Intl.DisplayNames) : toutes les destinations sont traitées comme des pays.',
    }
  }

  const unrecognized = products.filter((p) => !isIsoCountry(p))
  const byDestination = [...groupBy(unrecognized, (p) => `${p.countryCode}|${p.countryName}`).values()]
  return {
    id: 'non-country-destinations',
    category: 'Cohérence',
    label: 'Destinations non reconnues comme pays',
    status: byDestination.length ? 'warning' : 'ok',
    value: byDestination.length
      ? `${plural(byDestination.length, 'destination')} · ${formatNumber(unrecognized.length)} produits`
      : 'toutes reconnues',
    detail:
      'Chaque couple code/nom est comparé au nom officiel ISO 3166 du code (fourni par le navigateur, variantes ' +
      'd\'écriture tolérées). Sont signalés les codes absents de la norme et ceux qui y désignent un autre pays : en ' +
      'pratique des zones multi-pays (Europe, Monde…), mais aussi tout nom non officiel ou mal orthographié. ' +
      'Ces destinations sont comptées dans les « destinations » et séparées des pays dans les analyses de prix.',
    examples: byDestination.map((list) => {
      const { countryCode: code, countryName: name } = list[0]
      const { kind, isoName } = classifyDestination(code, name)
      const reason = kind === 'unknown-code' ? 'code absent de la norme ISO 3166' : `en ISO 3166, ${code} = ${isoName}`
      return `${code} = « ${name} » : ${reason} · ${plural(list.length, 'produit')}`
    }),
  }
}

// ---------- Prix ----------

/**
 * Détection d'outliers par la règle de Tukey (1,5 × écart interquartile), au sein de groupes comparables :
 * même volume, même durée, et pays séparés des zones (structurellement plus chères).
 */
function checkPriceOutliers(allProducts: Product[]): QualityCheck {
  // Seuls des prix dans la même devise sont comparables.
  const products = allProducts.filter((p) => p.currency === BASE_CURRENCY)
  const groups = groupBy(products, comparableKey)
  const outliers: Product[] = []
  for (const group of groups.values()) {
    if (group.length < 4) continue
    const sorted = group.map((p) => p.price).sort((a, b) => a - b)
    const q1 = quantile(sorted, 0.25)
    const q3 = quantile(sorted, 0.75)
    const fence = 1.5 * (q3 - q1)
    outliers.push(...group.filter((p) => p.price < q1 - fence || p.price > q3 + fence))
  }
  return {
    id: 'price-outliers',
    category: 'Prix',
    label: 'Prix aberrants',
    status: outliers.length ? 'warning' : 'ok',
    value: outliers.length ? plural(outliers.length, 'prix suspect', 'prix suspects') : '0 prix suspect',
    detail:
      `Règle de Tukey (1,5 × écart interquartile) sur les prix en ${BASE_CURRENCY}, par groupe comparable : même volume, même durée, pays ISO et autres destinations (zones) séparés. ` +
      `${groups.size} groupes analysés.`,
    examples: outliers.map((p) => `${p.sku} : ${p.productName} à ${formatCurrency(p.price)}`),
    fileIssues: issuesByFile(outliers, (items) => plural(items.length, 'prix suspect', 'prix suspects')),
  }
}

function checkZonePremium(allProducts: Product[]): QualityCheck {
  const products = allProducts.filter((p) => p.currency === BASE_CURRENCY)
  const groups = groupBy(products, (p) => `${p.dataDisplay}|${p.validityDays}`)
  const ratios: number[] = []
  for (const group of groups.values()) {
    const zones = group.filter((p) => !isIsoCountry(p)).map((p) => p.price)
    const countries = group.filter((p) => isIsoCountry(p)).map((p) => p.price)
    if (zones.length && countries.length) ratios.push(mean(zones) / mean(countries))
  }
  const premium = ratios.length ? mean(ratios) - 1 : 0
  return {
    id: 'zone-premium',
    category: 'Prix',
    label: 'Surcoût des forfaits zones',
    status: 'info',
    value: `${premium >= 0 ? '+' : ''}${formatPercent(premium)} en moyenne`,
    detail:
      'À volume et durée égaux, un forfait sur une destination non reconnue comme pays (en pratique une zone : ' +
      'Europe, Asie, Monde…) coûte plus cher qu\'un forfait pays. ' +
      'Sans séparer ces deux familles, ces forfaits ressortiraient à tort comme des prix aberrants.',
  }
}

function checkUnlimited(products: Product[]): QualityCheck {
  const unlimited = products.filter((p) => p.dataGb == null).length
  return {
    id: 'unlimited',
    category: 'Prix',
    label: 'Forfaits illimités sans volume',
    status: unlimited ? 'info' : 'ok',
    value: `${plural(unlimited, 'forfait')} · ${formatPercent(ratio(unlimited, products.length))}`,
    detail:
      'Les forfaits « Illimité » n\'ont pas de valeur en Go (data_gb vide). Ils sont exclus de la data moyenne ' +
      'et du prix au Go, mais inclus dans tous les autres indicateurs.',
  }
}

// ---------- Rapport ----------

const SEVERITY: Record<QualityStatus, number> = { ok: 0, info: 1, warning: 2, error: 3 }

/** Statut d'un fichier : le plus sévère des contrôles qui le mettent en cause. */
function fileQuality(report: FileReport, checks: QualityCheck[]): FileQuality {
  const issues = checks
    .filter((c) => (c.status === 'warning' || c.status === 'error') && c.fileIssues?.[report.fileName])
    .map((c) => ({ status: c.status, text: c.fileIssues![report.fileName] }))
    .sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])

  const status = issues[0]?.status ?? 'ok'
  return {
    fileName: report.fileName,
    provider: report.providers.join(', ') || '-',
    rowCount: report.rowCount,
    validCount: report.validCount,
    status,
    issues,
  }
}

export function computeQualityReport(catalog: Catalog): QualityReport {
  const { products, files } = catalog
  const checks = [
    checkSchema(files),
    checkInvalidRows(files),
    checkProviderFiles(files),
    checkDuplicateSkus(catalog),
    checkIdenticalRows(products),
    checkVariants(products),
    checkCurrency(products),
    checkProductNames(products),
    checkCountryCodes(products),
    checkNonCountryDestinations(products),
    checkPriceOutliers(products),
    checkZonePremium(products),
    checkUnlimited(products),
  ].map((c) => ({ ...c, examples: c.examples?.slice(0, MAX_EXAMPLES), exampleCount: c.examples?.length ?? 0 }))

  const counts: Record<QualityStatus, number> = { ok: 0, info: 0, warning: 0, error: 0 }
  for (const c of checks) counts[c.status]++

  return { checks, counts, files: files.map((f) => fileQuality(f, checks)) }
}
