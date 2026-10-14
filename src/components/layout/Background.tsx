import styles from './Background.module.css'

export function Background() {
  return (
    <div className={styles.background} aria-hidden>
      <span className={`${styles.blob} ${styles.indigo}`} />
      <span className={`${styles.blob} ${styles.teal}`} />
      <span className={`${styles.blob} ${styles.pink}`} />
      <span className={`${styles.blob} ${styles.sky}`} />
    </div>
  )
}
