import type { SimulationResult } from '../types/simulation'
import { formatClock, formatDuration } from '../utils/time'

interface ResultScreenProps {
  result: SimulationResult
  resultCount: number
  onRunAgain: () => void
  onChooseRoute: () => void
  onCompare: () => void
  onReview: () => void
}

export function ResultScreen({ result, resultCount, onRunAgain, onChooseRoute, onCompare, onReview }: ResultScreenProps) {
  const success = result.lateMinutes === 0
  return (
    <main className="result-screen page-shell">
      <header className="topbar"><span>METROFLY / VIAJE COMPLETADO</span><span>SEED {result.seed}</span></header>
      <section className="result-hero reveal reveal--1">
        <p className="eyebrow">Ruta {result.routeName}{result.continuation ? ` · ${result.continuation}` : ''}</p>
        <h1>{success ? 'A TIEMPO' : 'LLEGAMOS TARDE'}</h1>
        <p className="result-hero__verdict">{success ? 'La mosca llegó a tiempo para la clase.' : 'La clase empezó antes de que llegáramos.'}</p>
        <div className="result-hero__arrival">
          <span>LLEGADA</span>
          <strong>{formatClock(result.arrivalTime)}</strong>
          <em>{result.lateMinutes > 0 ? `${result.lateMinutes} minutos tarde` : `${60 - result.totalMinutes} minutos antes`}</em>
        </div>
      </section>
      <section className="result-metrics reveal reveal--2">
        <div><span>DURACIÓN TOTAL</span><strong>{formatDuration(result.totalMinutes)}</strong></div>
        <div><span>ESPERANDO</span><strong>{result.waitingMinutes} min</strong></div>
        <div><span>EN TRANSPORTE</span><strong>{result.travelMinutes} min</strong></div>
        <div><span>A PIE / CONEXIONES</span><strong>{result.walkingMinutes} min</strong></div>
        <div><span>CONEXIONES</span><strong>{result.transfers}</strong></div>
        <div><span>ANSIEDAD MÁXIMA</span><strong>{result.peakAnxiety} / 100</strong></div>
        <div><span>ARREPENTIMIENTO FINAL</span><strong>{result.finalRegret} / 100</strong></div>
        <div className="result-metrics__suffering"><span>SUFRIMIENTO NARRATIVO</span><strong>{result.narrativeSuffering} / 100</strong></div>
      </section>
      <div className="result-screen__status reveal reveal--3"><span>MALE CNS</span><strong>SIGUE OPERATIVO</strong><p>El ánimo es parte del relato, no una medición biológica.</p></div>
      <div className="result-actions reveal reveal--3">
        <button className="button button--secondary" type="button" onClick={onReview}>REVISAR VIAJE TERMINADO</button>
        <button className="button button--primary" type="button" onClick={onRunAgain}>OTRO INTENTO</button>
        <button className="button button--secondary" type="button" onClick={onChooseRoute}>CAMBIAR DE RUTA</button>
        {resultCount > 0 && <button className="text-button" type="button" onClick={onCompare}>COMPARAR VIAJES ({resultCount}) →</button>}
      </div>
    </main>
  )
}
