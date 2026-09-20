import { SIMULATION_TIMING, type PlaybackSpeed } from '../data/scenarios'
import type { PlaybackAction, PlaybackState } from '../simulation/playback'

interface PlaybackControlsProps { playback: PlaybackState; dispatch: (action: PlaybackAction) => void; onRestart: () => void }
export function PlaybackControls({ playback, dispatch, onRestart }: PlaybackControlsProps) {
  return (
    <div className="playback-controls" aria-label="Controles de reproducción">
      <span className={`playback-indicator playback-indicator--${playback.mode}`} role="status">{{ running: 'EN MARCHA', paused: 'EN PAUSA', finished: 'VIAJE COMPLETADO' }[playback.mode]}</span>
      <button className="button button--secondary" disabled={playback.mode === 'finished'} onClick={() => dispatch({ type: 'toggle' })}>{playback.mode === 'paused' ? 'REANUDAR' : 'PAUSAR'}</button>
      <button className="button button--secondary" onClick={onRestart}>{playback.mode === 'finished' ? 'REPRODUCIR DE NUEVO' : 'REINICIAR'}</button>
      <fieldset className="speed-select"><legend>Velocidad</legend>
        {(Object.keys(SIMULATION_TIMING) as PlaybackSpeed[]).map((speed) => (
          <button key={speed} aria-pressed={speed === playback.speed} onClick={() => dispatch({ type: 'speed', speed })}>{SIMULATION_TIMING[speed].label}</button>
        ))}
      </fieldset>
      <span className="playback-rate">1 min del viaje / {SIMULATION_TIMING[playback.speed].millisecondsPerMinute / 1000} s</span>
    </div>
  )
}
