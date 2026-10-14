/**
 * Reconnaissance automatique des destinations, sans liste écrite en dur : chaque couple
 * (country_code, country_name) est comparé au nom officiel ISO 3166 fourni par le navigateur
 * (Intl.DisplayNames, données CLDR).
 *
 * - `country` : le code est un pays ISO et le nom correspond (variantes d'écriture tolérées).
 * - `unknown-code` : le code n'existe pas dans la norme (ex. « WW » pour Monde).
 * - `other-meaning` : le code existe mais désigne autre chose (ex. « NA » = Namibie, pas Amérique du Nord).
 *
 * Limite assumée : une zone multi-pays et un nom de pays mal orthographié ou non officiel (« USA »)
 * tombent tous deux hors de `country`. Le contrôle qualité affiche la raison pour qu'un humain tranche.
 */
export type DestinationKind = 'country' | 'unknown-code' | 'other-meaning'

export interface DestinationInfo {
  kind: DestinationKind
  /** Nom officiel du code en ISO 3166, s'il en a un. */
  isoName: string | null
}

const STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'et'])

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region', fallback: 'none' })
  } catch {
    return null
  }
})()

/** `false` si le navigateur ne fournit pas les noms ISO : toutes les destinations sont alors considérées comme des pays. */
export const isoLookupSupported = regionNames !== null

// CLDR nomme « ZZ » (région inconnue) : ce libellé signale un code sans pays associé.
const UNKNOWN_REGION_LABEL = isoLookupSupported ? safeOf('ZZ') : null

function safeOf(code: string): string | null {
  try {
    return regionNames?.of(code) ?? null
  } catch {
    return null // code mal formé (ex. trois lettres)
  }
}

function isoName(code: string): string | null {
  const name = safeOf(code.toUpperCase())
  return name && name !== UNKNOWN_REGION_LABEL ? name : null
}

const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const squash = (s: string) => plain(s).replace(/[^a-z]/g, '')

interface Token {
  word: string
  /** Mot abrégé (« Rép. ») : il peut correspondre à un mot qui commence pareil. */
  abbreviation: boolean
}

const tokenize = (s: string): Token[] =>
  plain(s)
    .split(/[\s\-'’]+/)
    .map((t) => ({ word: t.replace(/[^a-z]/g, ''), abbreviation: t.endsWith('.') }))
    .filter((t) => t.word && !STOP_WORDS.has(t.word))

const tokensMatch = (a: Token, b: Token) =>
  a.word === b.word || (a.abbreviation && b.word.startsWith(a.word)) || (b.abbreviation && a.word.startsWith(b.word))

/**
 * Deux noms désignent le même pays si, accents, ponctuation et petits mots mis à part, chaque mot de l'un
 * a son équivalent dans l'autre. Tolère « Vietnam » / « Viêt Nam » et « Rép. dominicaine » / « République
 * dominicaine », mais pas « Europe » / « Union européenne » ni « Guinée » / « Guinée équatoriale ».
 */
export function sameCountryName(a: string, b: string): boolean {
  if (squash(a) === squash(b)) return true
  const ta = tokenize(a)
  const tb = tokenize(b)
  return (
    ta.length > 0 &&
    ta.every((x) => tb.some((y) => tokensMatch(x, y))) &&
    tb.every((y) => ta.some((x) => tokensMatch(x, y)))
  )
}

const cache = new Map<string, DestinationInfo>()

export function classifyDestination(code: string, name: string): DestinationInfo {
  const key = `${code}|${name}`
  const cached = cache.get(key)
  if (cached) return cached

  let info: DestinationInfo
  if (!isoLookupSupported) {
    info = { kind: 'country', isoName: null }
  } else {
    const official = isoName(code)
    info = {
      kind: official == null ? 'unknown-code' : sameCountryName(name, official) ? 'country' : 'other-meaning',
      isoName: official,
    }
  }
  cache.set(key, info)
  return info
}

export const isIsoCountry = (p: { countryCode: string; countryName: string }) =>
  classifyDestination(p.countryCode, p.countryName).kind === 'country'
