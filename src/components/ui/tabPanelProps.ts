/** Attributs à poser sur la zone de contenu de l'onglet actif (role="tabpanel"). */
export const tabPanelProps = (idPrefix: string, activeId: string) => ({
  id: `${idPrefix}-panel`,
  role: 'tabpanel' as const,
  'aria-labelledby': `${idPrefix}-tab-${activeId}`,
  tabIndex: 0,
})
