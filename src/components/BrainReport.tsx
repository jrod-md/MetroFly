import { useEffect, useMemo, useState } from 'react'
import { NEURAL_DATA } from '../data/neuralGraph'
import { buildNeuralHistory } from '../neural/activity'
import { loadSkeletonData } from '../neural/skeletons'
import { inspectSelectedNeuron, nextReportRotation } from '../neural/reportInspection'
import type { SkeletonData } from '../types/skeleton'
import type { SimulationPlan } from '../types/simulation'
import { FlyBrainSkeleton } from './FlyBrainSkeleton'
import { auditCopy, useTranslation } from '../i18n'

export function BrainReport({ plan, onBack }: { plan: SimulationPlan; onBack: () => void }) {
  const { language, t } = useTranslation(); const copy = auditCopy[language]; const roleLabels = copy.roles
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
    <header className="topbar"><button className="text-button" onClick={onBack}>{copy.brain.back}</button><span>MALECNS v1.0 · MF-01</span></header>
    <section className="brain-report__intro"><p className="eyebrow">{copy.brain.eyebrow}</p><h1>{language === 'es' ? <>Morfología real.<br />Actividad simulada.</> : <>Real morphology.<br />Simulated activity.</>}</h1><p>{copy.brain.intro}</p></section>
    <section className="brain-report__figure"><div className="brain-report__viewer"><FlyBrainSkeleton activity={peak.frame.values} selectedId={selectedId} rotationEnabled={isViewRotating} resetViewToken={viewResetToken} onViewInteraction={() => setIsViewRotating(false)} onSelect={selectNeuron} onData={setData} /><div className="brain-view-controls"><span>{copy.brain.view}</span><button className="text-button" onClick={() => setIsViewRotating(current => nextReportRotation(current, 'toggle'))}>{isViewRotating ? t('pauseRotation') : t('resumeRotation')}</button><button className="text-button" onClick={() => setViewResetToken(token => token + 1)}>{t('resetView')}</button></div><small className="brain-view-help">{t('viewHelp')}</small></div><aside className="brain-inspector" aria-live="polite">{selected ? <><p className="eyebrow">{t('selectedNeuron')}</p><h2>{selected.type ?? t('unavailable')}</h2><dl><div><dt>bodyId</dt><dd>{selected.bodyId}</dd></div><div><dt>{copy.brain.instance}</dt><dd>{selected.instance ?? t('unavailable')}</dd></div><div><dt>{t('role')}</dt><dd>{roleLabels[selected.role]}</dd></div><div><dt>{t('connectivity')}</dt><dd>{selected.incoming} {copy.brain.incoming} · {selected.outgoing} {copy.brain.outgoing}</dd></div><div><dt>{t('morphology')}</dt><dd>{selected.originalPointCount.toLocaleString('en-US')} {t('sourcePoints')}<br />{selected.simplifiedPointCount.toLocaleString('en-US')} {t('renderedPoints')}</dd></div><div><dt>{t('source')}</dt><dd>MaleCNS v1.0<br />HHMI Janelia FlyEM</dd></div></dl><button className="text-button brain-inspector__clear" onClick={clearSelection}>{t('clearSelection')}</button></> : <div className="brain-inspector__empty"><p className="eyebrow">{t('selectNeuron')}</p><p>{t('selectNeuronHelp')}</p><small>{data ? copy.brain.available.replace('{count}', String(data.metadata.availableNeuronCount)) : copy.brain.loading}</small></div>}</aside></section>
    {data ? <section className="brain-facts"><div><span>{copy.brain.realData}</span><strong>{data.metadata.availableNeuronCount}</strong><small>{language === 'es' ? `esqueletos centerline disponibles de ${data.metadata.requestedNeuronCount} solicitados` : `centerline skeletons available of ${data.metadata.requestedNeuronCount} requested`}</small></div><div><span>{copy.brain.connectivity}</span><strong>{graph.edges.length}</strong><small>{language === 'es' ? 'conexiones dirigidas verificadas' : 'verified directed connections'}</small></div><div><span>{copy.brain.sourcePoints}</span><strong>{data.metadata.originalPointCount.toLocaleString('en-US')}</strong><small>{language === 'es' ? 'puntos SWC oficiales' : 'official SWC points'}</small></div><div><span>{copy.brain.rendered}</span><strong>{data.metadata.simplifiedPointCount.toLocaleString('en-US')}</strong><small>{language === 'es' ? `${Math.round(data.metadata.compressionRatio * 100)} % retenidos con ramas preservadas` : `${Math.round(data.metadata.compressionRatio * 100)}% retained with branches preserved`}</small></div></section> : <p className="brain-report__loading">{copy.loadingMorphology}…</p>}
    <section className="brain-boundary"><div><h2>{copy.brain.real}</h2><p>{copy.brain.realDescription}</p></div><div><h2>{copy.brain.simulated}</h2><p>{copy.brain.simulatedDescription}</p></div></section>
    <section className="brain-narrative-state"><p className="eyebrow">{copy.brain.narrativeHeading}</p><p>{copy.brain.narrativeDescription}</p></section>
    <section className="brain-groups"><h2>{copy.brain.groups}</h2>{(['visual', 'central', 'descending'] as const).map(role => <details key={role}><summary><span>{roleLabels[role]}</span><strong>{group(role).length}</strong></summary><div>{group(role).map(neuron => <button key={neuron.bodyId} className={selectedId === neuron.bodyId ? 'is-selected' : ''} onClick={() => selectNeuron(neuron.bodyId)}>{neuron.bodyId}{neuron.type ? ` · ${neuron.type}` : ''}{neuron.instance ? ` · ${neuron.instance}` : ''}</button>)}</div></details>)}</section>
  </main>
}
