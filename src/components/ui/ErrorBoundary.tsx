import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  /** `block` : remplace seulement la zone en erreur ; `page` : écran de secours plein page. */
  variant?: 'block' | 'page'
  /** Hauteur réservée en mode `block`, pour que la mise en page ne saute pas. */
  minHeight?: number
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Isole une erreur d'affichage. Cas le plus probable : après un redéploiement, un onglet resté ouvert
 * demande un fichier de graphiques qui n'existe plus. Sans boundary, toute l'application deviendrait blanche.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur d’affichage isolée :', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { variant = 'block', minHeight } = this.props
    return (
      <div className={variant === 'page' ? styles.page : styles.block} style={{ minHeight }} role="alert">
        <p className={styles.title}>
          {variant === 'page' ? 'Le dashboard a rencontré une erreur.' : 'Cette partie n’a pas pu s’afficher.'}
        </p>
        <p className={styles.hint}>Une nouvelle version a peut-être été mise en ligne : rechargez la page.</p>
        <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
          Recharger la page
        </button>
      </div>
    )
  }
}
