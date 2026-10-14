import { useEffect, useState } from 'react'
import { readUrlParam, writeUrlParams, type UrlParam } from '@/utils/urlState'

/**
 * Comme useState, mais initialisé depuis l'URL et recopié dans l'URL.
 * `toUrl` renvoie `null` pour retirer le paramètre (valeur par défaut, valeur invalide…).
 */
export function useUrlState<T>(
  key: UrlParam,
  fromUrl: (raw: string | null) => T,
  toUrl: (value: T) => string | null,
) {
  const [value, setValue] = useState<T>(() => fromUrl(readUrlParam(key)))
  const serialized = toUrl(value)

  useEffect(() => {
    writeUrlParams({ [key]: serialized })
  }, [key, serialized])

  return [value, setValue] as const
}

/** Synchronise dans l'URL une valeur dérivée (ex. le fournisseur effectivement appliqué). */
export function useSyncUrlParam(key: UrlParam, serialized: string | null) {
  useEffect(() => {
    writeUrlParams({ [key]: serialized })
  }, [key, serialized])
}
