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
import { getEventMessage, useTranslation } from '../i18n'

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
  const { language, t } = useTranslation()
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
  const situation = state.finished ? t('statusFinished') : segment?.bottleneck ? t('statusTraffic') : state.currentSegmentType === 'wait' ? t('statusWaiting') : state.currentSegmentType === 'walk' ? t('statusWalking') : state.currentSegmentType === 'transfer' ? t('statusTransfer') : state.currentSegmentType === 'metro' ? t('statusMetro') : state.currentSegmentType === 'bus' ? t('statusBus') : t('statusLeaving')
  const eventMessage = event ? getEventMessage(language, event.messageKey, event.messageVariant) : t('eventFallback')

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
        <div className="commute-brand"><strong>MetroFly</strong><span>{t('simulationTitle')}</span></div>
        <div className="commute-mission"><span>Costa del Este → UTP</span><strong>{t('simulationMission')}</strong><small>{t('simulationSchedule')}</small></div>
        <div className={`commute-clock${state.classStarted ? ' is-late' : ''}`}><time>{formatClock(state.currentTime)}</time><span>{state.finished ? state.lateMinutes ? t('minutesLate', { minutes: state.lateMinutes }) : t('arrivedOnTime') : state.classStarted ? elapsed === 60 ? t('classStarted') : t('classStartedAgo', { minutes: state.lateMinutes }) : t('minutesUntilClass', { minutes: 60 - elapsed })}</span></div>
      </header>
      <div className="commute-toolbar">
        <div className="commute-route"><strong>{plan.route.name}</strong><span>{t('seed', { seed: plan.seed })}</span></div>
        <PlaybackControls playback={playback} dispatch={dispatch} onRestart={restart} />
      </div>
      <div className="commute-stage">
        <Suspense fallback={<section className="map-panel panel-loading"><span>{t('mapLoading')}</span></section>}>
          <MapPanel plan={plan} state={state} />
        </Suspense>
        <aside className="commute-subject" aria-label={t('subjectStatus')}>
          <div className="subject-identity"><strong>MF-01</strong><span>Drosophila melanogaster</span></div>
          <FlyAvatar state={state} paused={playback.mode === 'paused'} />
          <div className="subject-situation"><span>{segment && segment.from !== segment.to ? t('from', { location: getLocation(state.currentLocation).name }) : getLocation(state.currentLocation).name}</span><h1>{situation}</h1><p>{state.finished ? t('stillOperational') : segment?.to !== segment?.from && segment ? t('toward', { location: getLocation(segment.to).name }) : t('busWhenItArrives')}</p></div>
          {state.finished ? <section className="arrival-summary" aria-label={t('finalResult')}>
            <dl><div><dt>{t('trip')}</dt><dd>{result.totalMinutes} min</dd></div><div><dt>{t('waiting')}</dt><dd>{result.waitingMinutes} min</dd></div><div><dt>{t('transport')}</dt><dd>{result.travelMinutes} min</dd></div><div><dt>{t('walkConnections')}</dt><dd>{result.walkingMinutes} min</dd></div></dl>
            <button className="button button--primary" onClick={onSummary}>{t('viewResult')}</button>
            <div className="arrival-actions"><button className="text-button" onClick={onRerun}>{t('runAgain')}</button><button className="text-button" onClick={onChooseRoute}>{t('chooseAnotherRoute')}</button><button className="text-button" onClick={onCompare}>{t('compare')}</button></div>
          </section> : <section className="narrative-mood" aria-label={t('narrativeState')}>
            {([{ key: 'hope', label: t('hope') }, { key: 'anxiety', label: t('suffering') }, { key: 'regret', label: t('regret') }] as const).map(({ key, label }) => <div className={`narrative-meter narrative-meter--${key}`} key={key}><label htmlFor={`mood-${key}`}>{label}</label><meter id={`mood-${key}`} min={0} max={100} value={currentMood[key]} /><span>{currentMood[key]}</span></div>)}
            <small><strong>{t('narrativeState')}.</strong> {t('narrativeDetail')}</small>
          </section>}
          {!state.finished && <FlyBrain plan={plan} state={state} paused={playback.mode === 'paused'} />}
        </aside>
      </div>
      <footer className="commute-event">
        <div aria-live="polite" aria-atomic="true"><time>{event ? formatTimeFromElapsed(event.atMinute) : '17:00'}</time><p>{eventMessage}</p></div>
        <button className="text-button" aria-expanded={logOpen} aria-controls="journey-log" onClick={() => setLogOpen(!logOpen)}>{logOpen ? t('closeJourneyLog') : t('openJourneyLog')} {logOpen ? '↓' : '↑'}</button>
        {logOpen && <div id="journey-log" className="journey-log"><EventLog events={state.events} /></div>}
      </footer>
    </main>
  )
}
