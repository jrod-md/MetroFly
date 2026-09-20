import type { NeuralFrame, NeuralGraphData } from '../types/neural'
import type { SimulationEvent } from '../types/simulation'

// Dimensionless visualization settings, not electrophysiological parameters.
export const NEURAL_PARAMETERS = Object.freeze({ baseline: 0.02, decay: 0.55, propagation: 0.35, visualPulse: 0.6, motorPulse: 0.45, trafficPulse: 0.22, trafficMinutes: 6 })

export function transitStimulus(events: readonly SimulationEvent[], minute: number) {
  const now = events.filter(event => event.atMinute === minute)
  let visual = 0, motor = 0
  const labels: string[] = []
  for (const event of now) {
    if (['BUS_ARRIVED', 'METRO_ARRIVED', 'BUS_WRONG_ROUTE'].includes(event.type)) {
      visual = NEURAL_PARAMETERS.visualPulse; labels.push(`${event.type}: pulso visual`)
    }
    if (event.type === 'WALKING') { motor = NEURAL_PARAMETERS.motorPulse; labels.push('WALKING: pulso motor') }
    if (['TRANSFER_STARTED', 'CONTINUATION_SELECTED'].includes(event.type)) {
      visual = NEURAL_PARAMETERS.visualPulse; motor = NEURAL_PARAMETERS.motorPulse; labels.push(`${event.type}: visual + motor`)
    }
  }
  const traffic = events.filter(event => event.type === 'HEAVY_TRAFFIC' && event.atMinute <= minute && minute - event.atMinute < NEURAL_PARAMETERS.trafficMinutes).at(-1)
  if (traffic && (minute - traffic.atMinute) % 2 === 0) {
    visual = Math.max(visual, NEURAL_PARAMETERS.trafficPulse); labels.push('HEAVY_TRAFFIC: pulso visual intermitente')
  }
  return { visual, motor, label: labels.join(' · ') || 'Sin pulso externo · retorno hacia basal' }
}

export function buildNeuralHistory(graph: NeuralGraphData, events: readonly SimulationEvent[], totalMinutes: number): NeuralFrame[] {
  const p = NEURAL_PARAMETERS
  const incoming = new Map(graph.nodes.map(node => [node.id, graph.edges.filter(edge => edge.target === node.id)]))
  const sums = new Map([...incoming].map(([id, edges]) => [id, edges.reduce((sum, edge) => sum + edge.weight, 0)]))
  let values: Record<string, number> = Object.fromEntries(graph.nodes.map(node => [node.id, p.baseline]))
  const hasMotor = graph.nodes.some(node => node.category === 'motor')
  const history: NeuralFrame[] = []
  for (let minute = 0; minute <= totalMinutes; minute++) {
    const stimulus = transitStimulus(events, minute)
    const next: Record<string, number> = {}
    for (const node of graph.nodes) {
      const sum = sums.get(node.id) ?? 0
      const input = sum ? (incoming.get(node.id) ?? []).reduce((value, edge) => value + values[edge.source] * edge.weight / sum, 0) : p.baseline
      const pulse = node.category === 'visual' ? stimulus.visual : node.category === 'motor' || (!hasMotor && node.category === 'descending') ? stimulus.motor : 0
      next[node.id] = Math.min(1, Math.max(0, p.baseline * (1 - p.decay - p.propagation) + p.decay * values[node.id] + p.propagation * input + pulse))
    }
    values = next
    const categories = { visual: 0, central: 0, descending: 0, motor: 0 }
    for (const category of Object.keys(categories) as (keyof typeof categories)[]) {
      const nodes = graph.nodes.filter(node => node.category === category)
      categories[category] = nodes.length ? 100 * nodes.reduce((sum, node) => sum + values[node.id], 0) / nodes.length : 0
    }
    history.push({ values, categories, stimulus: stimulus.label })
  }
  return history
}
