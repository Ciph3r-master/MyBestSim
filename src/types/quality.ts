/**
 * - `ok` : contrôle validé
 * - `info` : particularité des données à connaître, sans être une erreur
 * - `warning` : incohérence à signaler au fournisseur ou à traiter
 * - `error` : donnée inexploitable (ligne rejetée, colonne manquante…)
 */
export type QualityStatus = 'ok' | 'info' | 'warning' | 'error'

export type QualityCategory = 'Structure' | 'Unicité' | 'Cohérence' | 'Prix'

export interface QualityCheck {
  id: string
  category: QualityCategory
  label: string
  status: QualityStatus
  /** Résultat court, affiché en évidence (ex. « 0 doublon »). */
  value: string
  /** Explication de la règle et de son impact sur les statistiques. */
  detail: string
  /** Échantillon d'exemples (tronqué). */
  examples?: string[]
  /** Nombre total de cas concernés, avant troncature. */
  exampleCount?: number
  /**
   * Impact du contrôle sur chaque fichier (nom de fichier → description courte).
   * Le tableau « Détail par fichier » est entièrement déduit de ce champ.
   * Absent pour les constats propres au jeu de données (zones, variantes…), qui ne sont pas des défauts d'un fichier.
   */
  fileIssues?: Record<string, string>
}

export interface FileQuality {
  fileName: string
  provider: string
  rowCount: number
  validCount: number
  status: QualityStatus
  issues: { status: QualityStatus; text: string }[]
}

export interface QualityReport {
  checks: QualityCheck[]
  files: FileQuality[]
  counts: Record<QualityStatus, number>
}
