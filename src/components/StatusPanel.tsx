import { getLocation } from '../data/geo'
import { SIMULATION_LIMITS } from '../data/scenarios'
import type { SimulationPlan, SimulationState } from '../types/simulation'
import { formatClock, formatDuration } from '../utils/time'

interface StatusPanelProps {
  plan: SimulationPlan
  state: SimulationState
}

export function StatusPanel({ plan, state }: StatusPanelProps) {
  const deadlineDistance = SIMULATION_LIMITS.classDeadlineMinute - state.elapsedMinutes
  const temporalStatus = state.finished
    ? state.lateMinutes > 0 ? 'LLEGAMOS TARDE' : 'A TIEMPO'
    : deadlineDistance <= 0 ? 'LA CLASE YA EMPEZÓ' : deadlineDistance <= 15 ? 'QUEDA POCO TIEMPO' : 'EN CAMINO'
  const latestEvent = state.events.at(-1)
  return (
    <aside className={`status-panel instrument-panel${state.classStarted ? ' status-panel--late' : ''}`}>
      <div className="panel-label"><span>02 / EL TIEMPO QUE QUEDA</span><span>CLASE 18:00</span></div>
      <div className="clock" aria-label={`Hora simulada ${formatClock(state.currentTime)}`}>{formatClock(state.currentTime)}</div>
      <div className="status-panel__deadline">
        <span>{temporalStatus}</span>
        <strong>{deadlineDistance > 0 ? `${deadlineDistance} min restantes` : `${Math.abs(deadlineDistance)} min tarde`}</strong>
      </div>
      <div className="deadline-meter"><i style={{ transform: `scaleX(${Math.min(1, state.elapsedMinutes / 60)})` }} /></div>
      <dl className="status-readout">
        <div><dt>UBICACIÓN</dt><dd>{state.currentSegment && state.currentSegment.segment.from !== state.currentSegment.segment.to ? `Hacia ${getLocation(state.currentSegment.segment.to).name}` : getLocation(state.currentLocation).name}</dd></div>
        <div><dt>TRAMO</dt><dd>{state.currentSegment?.segment.name ?? 'Llegada a UTP'}</dd></div>
        <div><dt>TRANSCURRIDO</dt><dd>{formatDuration(state.elapsedMinutes)}</dd></div>
        <div><dt>RUTA</dt><dd>{plan.route.shortCode}</dd></div>
      </dl>
      <p className={`status-panel__message status-panel__message--${latestEvent?.tone ?? 'neutral'}`}>
        {latestEvent?.message ?? 'Preparando el viaje.'}
      </p>
    </aside>
  )
}
