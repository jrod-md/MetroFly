import type { SimulationResult } from '../types/simulation'
import { formatClock } from '../utils/time'

interface CompletionSummaryProps { result: SimulationResult; onSummary: () => void; onRerun: () => void; onCompare: () => void; onChooseRoute: () => void }
export function CompletionSummary({ result, onSummary, onRerun, onCompare, onChooseRoute }: CompletionSummaryProps) {
  return (
    <section className="completion-summary" aria-label="Resultado final">
      <div><p className="eyebrow">LLEGADA A UTP · {result.routeName}</p><h2>{formatClock(result.arrivalTime)} <span>{result.lateMinutes ? `${result.lateMinutes} min tarde` : 'A tiempo'}</span></h2><p>{result.continuation && <strong>{result.continuation}. </strong>}El viaje terminó. Los instrumentos quedan aquí para revisarlos con calma.</p></div>
      <dl><div><dt>Total</dt><dd>{result.totalMinutes} min</dd></div><div><dt>Espera</dt><dd>{result.waitingMinutes} min</dd></div><div><dt>Transporte</dt><dd>{result.travelMinutes} min</dd></div><div><dt>A pie / conexiones</dt><dd>{result.walkingMinutes} min</dd></div></dl>
      <div className="completion-actions"><button className="button button--primary" onClick={onSummary}>VER RESUMEN</button><button className="button button--secondary" onClick={onRerun}>NUEVA SIMULACIÓN</button><button className="text-button" onClick={onCompare}>COMPARAR VIAJES</button><button className="text-button" onClick={onChooseRoute}>CAMBIAR RUTA</button></div>
    </section>
  )
}
