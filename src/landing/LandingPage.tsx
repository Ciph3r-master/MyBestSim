import { Background } from '@/components/layout/Background'
import { GlassCard } from '@/components/ui/GlassCard'
import usageIa from '@/content/usage-ia.md?raw'
import { renderMarkdown } from './markdown'
import styles from './LandingPage.module.css'

const PARTS = [
  {
    href: '/dashboard/',
    part: 'Partie 1',
    title: 'Dashboard du catalogue eSIM',
    description:
      'Statistiques clés des 18 fichiers fournisseurs, contrôles qualité, comparateur par destination, import de CSV et comparaison entre deux imports.',
    action: 'Ouvrir le dashboard',
  },
  {
    href: '/article/',
    part: 'Partie 2',
    title: 'Article SEO : Internet en croisière',
    description:
      'Quelle eSIM choisir en croisière ? Article prêt à publier, construit à partir d’une analyse de la concurrence et au ton de MyBestSim.',
    action: 'Lire l’article',
  },
]

export function LandingPage() {
  return (
    <>
      <Background />
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>MyBestSim · Test de recrutement</p>
          <h1 className={styles.title}>Stagiaire Développeur IA &amp; Automatisation</h1>
        </header>

        <nav className={styles.parts} aria-label="Livrables du test">
          {PARTS.map((p) => (
            <GlassCard
              key={p.href}
              as="a"
              href={p.href}
              target="_blank"
              rel="noopener"
              interactive
              className={styles.part}
            >
              <span className={styles.partLabel}>{p.part}</span>
              <span className={styles.partTitle}>{p.title}</span>
              <span className={styles.partDescription}>{p.description}</span>
              <span className={styles.partAction}>{p.action} →</span>
            </GlassCard>
          ))}
        </nav>

        <GlassCard as="section" className={styles.usage} aria-label="Usage de l'IA">
          {renderMarkdown(usageIa)}
        </GlassCard>
      </main>
    </>
  )
}
