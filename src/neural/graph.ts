import type { NeuralGraphData } from '../types/neural'

// Structural checks are not biological authentication. The extractor verifies provenance.
export function validateRealGraph(input: unknown): NeuralGraphData {
  const graph = input as NeuralGraphData
  const meta = graph?.metadata
  if (!meta || meta.dataset !== 'male-cns:v1.0' || meta.realConnectivity !== true ||
    meta.source !== 'HHMI Janelia FlyEM' || meta.license !== 'CC-BY-4.0' ||
    !meta.extractedAt || !Number.isFinite(Date.parse(meta.extractedAt)) ||
    !meta.verification?.bodyIds || !meta.verification.edges || !meta.verification.weights ||
    !meta.methodology || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new Error('Procedencia incompleta')
  if (graph.nodes.length < 2 || graph.nodes.length > 200 || graph.edges.length < 1 || graph.edges.length > 1500 ||
    meta.nodeCount !== graph.nodes.length || meta.edgeCount !== graph.edges.length) throw new Error('Tamaño o conteos inválidos')
  const ids = new Set<string>()
  for (const node of graph.nodes) {
    if (!Number.isSafeInteger(node.bodyId) || (node.bodyId ?? 0) <= 0 || node.id !== String(node.bodyId) || ids.has(node.id) ||
      !['visual', 'central', 'descending', 'motor'].includes(node.category) || node.categoryBasis !== 'path-role' ||
      !node.annotations || typeof node.annotations !== 'object' || Array.isArray(node.annotations) ||
      [node.type, node.instance, node.side].some(value => value !== null && typeof value !== 'string')) throw new Error('Neurona inválida')
    ids.add(node.id)
  }
  const pairs = new Set<string>()
  for (const edge of graph.edges) {
    const key = `${edge.source}:${edge.target}`
    if (!ids.has(edge.source) || !ids.has(edge.target) || !Number.isSafeInteger(edge.weight) || edge.weight <= 0 || pairs.has(key)) throw new Error('Conexión inválida')
    pairs.add(key)
  }
  return graph
}

export function chooseGraph(raw: string | undefined, fallback: NeuralGraphData): { graph: NeuralGraphData; notice: string | null } {
  if (raw === undefined) return { graph: fallback, notice: 'Sin extracción MaleCNS. Este grafo es sintético.' }
  try { return { graph: validateRealGraph(JSON.parse(raw)), notice: null } }
  catch { return { graph: fallback, notice: 'La extracción no pasó la validación. Se muestra el demo, no datos MaleCNS.' } }
}

export function layoutGraph(graph: NeuralGraphData) {
  const groups = ['visual', 'central', 'descending', 'motor']
  return new Map(graph.nodes.map(node => {
    const peers = graph.nodes.filter(other => other.category === node.category)
    const index = peers.findIndex(other => other.id === node.id)
    const columns = Math.max(1, Math.ceil(Math.sqrt(peers.length / 2)))
    const rows = Math.ceil(peers.length / columns)
    return [node.id, { x: groups.indexOf(node.category) * 195 + 25 + (index % columns + 1) * 155 / (columns + 1), y: 48 + (Math.floor(index / columns) + 1) * 250 / (rows + 1) }]
  }))
}
