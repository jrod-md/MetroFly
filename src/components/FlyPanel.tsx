import type { SimulationState } from '../types/simulation'
import { FlyAvatar } from './FlyAvatar'

interface FlyPanelProps {
  state: SimulationState
  paused?: boolean
}

export function FlyPanel({ state, paused = false }: FlyPanelProps) {
  return (
    <section className="fly-panel instrument-panel">
      <div className="panel-label"><span>04 / LA MOSCA</span><span>DROSOPHILA / MACHO</span></div>
      <div className="fly-panel__body">
        <FlyAvatar state={state} paused={paused} />
        <div>
          <span>SUJETO MF-01</span>
          <strong>{state.finished ? 'Llegamos a UTP' : paused ? 'En pausa' : state.currentSegment?.segment.bottleneck ? 'Ricardo J. Alfaro' : ({ walk: 'A pie', wait: 'Esperando', bus: 'En el bus', metro: 'En el Metro', transfer: 'Conectando' }[state.currentSegmentType ?? 'walk'])}</strong>
          <p>{state.finished ? (state.lateMinutes ? 'La clase ya empezó. El viaje, por fin, terminó.' : 'La clase todavía no empieza. Podemos respirar.') : paused ? 'El reloj se detuvo. La mosca conserva su estado hasta que reanudes.' : state.classStarted ? 'La clase ya empezó. El viaje sigue.' : state.currentSegment?.segment.bottleneck ? 'Aquí se va el tiempo. El conectoma observa.' : state.currentSegment?.segment.narrative}</p>
        </div>
      </div>
    </section>
  )
}
