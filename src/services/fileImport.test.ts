import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE, readCsvFiles } from './fileImport'

describe('readCsvFiles', () => {
  it('lit les CSV et retire le BOM des exports Excel', async () => {
    const { files, rejected } = await readCsvFiles([new File(['﻿sku,price\n'], 'a.csv', { type: 'text/csv' })])
    expect(rejected).toEqual([])
    expect(files['a.csv']).toBe('sku,price\n')
  })

  it('refuse les fichiers non CSV, vides ou trop volumineux, avec la raison', async () => {
    const big = new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'big.csv')
    const { files, rejected } = await readCsvFiles([
      new File(['bonjour'], 'notes.txt'),
      new File([], 'vide.csv'),
      big,
    ])
    expect(files).toEqual({})
    expect(rejected).toEqual([
      { name: 'notes.txt', reason: 'format non CSV' },
      { name: 'vide.csv', reason: 'fichier vide' },
      { name: 'big.csv', reason: 'trop volumineux (max 10 Mo)' },
    ])
  })
})
