import { useEffect, useMemo, useState } from 'react'
import { NEURAL_DATA } from '../data/neuralGraph'
import { buildNeuralHistory } from '../neural/activity'
import { loadSkeletonData, roleLabel } from '../neural/skeletons'
import type { SkeletonData } from '../types/skeleton'
import type { SimulationPlan } from '../types/simulation'
import { formatTimeFromElapsed } from '../utils/time'
import { FlyBrainSkeleton } from './FlyBrainSkeleton'

export function BrainReport({ plan, onBack }: { plan: SimulationPlan; onBack: () => void }) {
  const { graph } = NEURAL_DATA
  const history = useMemo(() => buildNeuralHistory(graph, plan.events, plan.totalMinutes), [graph, plan])
  const [data, setData] = useState<SkeletonData | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  useEffect(() => { loadSkeletonData().then(setData).catch(() => setData(null)) }, [])
  const peak = useMemo(() => history.reduce((best, frame, minute) => {
    const active = Object.values(frame.values).filter(value => value >= .1).length
    return active > best.active ? { active, minute, frame } : best
  }, { active: 0, minute: 0, frame: history[0] }), [history])
  const selected = data?.neurons.find(neuron => neuron.bodyId === selectedId) ?? null
  const selectedGraph = selected ? graph.nodes.find(node => node.id === selected.activityKey) : null
  const incoming = selectedGraph ? graph.edges.filter(edge => edge.target === selectedGraph.id).length : 0
  const outgoing = selectedGraph ? graph.edges.filter(edge => edge.source === selectedGraph.id).length : 0
  const event = [...plan.events].reverse().find(item => item.atMinute <= peak.minute)
  const group = (role: 'visual' | 'central' | 'descending') => data?.neurons.filter(neuron => neuron.role === role) ?? []

  return <main className="brain-report page-shell">
    <header className="topbar"><button className="text-button" onClick={onBack}>← RESULTADO DEL VIAJE</button><span>MALECNS v1.0 · MF-01</span></header>
    <section className="brain-report__intro"><p className="eyebrow">El cerebro de MF-01</p><h1>Real morphology.<br />Simulated activity.</h1><p>Estas líneas son centroline skeletons oficiales de las neuronas usadas por MetroFly. El brillo responde al modelo simplificado del viaje, no a una grabación biológica.</p></section>
    <section className="brain-report__figure"><FlyBrainSkeleton activity={peak.frame.values} selectedId={selectedId} onSelect={setSelectedId} onData={setData} /><aside><p className="eyebrow">PICO DEL VIAJE</p><strong>{peak.active} / {graph.nodes.length}</strong><span>neuronas activas*</span><dl><div><dt>Hora</dt><dd>{formatTimeFromElapsed(peak.minute)}</dd></div><div><dt>Evento</dt><dd>{event?.message ?? 'Sin pulso externo'}</dd></div></dl><small>*Actividad simplificada ≥10 %. Haz clic sobre una morfología para inspeccionarla.</small></aside></section>
    {data ? <section className="brain-facts"><div><span>REAL DATA</span><strong>{data.metadata.availableNeuronCount}</strong><small>centerline skeletons disponibles de {data.metadata.requestedNeuronCount} solicitados</small></div><div><span>CONNECTIVITY</span><strong>{graph.edges.length}</strong><small>conexiones dirigidas verificadas</small></div><div><span>SOURCE POINTS</span><strong>{data.metadata.originalPointCount.toLocaleString('en-US')}</strong><small>puntos SWC oficiales</small></div><div><span>RENDERED</span><strong>{data.metadata.simplifiedPointCount.toLocaleString('en-US')}</strong><small>{Math.round(data.metadata.compressionRatio * 100)} % retenidos con ramas preservadas</small></div></section> : <p className="brain-report__loading">Cargando asset estático de morfología…</p>}
    <section className="brain-boundary"><div><h2>Real</h2><p>Identidades, centerline morphology, conectividad dirigida, pesos sinápticos y procedencia MaleCNS.</p></div><div><h2>Simulated</h2><p>Entrada del viaje, actividad, propagación temporal, ánimo y variación de la ruta.</p></div></section>
    <section className="brain-groups"><h2>Neuron groups</h2>{(['visual', 'central', 'descending'] as const).map(role => <details key={role}><summary><span>{roleLabel[role]}</span><strong>{group(role).length}</strong></summary><div>{group(role).map(neuron => <button key={neuron.bodyId} className={selectedId === neuron.bodyId ? 'is-selected' : ''} onClick={() => setSelectedId(neuron.bodyId)}>{neuron.bodyId}{neuron.type ? ` · ${neuron.type}` : ''}{neuron.instance ? ` · ${neuron.instance}` : ''}</button>)}</div></details>)}</section>
    {selected && <section className="neuron-inspector"><p className="eyebrow">Selected morphology</p><h2>{selected.bodyId}{selected.type ? ` · ${selected.type}` : ''}</h2><dl><div><dt>Rol MetroFly</dt><dd>{roleLabel[selected.role]}</dd></div><div><dt>Instancia</dt><dd>{selected.instance ?? 'No disponible'}</dd></div><div><dt>Entrantes / salientes</dt><dd>{incoming} / {outgoing}</dd></div><div><dt>Puntos fuente / render</dt><dd>{selected.originalPointCount} / {selected.simplifiedPointCount}</dd></div></dl><p>Source: MaleCNS v1.0, HHMI Janelia FlyEM. Skeleton: official centerline. Rendering: Canvas 2D projected morphology. Activity: MetroFly simplified simulation.</p></section>}
  </main>
}
