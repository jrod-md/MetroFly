import { useMemo } from 'react'
import { NEURAL_DATA } from '../data/neuralGraph'
import { buildNeuralHistory } from '../neural/activity'
import type { SimulationPlan, SimulationState } from '../types/simulation'

// The existing graph and activity model are unchanged. This is only a small readout.
export function FlyBrain({ plan, state }: { plan: SimulationPlan; state: SimulationState }) {
  const { graph, notice } = NEURAL_DATA
  const history = useMemo(() => buildNeuralHistory(graph, plan.events, plan.totalMinutes), [graph, plan])
  const frame = history[Math.min(state.elapsedMinutes, history.length - 1)]
  const active = graph.nodes.filter(node => frame.values[node.id] >= 0.1).length
  return <section className="fly-brain" aria-label="Fly brain">
    <div><strong>Fly brain</strong><span>{active} / {graph.nodes.length} activos*</span></div>
    <svg viewBox="0 0 320 28" role="img" aria-label="Un punto por neurona; brillo según actividad simulada.">
      {graph.nodes.map((node, index) => <circle key={node.id} cx={5 + (index % 32) * 10} cy={4 + Math.floor(index / 32) * 10} r="2.5" opacity={0.18 + frame.values[node.id] * 0.82} />)}
    </svg>
    <small>{graph.metadata.realConnectivity ? `Conectividad: MaleCNS v1.0 · ${graph.edges.length} conexiones.` : 'Conectividad: grafo de demostración.'}<br />Actividad: visualización simplificada de MetroFly. *≥10 %.</small>
    {notice && <small>{notice}</small>}
    <a href="https://male-cns.janelia.org/download/" target="_blank" rel="noreferrer">Fuente: HHMI Janelia · CC-BY-4.0 ↗</a>
  </section>
}
