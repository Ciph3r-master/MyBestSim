import styles from './PanelEmpty.module.css'

/** Message affiché dans un panneau quand ses données sont indisponibles. */
export function PanelEmpty({ children }: { children: string }) {
  return <p className={styles.empty}>{children}</p>
}
