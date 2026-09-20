import { useEffect, useMemo, useState } from 'react'
import { NEURAL_DATA } from '../data/neuralGraph'
import { buildNeuralHistory } from '../neural/activity'
import { loadSkeletonData, roleLabel } from '../neural/skeletons'
import { inspectSelectedNeuron, nextReportRotation } from '../neural/reportInspection'
import type { SkeletonData } from '../types/skeleton'
import type { SimulationPlan } from '../types/simulation'
import { FlyBrainSkeleton } from './FlyBrainSkeleton'

export function BrainReport({ plan, onBack }: { plan: SimulationPlan; onBack: () => void }) {
  const { graph } = NEURAL_DATA
  const history = useMemo(() => buildNeuralHistory(graph, plan.events, plan.totalMinutes), [graph, plan])
  const [data, setData] = useState<SkeletonData | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isViewRotating, setIsViewRotating] = useState(true)
  const [viewResetToken, setViewResetToken] = useState(0)
  useEffect(() => { loadSkeletonData().then(setData).catch(() => setData(null)) }, [])
  const peak = useMemo(() => history.reduce((best, frame, minute) => {
    const active = Object.values(frame.values).filter(value => value >= .1).length
    return active > best.active ? { active, minute, frame } : best
  }, { active: 0, minute: 0, frame: history[0] }), [history])
  const selected = useMemo(() => inspectSelectedNeuron(data, graph, selectedId), [data, graph, selectedId])
  const group = (role: 'visual' | 'central' | 'descending') => data?.neurons.filter(neuron => neuron.role === role) ?? []
  const selectNeuron = (bodyId: number) => { setSelectedId(bodyId); setIsViewRotating(current => nextReportRotation(current, 'select')) }
  const clearSelection = () => setSelectedId(null)

  return <main className="brain-report page-shell">
    <header className="topbar"><button className="text-button" onClick={onBack}>← RESULTADO DEL VIAJE</button><span>MALECNS v1.0 · MF-01</span></header>
    <section className="brain-report__intro"><p className="eyebrow">El cerebro de MF-01</p><h1>Real morphology.<br />Simulated activity.</h1><p>Estas líneas son centroline skeletons oficiales de las neuronas usadas por MetroFly. El brillo responde al modelo simplificado del viaje, no a una grabación biológica.</p></section>
    <section className="brain-report__figure"><div className="brain-report__viewer"><FlyBrainSkeleton activity={peak.frame.values} selectedId={selectedId} rotationEnabled={isViewRotating} resetViewToken={viewResetToken} onViewInteraction={() => setIsViewRotating(false)} onSelect={selectNeuron} onData={setData} /><div className="brain-view-controls"><span>Vista</span><button className="text-button" onClick={() => setIsViewRotating(current => nextReportRotation(current, 'toggle'))}>{isViewRotating ? 'PAUSAR ROTACIÓN' : 'REANUDAR ROTACIÓN'}</button><button className="text-button" onClick={() => setViewResetToken(token => token + 1)}>RESTABLECER VISTA</button></div><small className="brain-view-help">Arrastra para rotar · rueda para acercar</small></div><aside className="brain-inspector" aria-live="polite">{selected ? <><p className="eyebrow">Neurona seleccionada</p><h2>{selected.type ?? 'No disponible'}</h2><dl><div><dt>Body ID</dt><dd>{selected.bodyId}</dd></div><div><dt>Instancia</dt><dd>{selected.instance ?? 'No disponible'}</dd></div><div><dt>Rol en MetroFly</dt><dd>{roleLabel[selected.role]}</dd></div><div><dt>Conectividad</dt><dd>{selected.incoming} entrantes · {selected.outgoing} salientes</dd></div><div><dt>Morfología centerline</dt><dd>{selected.originalPointCount.toLocaleString('en-US')} puntos fuente<br />{selected.simplifiedPointCount.toLocaleString('en-US')} puntos renderizados</dd></div><div><dt>Fuente</dt><dd>MaleCNS v1.0<br />HHMI Janelia FlyEM</dd></div></dl><button className="text-button brain-inspector__clear" onClick={clearSelection}>LIMPIAR SELECCIÓN</button></> : <div className="brain-inspector__empty"><p className="eyebrow">Selecciona una neurona</p><p>Haz clic sobre una morfología para inspeccionar su identidad y sus conexiones reales.</p><small>{data ? `${data.metadata.availableNeuronCount} morfologías disponibles.` : 'Cargando morfologías disponibles.'}</small></div>}</aside></section>
    {data ? <section className="brain-facts"><div><span>REAL DATA</span><strong>{data.metadata.availableNeuronCount}</strong><small>centerline skeletons disponibles de {data.metadata.requestedNeuronCount} solicitados</small></div><div><span>CONNECTIVITY</span><strong>{graph.edges.length}</strong><small>conexiones dirigidas verificadas</small></div><div><span>SOURCE POINTS</span><strong>{data.metadata.originalPointCount.toLocaleString('en-US')}</strong><small>puntos SWC oficiales</small></div><div><span>RENDERED</span><strong>{data.metadata.simplifiedPointCount.toLocaleString('en-US')}</strong><small>{Math.round(data.metadata.compressionRatio * 100)} % retenidos con ramas preservadas</small></div></section> : <p className="brain-report__loading">Cargando asset estático de morfología…</p>}
    <section className="brain-boundary"><div><h2>Real</h2><p>Identidades, centerline morphology, conectividad dirigida, pesos sinápticos y procedencia MaleCNS.</p></div><div><h2>Simulated</h2><p>Entrada del viaje, actividad, propagación temporal, ánimo y variación de la ruta.</p></div></section>
    <section className="brain-narrative-state"><p className="eyebrow">Estado narrativo</p><p>MetroFly modela arousal, valencia negativa y persistencia a partir de las condiciones del viaje, y los traduce en Esperanza, Sufrimiento y Arrepentimiento. Es un modelo independiente de MaleCNS, no una medición biológica de emociones.</p></section>
    <section className="brain-groups"><h2>Neuron groups</h2>{(['visual', 'central', 'descending'] as const).map(role => <details key={role}><summary><span>{roleLabel[role]}</span><strong>{group(role).length}</strong></summary><div>{group(role).map(neuron => <button key={neuron.bodyId} className={selectedId === neuron.bodyId ? 'is-selected' : ''} onClick={() => selectNeuron(neuron.bodyId)}>{neuron.bodyId}{neuron.type ? ` · ${neuron.type}` : ''}{neuron.instance ? ` · ${neuron.instance}` : ''}</button>)}</div></details>)}</section>
  </main>
}
