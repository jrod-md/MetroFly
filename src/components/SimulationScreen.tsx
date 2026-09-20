import { lazy, Suspense, useEffect, useMemo, useReducer, useRef } from 'react'
import { SIMULATION_TIMING } from '../data/scenarios'
import { createSimulationResult, getSimulationState } from '../simulation/engine'
import { playbackReducer } from '../simulation/playback'
import { PlaybackControls } from './PlaybackControls'
import { CompletionSummary } from './CompletionSummary'
import { buildMoodHistory } from '../simulation/mood'
import type { MoodSnapshot, SimulationPlan } from '../types/simulation'
import { EventLog } from './EventLog'
import { FlyPanel } from './FlyPanel'
import { MoodBars } from './MoodBars'
import { NeuralPanel } from './NeuralPanel'
import { StatusPanel } from './StatusPanel'

const MapPanel = lazy(() => import('./MapPanel').then((module) => ({ default: module.MapPanel })))
const MoodHistory = lazy(() => import('./MoodHistory').then((module) => ({ default: module.MoodHistory })))

interface SimulationScreenProps {
  plan: SimulationPlan
  onComplete: (history: MoodSnapshot[]) => void
  completed?: boolean
  onSummary: () => void
  onRerun: () => void
  onCompare: () => void
  onChooseRoute: () => void
}

export function SimulationScreen({ plan, onComplete, completed = false, onSummary, onRerun, onCompare, onChooseRoute }: SimulationScreenProps) {
  const [playback, dispatch] = useReducer(playbackReducer, { minute: completed ? plan.totalMinutes : 0, total: plan.totalMinutes, speed: 'normal', mode: completed ? 'finished' : 'running' })
  const reported = useRef(completed)
  const elapsed = playback.minute
  const moodHistory = useMemo(() => buildMoodHistory(plan), [plan])
  const state = useMemo(() => getSimulationState(plan, elapsed), [plan, elapsed])
  const visibleMoodHistory = moodHistory.slice(0, elapsed + 1)
  const currentMood = visibleMoodHistory.at(-1) ?? moodHistory[0]
  const result = useMemo(() => createSimulationResult(plan, moodHistory), [plan, moodHistory])
  const restart = () => { reported.current = false; dispatch({ type: 'restart' }) }

  useEffect(() => {
    if (playback.mode === 'finished' && !reported.current) {
      reported.current = true
      onComplete(moodHistory)
    }
    if (playback.mode !== 'running') return
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), SIMULATION_TIMING[playback.speed].millisecondsPerMinute)
    return () => window.clearTimeout(timer)
  }, [elapsed, moodHistory, onComplete, playback.mode, playback.speed])

  return (
    <main className="simulation-shell">
      <header className="simulation-header">
        <div><span className="status-dot status-dot--live" /> METROFLY</div>
        <strong>LA CLASE DE LAS 6</strong>
        <span>SEMILLA {plan.seed} · {plan.route.name}</span>
      </header>
      <div className="playback-dock"><PlaybackControls playback={playback} dispatch={dispatch} onRestart={restart} />
        {state.finished && <CompletionSummary result={result} onSummary={onSummary} onRerun={onRerun} onCompare={onCompare} onChooseRoute={onChooseRoute} />}
      </div>
      <ol className="journey-stages" aria-label="Etapas del recorrido" style={{ gridTemplateColumns: `repeat(${plan.segmentRuns.length}, minmax(0, 1fr))` }}>
        {plan.segmentRuns.map((run, index) => (
          <li key={run.segment.id} aria-current={state.currentSegment === run ? 'step' : undefined} className={`${run.endMinute <= elapsed ? 'is-complete' : state.currentSegment === run ? 'is-current' : ''} ${run.segment.bottleneck ? 'is-bottleneck' : ''}`}>
            <span>{String(index + 1).padStart(2, '0')} / {run.endMinute <= elapsed ? 'COMPLETADO' : state.currentSegment === run ? 'AHORA' : 'POR DELANTE'}</span>
            <strong>{run.segment.name}</strong>
          </li>
        ))}
      </ol>
      <div className="simulation-grid">
        <Suspense fallback={<section className="map-panel instrument-panel panel-loading"><div className="loading-line" /><span>CARGANDO EL MAPA</span></section>}>
          <MapPanel plan={plan} state={state} />
        </Suspense>
        <StatusPanel plan={plan} state={state} />
        <EventLog events={state.events} />
        <FlyPanel state={state} paused={playback.mode === 'paused'} />
        <Suspense fallback={<section className="mood-history instrument-panel panel-loading"><div className="loading-line" /><span>CARGANDO HISTORIAL</span></section>}>
          <MoodHistory history={visibleMoodHistory} />
        </Suspense>
        {currentMood && <MoodBars mood={currentMood} />}
        <NeuralPanel plan={plan} state={state} paused={playback.mode === 'paused'} />
      </div>
    </main>
  )
}
