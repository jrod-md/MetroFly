import type { SimulationResult } from '../types/simulation'
import { formatClock } from '../utils/time'
import { useTranslation } from '../i18n'

interface ComparisonScreenProps {
  results: SimulationResult[]
  onBack: () => void
  onNewRun: () => void
}

export function ComparisonScreen({ results, onBack, onNewRun }: ComparisonScreenProps) {
  const { t } = useTranslation()
  const columns: { key: keyof SimulationResult; label: string; render?: (result: SimulationResult) => string }[] = [
    { key: 'totalMinutes', label: t('total'), render: (result) => `${result.totalMinutes} min` }, { key: 'arrivalTime', label: t('arrival'), render: (result) => formatClock(result.arrivalTime) }, { key: 'lateMinutes', label: t('delay'), render: (result) => `${result.lateMinutes} min` }, { key: 'waitingMinutes', label: t('waiting'), render: (result) => `${result.waitingMinutes} min` }, { key: 'transfers', label: t('connections') }, { key: 'peakAnxiety', label: t('peakAnxiety') }, { key: 'finalRegret', label: t('regret') }, { key: 'narrativeSuffering', label: t('suffering') },
  ]
  return (
    <main className="comparison page-shell">
      <header className="topbar"><button type="button" className="text-button" onClick={onBack}>{t('comparisonBack')}</button><span>{t('comparisonSession')}</span></header>
      <section className="comparison__header reveal reveal--1">
        <p className="eyebrow">{t('comparisonEyebrow')}</p>
        <h1>{t('comparisonHeading').split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
        <p>{t('comparisonIntro')}</p>
      </section>
      {results.length === 0 ? (
        <div className="empty-state"><span>{t('noTrips')}</span><p>{t('noTripsHelp')}</p></div>
      ) : (
        <div className="comparison-table-wrap reveal reveal--2">
          <table className="comparison-table">
            <thead><tr><th>{t('tripRoute')}</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.id}>
                  <th><span>0{index + 1}</span>{result.routeName}<small>{t('sessionSeed', { seed: result.seed })}{result.continuation ? ` · ${result.continuation}` : ''}</small></th>
                  {columns.map((column) => <td key={column.key}>{column.render ? column.render(result) : String(result[column.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="comparison__actions"><button className="button button--primary" type="button" onClick={onNewRun}>{t('tryAnotherRoute')}</button></div>
    </main>
  )
}
