import type { SimulationResult } from '../types/simulation'
import { formatClock, formatDuration } from '../utils/time'
import { useTranslation } from '../i18n'

interface ResultScreenProps {
  result: SimulationResult
  resultCount: number
  onRunAgain: () => void
  onChooseRoute: () => void
  onCompare: () => void
  onReview: () => void
  onBrainReport: () => void
}

export function ResultScreen({ result, resultCount, onRunAgain, onChooseRoute, onCompare, onReview, onBrainReport }: ResultScreenProps) {
  const { t } = useTranslation()
  const success = result.lateMinutes === 0
  return (
    <main className="result-screen page-shell">
      <header className="topbar"><span>{t('resultCompleted')}</span><span>{t('seed', { seed: result.seed })}</span></header>
      <section className="result-hero reveal reveal--1">
        <p className="eyebrow">{t('routeWithName', { route: `${result.routeName}${result.continuation ? ` · ${result.continuation}` : ''}` })}</p>
        <h1>{success ? t('onTime') : t('arrivedLate')}</h1>
        <p className="result-hero__verdict">{success ? t('onTimeVerdict') : t('lateVerdict')}</p>
        <div className="result-hero__arrival">
          <span>{t('arrival')}</span>
          <strong>{formatClock(result.arrivalTime)}</strong>
          <em>{result.lateMinutes > 0 ? t('minutesLate', { minutes: result.lateMinutes }) : t('minutesEarly', { minutes: 60 - result.totalMinutes })}</em>
        </div>
      </section>
      <section className="result-metrics reveal reveal--2">
        <div><span>{t('totalDuration')}</span><strong>{formatDuration(result.totalMinutes)}</strong></div>
        <div><span>{t('waitingMetric')}</span><strong>{result.waitingMinutes} min</strong></div>
        <div><span>{t('transportMetric')}</span><strong>{result.travelMinutes} min</strong></div>
        <div><span>{t('walkConnectionsMetric')}</span><strong>{result.walkingMinutes} min</strong></div>
      </section>
      <div className="result-screen__status"><span>MF-01</span><strong>{t('stillOperational')}</strong><p>{t('trafficNeurons')}</p></div>
      <div className="result-actions reveal reveal--3">
        <button className="button button--brain" type="button" onClick={onBrainReport}>{t('brainReport')}</button>
        <button className="button button--secondary" type="button" onClick={onReview}>{t('reviewTrip')}</button>
        <button className="button button--primary" type="button" onClick={onRunAgain}>{t('runAgain')}</button>
        <button className="button button--secondary" type="button" onClick={onChooseRoute}>{t('changeRoute')}</button>
        {resultCount > 0 && <button className="text-button" type="button" onClick={onCompare}>{t('compareTrips', { count: resultCount })}</button>}
      </div>
    </main>
  )
}
