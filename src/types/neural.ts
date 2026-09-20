export type NeuralCategory = 'visual' | 'motor' | 'descending' | 'central'

export interface NeuralNode {
  id: string
  bodyId: number | null
  type: string | null
  instance: string | null
  side: string | null
  annotations: Record<string, unknown>
  category: NeuralCategory
  categoryBasis: 'path-role' | 'demo'
}

export interface NeuralEdge {
  source: string
  target: string
  weight: number
}

export interface NeuralGraphData {
  metadata: {
    dataset: string
    source: string
    license: string | null
    realConnectivity: boolean
    extractedAt: string | null
    description: string
    nodeCount: number
    edgeCount: number
    methodology?: Record<string, unknown>
    verification?: { bodyIds: boolean; edges: boolean; weights: boolean }
  }
  nodes: NeuralNode[]
  edges: NeuralEdge[]
}

export type NeuralActivity = Record<NeuralCategory, number>

export interface NeuralFrame {
  values: Record<string, number>
  categories: NeuralActivity
  stimulus: string
}
