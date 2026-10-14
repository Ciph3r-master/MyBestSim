export const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface RejectedFile {
  name: string
  reason: string
}

export interface FileReadResult {
  /** Contenu des fichiers acceptés, indexé par nom de fichier. */
  files: Record<string, string>
  rejected: RejectedFile[]
}

const isCsv = (file: File) => /\.csv$/i.test(file.name) || file.type === 'text/csv'

/**
 * Lit des fichiers déposés par l'utilisateur, entièrement dans le navigateur :
 * aucun contenu n'est envoyé à un serveur.
 */
export async function readCsvFiles(input: Iterable<File>): Promise<FileReadResult> {
  const files: Record<string, string> = {}
  const rejected: RejectedFile[] = []

  for (const file of input) {
    if (!isCsv(file)) {
      rejected.push({ name: file.name, reason: 'format non CSV' })
    } else if (file.size > MAX_FILE_SIZE) {
      rejected.push({ name: file.name, reason: `trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)` })
    } else if (file.size === 0) {
      rejected.push({ name: file.name, reason: 'fichier vide' })
    } else {
      try {
        // Retire un éventuel BOM UTF-8 (fréquent dans les exports Excel).
        files[file.name] = (await file.text()).replace(/^﻿/, '')
      } catch {
        rejected.push({ name: file.name, reason: 'lecture impossible' })
      }
    }
  }

  return { files, rejected }
}
