import type { NeuralGraphData, NeuralNode } from '../types/neural'
import type { NeuralCategory } from '../types/neural'

export const NEURAL_CATEGORIES: { id: NeuralCategory; label: string; description: string; color: string }[] = [
  { id: 'visual', label: 'Visual', description: 'Estímulos del entorno', color: '#f4ad66' },
  { id: 'central', label: 'Intermedia', description: 'Rol dentro del recorrido', color: '#e6cf76' },
  { id: 'descending', label: 'Descendente', description: 'Enlace hacia la salida', color: '#6da8ff' },
  { id: 'motor', label: 'Motor', description: 'Desplazamiento a pie', color: '#59d4e8' },
]

export const DEMO_NEURAL_GRAPH: NeuralGraphData = {
  metadata: { dataset: 'MetroFly demo', source: 'MetroFly', license: null, realConnectivity: false, extractedAt: null, description: 'Topología sintética, sin identidades biológicas.', nodeCount: 11, edgeCount: 14 },
  nodes: [
    { id: 'v1', category: 'visual', x: 20, y: 48 },
    { id: 'v2', category: 'visual', x: 34, y: 32 },
    { id: 'v3', category: 'visual', x: 34, y: 64 },
    { id: 'c1', category: 'central', x: 75, y: 48 },
    { id: 'c2', category: 'central', x: 88, y: 64 },
    { id: 'c3', category: 'central', x: 88, y: 32 },
    { id: 'd1', category: 'descending', x: 137, y: 59 },
    { id: 'd2', category: 'descending', x: 137, y: 37 },
    { id: 'm1', category: 'motor', x: 197, y: 64 },
    { id: 'm2', category: 'motor', x: 197, y: 32 },
    { id: 'm3', category: 'motor', x: 183, y: 48 },
  ].map((node): NeuralNode => ({ id: node.id, category: node.category as NeuralCategory, bodyId: null, type: null, instance: null, side: null, annotations: {}, categoryBasis: 'demo' })),
  edges: [
    { source: 'v1', target: 'v2' }, { source: 'v1', target: 'v3' },
    { source: 'v2', target: 'c1' }, { source: 'v3', target: 'c1' },
    { source: 'v3', target: 'c2' }, { source: 'c1', target: 'c2' },
    { source: 'c1', target: 'c3' }, { source: 'c3', target: 'd2' },
    { source: 'c2', target: 'd1' }, { source: 'c2', target: 'm3' },
    { source: 'd1', target: 'm1' }, { source: 'd1', target: 'm2' },
    { source: 'd2', target: 'm2' }, { source: 'm3', target: 'm1' },
  ].map(edge => ({ ...edge, weight: 1 })),
}
