import type { QualityReport } from '@/types/quality'
import { useCatalog } from '@/hooks/useCatalog'
import { QualitySummary } from '@/components/quality/QualitySummary'
import { QualityCheckList } from '@/components/quality/QualityCheckList'
import { FileQualityTable } from '@/components/quality/FileQualityTable'
import styles from './sections.module.css'

interface DataQualitySectionProps {
  report: QualityReport
}

export function DataQualitySection({ report }: DataQualitySectionProps) {
  const { files, toggleFile, enableAllFiles } = useCatalog()
  const rowCount = report.files.reduce((n, f) => n + f.rowCount, 0)

  return (
    <>
      <QualitySummary report={report} rowCount={rowCount} />
      <div className={styles.grid}>
        <QualityCheckList checks={report.checks} />
        <FileQualityTable files={files} quality={report.files} onToggle={toggleFile} onEnableAll={enableAllFiles} />
      </div>
    </>
  )
}
