import { useMemo, useState } from 'react'
import { NEURAL_CATEGORIES } from '../data/neural'
import { NEURAL_DATA } from '../data/neuralGraph'
import { layoutGraph } from '../neural/graph'
import { buildNeuralHistory } from '../neural/activity'
import type { SimulationPlan, SimulationState } from '../types/simulation'

const { graph, notice } = NEURAL_DATA
const positions = layoutGraph(graph)
const maxWeight = Math.max(...graph.edges.map(edge => edge.weight))
const degrees = new Map(graph.nodes.map(node => [node.id, graph.edges.filter(edge => edge.source === node.id || edge.target === node.id).length]))

export function NeuralPanel({ plan, state, paused = false }: { plan: SimulationPlan; state: SimulationState; paused?: boolean }) {
  const history = useMemo(() => buildNeuralHistory(graph, plan.events, plan.totalMinutes), [plan])
  const frame = history[Math.min(Math.floor(state.elapsedMinutes), history.length - 1)]
  const [selectedId, setSelectedId] = useState(graph.nodes[0]?.id)
  const selected = graph.nodes.find(node => node.id === selectedId)
  const connected = graph.edges.filter(edge => edge.source === selectedId || edge.target === selectedId)
  const real = graph.metadata.realConnectivity
  return (
    <section className={`neural-panel instrument-panel${paused || state.finished ? ' is-frozen' : ''}`} aria-label="Male CNS Activity">
      <div className="panel-label"><span>07 / MALE CNS ACTIVITY</span><span>{graph.nodes.length} NODOS / {graph.edges.length} CONEXIONES</span></div>
      <div className="neural-provenance"><strong>{real ? 'REAL CONNECTIVITY' : 'DEMO GRAPH'}</strong><span>{graph.metadata.dataset}</span><span>SIMPLIFIED ACTIVITY</span></div>
      {notice && <p className="neural-notice">{notice}</p>}
      <div className="neural-context"><span>{paused ? 'EN PAUSA' : state.finished ? 'REGISTRO FINAL' : 'ESTÍMULO ACTUAL'}</span><p>{frame.stimulus}</p></div>
      <div className="neural-panel__body">
        <svg className="neural-graph" viewBox="0 0 800 330" role="group" aria-label={`${real ? 'Conectividad MaleCNS' : 'Grafo sintético'}. Selecciona un nodo para inspeccionar sus conexiones. Brillo: actividad simulada.`}>
          {NEURAL_CATEGORIES.map((category, index) => <g key={category.id}>
            <rect x={index * 195 + 12} y="35" width="183" height="280" rx="12" fill={category.color} fillOpacity=".035" stroke={category.color} strokeOpacity=".2" />
            <text x={index * 195 + 103} y="20" textAnchor="middle" fill={category.color}>{category.label}</text>
          </g>)}
          {graph.edges.map(edge => {
            const source = positions.get(edge.source)!, target = positions.get(edge.target)!
            const related = edge.source === selectedId || edge.target === selectedId
            const level = frame.values[edge.source]
            return <path key={`${edge.source}-${edge.target}`} className="neural-edge" style={{ stroke: related ? '#68b9ff' : '#346495', opacity: (related ? 0.5 : 0.16) + level * 0.4, strokeWidth: 0.6 + 2 * Math.sqrt(edge.weight / maxWeight) }} d={`M${source.x} ${source.y} C${(source.x + target.x) / 2 + 20} ${source.y - 18}, ${(source.x + target.x) / 2 - 20} ${target.y + 18}, ${target.x} ${target.y}`}><title>{edge.source} → {edge.target}: {edge.weight} {real ? 'sinapsis' : 'peso sintético'}</title></path>
          })}
          {graph.nodes.map(node => {
            const point = positions.get(node.id)!
            const radius = 4 + Math.min(5, Math.sqrt(degrees.get(node.id) ?? 0))
            return <g key={node.id} role="button" tabIndex={0} aria-label={`Inspeccionar ${real ? 'body ID' : 'nodo demo'} ${node.id}`} aria-pressed={selectedId === node.id} onClick={() => setSelectedId(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(node.id) } }} className="neural-target">
              <title>{node.type ?? node.id} · {Math.round(frame.values[node.id] * 100)} / 100 simulados</title>
              <circle cx={point.x} cy={point.y} r="13" fill="transparent" />
              <circle className={`neural-node neural-node--${node.category}`} style={{ opacity: 0.3 + frame.values[node.id] * 0.7 }} cx={point.x} cy={point.y} r={radius} />
              <circle className="neural-selection" cx={point.x} cy={point.y} r={radius + 4} fill="none" stroke={selectedId === node.id ? '#91caff' : 'transparent'} />
            </g>
          })}
        </svg>
        <div className="neural-readouts"><p className="neural-scale">ACTIVIDAD SIMULADA / 0–100</p>
          {NEURAL_CATEGORIES.map(category => {
            const count = graph.nodes.filter(node => node.category === category.id).length
            return <div key={category.id}><span><b style={{ color: category.color }}>{category.label}</b><small>{count ? `${count} nodos · rol de visualización` : 'Sin nodos en este subgrafo'}</small></span><strong style={{ color: category.color }}>{count ? Math.round(frame.categories[category.id]).toString().padStart(2, '0') : '—'}</strong><i style={{ background: category.color, transform: `scaleX(${frame.categories[category.id] / 100})` }} /></div>
          })}
        </div>
      </div>
      {selected && <div className="neural-inspector">
        <div><span>{real ? 'BODY ID' : 'NODO SINTÉTICO'}</span><strong>{selected.bodyId ?? selected.id}</strong><p>Tipo: {selected.type ?? 'No disponible'} · Instancia: {selected.instance ?? 'No disponible'} · Lado: {selected.side ?? 'No disponible'}</p><p>Rol MetroFly: {selected.category} ({selected.categoryBasis}) · Actividad simulada: {Math.round(frame.values[selected.id] * 100)} / 100</p></div>
        <div><span>CONEXIONES DENTRO DEL SUBGRAFO</span><p>{connected.filter(edge => edge.target === selectedId).length} entrantes · {connected.filter(edge => edge.source === selectedId).length} salientes</p><details><summary>Inspeccionar pesos y anotaciones</summary><ul>{connected.map(edge => <li key={`${edge.source}-${edge.target}`}>{edge.source} → {edge.target} · {edge.weight} {real ? 'sinapsis' : 'peso demo'}</li>)}</ul><pre>{JSON.stringify(selected.annotations, null, 2)}</pre></details></div>
      </div>}
      <p className="fine-print">{real ? 'MaleCNS v1.0 · HHMI Janelia FlyEM · CC-BY-4.0. Identidades, conexiones y pesos extraídos de neuPrint.' : 'No se han cargado identidades ni conexiones MaleCNS.'} Tamaño: grado en este subgrafo. Grosor: peso relativo. Brillo: propagación simulada. Los roles y estímulos son decisiones de MetroFly, no anotaciones biológicas. Sin inferencia emocional ni fidelidad electrofisiológica.</p>
      {real && <p className="fine-print">Extraído: {graph.metadata.extractedAt} · <a href="https://male-cns.janelia.org/download/" target="_blank" rel="noreferrer">Fuente y licencia</a></p>}
    </section>
  )
}
