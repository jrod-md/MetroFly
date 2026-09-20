import { useMemo } from 'react'
import { NEURAL_DATA } from '../data/neuralGraph'
import { buildNeuralHistory } from '../neural/activity'
import type { SimulationPlan, SimulationState } from '../types/simulation'
import { FlyBrainSkeleton } from './FlyBrainSkeleton'

// The existing graph and activity model are unchanged. This is only a small readout.
export function FlyBrain({ plan, state, paused = false }: { plan: SimulationPlan; state: SimulationState; paused?: boolean }) {
  const { graph, notice } = NEURAL_DATA
  const history = useMemo(() => buildNeuralHistory(graph, plan.events, plan.totalMinutes), [graph, plan])
  const frame = history[Math.min(state.elapsedMinutes, history.length - 1)]
  const active = graph.nodes.filter(node => frame.values[node.id] >= 0.1).length
  return <section className="fly-brain" aria-label="Fly brain">
    <div><strong>Fly brain</strong><span>{active} / {graph.nodes.length} activas*</span></div>
    <FlyBrainSkeleton activity={frame.values} paused={paused || state.finished} compact />
    <small>{frame.stimulus}<br />{graph.metadata.realConnectivity ? 'MaleCNS v1.0 · real morphology · simulated activity.' : 'Conectividad: grafo de demostración.'}<br />*Actividad ≥10 %.</small>
    {notice && <small>{notice}</small>}
    <a href="https://male-cns.janelia.org/download/" target="_blank" rel="noreferrer">Fuente: HHMI Janelia · CC-BY-4.0 ↗</a>
  </section>
}
