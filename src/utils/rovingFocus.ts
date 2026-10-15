/**
 * Navigation clavier des groupes « un seul élément actif » (onglets, boutons radio), selon les
 * recommandations WAI-ARIA : flèches pour passer à l'élément voisin (en boucle), Début / Fin pour
 * aller au premier / dernier. Renvoie `null` pour une touche qui ne concerne pas la navigation.
 */
export function rovingIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
