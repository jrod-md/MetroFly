import { SIMULATION_TIMING, type PlaybackSpeed } from '../data/scenarios'
import type { PlaybackAction, PlaybackState } from '../simulation/playback'
import { useTranslation } from '../i18n'

interface PlaybackControlsProps { playback: PlaybackState; dispatch: (action: PlaybackAction) => void; onRestart: () => void }
export function PlaybackControls({ playback, dispatch, onRestart }: PlaybackControlsProps) {
  const { t } = useTranslation()
  const speedLabels = { slow: t('speedSlow'), normal: t('speedNormal'), fast: t('speedFast') }
  const statusLabels = { running: t('playbackRunning'), paused: t('playbackPaused'), finished: t('playbackFinished') }
  return (
    <div className="playback-controls" aria-label={t('playbackControls')}>
      <span className={`playback-indicator playback-indicator--${playback.mode}`} role="status">{statusLabels[playback.mode]}</span>
      <button className="button button--secondary" disabled={playback.mode === 'finished'} onClick={() => dispatch({ type: 'toggle' })}>{playback.mode === 'paused' ? t('resume') : t('pause')}</button>
      <button className="button button--secondary" onClick={onRestart}>{playback.mode === 'finished' ? t('replay') : t('restart')}</button>
      <fieldset className="speed-select"><legend>{t('speed')}</legend>
        {(Object.keys(SIMULATION_TIMING) as PlaybackSpeed[]).map((speed) => (
          <button key={speed} aria-label={`${t('speed')}: ${speedLabels[speed]}`} aria-pressed={speed === playback.speed} onClick={() => dispatch({ type: 'speed', speed })}>{speedLabels[speed]}</button>
        ))}
      </fieldset>
      <span className="playback-rate">{t('journeyMinuteRate', { seconds: SIMULATION_TIMING[playback.speed].millisecondsPerMinute / 1000 })}</span>
    </div>
  )
}
