import type { SkeletonData } from '../types/skeleton'
import type { NeuralGraphData } from '../types/neural'

export interface SelectedNeuronInspection {
  bodyId: number
  type: string | null
  instance: string | null
  role: 'visual' | 'central' | 'descending' | 'motor'
  incoming: number
  outgoing: number
  originalPointCount: number
  simplifiedPointCount: number
}

export function inspectSelectedNeuron(data: SkeletonData | null, graph: NeuralGraphData, selectedId: number | null): SelectedNeuronInspection | null {
  if (!data || selectedId === null) return null
  const neuron = data.neurons.find(item => item.bodyId === selectedId)
  if (!neuron) return null
  const node = graph.nodes.find(item => item.id === neuron.activityKey)
  return {
    bodyId: neuron.bodyId,
    type: neuron.type,
    instance: neuron.instance,
    role: neuron.role,
    incoming: node ? graph.edges.filter(edge => edge.target === node.id).length : 0,
    outgoing: node ? graph.edges.filter(edge => edge.source === node.id).length : 0,
    originalPointCount: neuron.originalPointCount,
    simplifiedPointCount: neuron.simplifiedPointCount,
  }
}

// The report view owns this independently from commute playback.
export const nextReportRotation = (isRotating: boolean, action: 'select' | 'toggle' | 'clear') => action === 'select' ? false : action === 'toggle' ? !isRotating : isRotating
