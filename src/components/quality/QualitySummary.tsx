import type { QualityReport, QualityStatus } from '@/types/quality'
import { formatNumber } from '@/utils/format'
import { GlassCard } from '@/components/ui/GlassCard'
import { Icon } from '@/components/ui/Icon'
import { STATUS_META } from '@/constants/quality'
import styles from './QualitySummary.module.css'

const ORDER: QualityStatus[] = ['ok', 'info', 'warning', 'error']

function verdict({ counts }: QualityReport) {
  if (counts.error) return { tone: 'error', text: 'Des données sont inexploitables : certaines lignes ou fichiers ont été écartés des statistiques.' }
  if (counts.warning)
    return { tone: 'warning', text: 'Données exploitables : aucune erreur bloquante, mais quelques incohérences sont à connaître pour bien lire les chiffres.' }
  return { tone: 'ok', text: 'Données exploitables : tous les contrôles sont validés.' }
}

interface QualitySummaryProps {
  report: QualityReport
  rowCount: number
}

export function QualitySummary({ report, rowCount }: QualitySummaryProps) {
  const total = report.checks.length
  const { tone, text } = verdict(report)

  return (
    <GlassCard className={styles.summary}>
      <div className={styles.score}>
        <span className={`${styles.shield} ${styles[tone]}`}>
          <Icon name="shield" size={30} />
        </span>
        <div>
          <p className={styles.scoreValue}>
            {report.counts.ok + report.counts.info}
            <span>/{total}</span>
          </p>
          <p className={styles.scoreLabel}>contrôles sans anomalie</p>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.verdict}>{text}</p>
        <p className={styles.scope}>
          {total} contrôles automatiques sur {report.files.length} fichiers et {formatNumber(rowCount)} lignes, recalculés
          automatiquement à partir des fichiers chargés.
        </p>
        <ul className={styles.counts}>
          {ORDER.map((status) => (
            <li key={status} className={styles[status]}>
              <Icon name={STATUS_META[status].icon} size={14} />
              <strong>{report.counts[status]}</strong> {STATUS_META[status].countLabel(report.counts[status])}
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  )
}
