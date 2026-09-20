import { lazy, Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { SIMULATION_TIMING } from '../data/scenarios'
import { createSimulationResult, getSimulationState } from '../simulation/engine'
import { playbackReducer } from '../simulation/playback'
import { PlaybackControls } from './PlaybackControls'
import { buildMoodHistory } from '../simulation/mood'
import type { MoodSnapshot, SimulationPlan } from '../types/simulation'
import { EventLog } from './EventLog'
import { FlyAvatar } from './FlyAvatar'
import { FlyBrain } from './FlyBrain'
import { getLocation } from '../data/geo'
import { formatClock, formatTimeFromElapsed } from '../utils/time'

const MapPanel = lazy(() => import('./MapPanel').then((module) => ({ default: module.MapPanel })))

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
  const [logOpen, setLogOpen] = useState(false)
  const elapsed = playback.minute
  const moodHistory = useMemo(() => buildMoodHistory(plan), [plan])
  const state = useMemo(() => getSimulationState(plan, elapsed), [plan, elapsed])
  const currentMood = moodHistory[elapsed] ?? moodHistory[0]
  const result = useMemo(() => createSimulationResult(plan, moodHistory), [plan, moodHistory])
  const restart = () => { reported.current = false; setLogOpen(false); dispatch({ type: 'restart' }) }
  const event = state.events.at(-1)
  const segment = state.currentSegment?.segment
  const situation = state.finished ? 'UTP. Por fin.' : segment?.bottleneck ? 'Atrapada en Ricardo J. Alfaro.' : state.currentSegmentType === 'wait' ? 'Still waiting.' : segment?.name ?? 'Saliendo del trabajo.'

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
    <main className="commute-screen">
      <header className="commute-header">
        <div className="commute-brand"><strong>MetroFly</strong><span>The 6 PM Class</span></div>
        <div className="commute-mission"><span>Costa del Este → UTP</span><strong>Una mosca. Tu viaje al salir del trabajo.</strong><small>Salida 17:00 · Clase 18:00</small></div>
        <div className={`commute-clock${state.classStarted ? ' is-late' : ''}`}><time>{formatClock(state.currentTime)}</time><span>{state.finished ? state.lateMinutes ? `${state.lateMinutes} min tarde` : 'Llegamos a tiempo' : state.classStarted ? elapsed === 60 ? 'Class has started.' : `La clase empezó hace ${state.lateMinutes} min` : `${60 - elapsed} min para llegar`}</span></div>
      </header>
      <div className="commute-toolbar">
        <div className="commute-route"><strong>{plan.route.name}</strong><span>Semilla {plan.seed}</span></div>
        <PlaybackControls playback={playback} dispatch={dispatch} onRestart={restart} />
      </div>
      <div className="commute-stage">
        <Suspense fallback={<section className="map-panel panel-loading"><span>Cargando el mapa del recorrido…</span></section>}>
          <MapPanel plan={plan} state={state} />
        </Suspense>
        <aside className="commute-subject" aria-label="Estado de MF-01">
          <div className="subject-identity"><strong>MF-01</strong><span>Drosophila melanogaster</span></div>
          <FlyAvatar state={state} paused={playback.mode === 'paused'} />
          <div className="subject-situation"><span>{segment && segment.from !== segment.to ? 'Desde ' : ''}{getLocation(state.currentLocation).name}</span><h1>{situation}</h1><p>{state.finished ? 'Still operational.' : segment?.to !== segment?.from && segment ? `Hacia ${getLocation(segment.to).name}` : 'El bus llegará cuando llegue.'}</p></div>
          {state.finished ? <section className="arrival-summary" aria-label="Resultado final">
            <dl><div><dt>Viaje</dt><dd>{result.totalMinutes} min</dd></div><div><dt>Espera</dt><dd>{result.waitingMinutes} min</dd></div><div><dt>Transporte</dt><dd>{result.travelMinutes} min</dd></div><div><dt>A pie / conexiones</dt><dd>{result.walkingMinutes} min</dd></div></dl>
            <button className="button button--primary" onClick={onSummary}>Ver resultado</button>
            <div className="arrival-actions"><button className="text-button" onClick={onRerun}>Otro intento</button><button className="text-button" onClick={onChooseRoute}>Otra ruta</button><button className="text-button" onClick={onCompare}>Comparar</button></div>
          </section> : <section className="narrative-mood" aria-label="Estado narrativo simulado">
            {([{ key: 'hope', label: 'Esperanza' }, { key: 'anxiety', label: 'Sufrimiento' }, { key: 'regret', label: 'Arrepentimiento' }] as const).map(({ key, label }) => <div className={`narrative-meter narrative-meter--${key}`} key={key}><label htmlFor={`mood-${key}`}>{label}</label><meter id={`mood-${key}`} min={0} max={100} value={currentMood[key]} /><span>{currentMood[key]}</span></div>)}
            <small><strong>Estado narrativo simulado.</strong> Modelo independiente de MaleCNS: interpreta condiciones del viaje, no emociones medidas.</small>
          </section>}
          {!state.finished && <FlyBrain plan={plan} state={state} paused={playback.mode === 'paused'} />}
        </aside>
      </div>
      <footer className="commute-event">
        <div aria-live="polite" aria-atomic="true"><time>{event ? formatTimeFromElapsed(event.atMinute) : '17:00'}</time><p>{event?.message ?? 'MF-01 sale del trabajo. La clase empieza a las seis.'}</p></div>
        <button className="text-button" aria-expanded={logOpen} aria-controls="journey-log" onClick={() => setLogOpen(!logOpen)}>{logOpen ? 'Cerrar registro' : 'Ver registro del viaje'} {logOpen ? '↓' : '↑'}</button>
        {logOpen && <div id="journey-log" className="journey-log"><EventLog events={state.events} /></div>}
      </footer>
    </main>
  )
}
