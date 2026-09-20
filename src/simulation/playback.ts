import type { PlaybackSpeed } from '../data/scenarios'

export interface PlaybackState {
  minute: number
  total: number
  speed: PlaybackSpeed
  mode: 'running' | 'paused' | 'finished'
}
export type PlaybackAction = { type: 'tick' | 'toggle' | 'restart' } | { type: 'speed'; speed: PlaybackSpeed }

export const playbackReducer = (state: PlaybackState, action: PlaybackAction): PlaybackState => {
  switch (action.type) {
    case 'tick': {
      if (state.mode !== 'running') return state
      const minute = Math.min(state.total, state.minute + 1)
      return { ...state, minute, mode: minute === state.total ? 'finished' : 'running' }
    }
    case 'toggle': return state.mode === 'finished' ? state : { ...state, mode: state.mode === 'running' ? 'paused' : 'running' }
    case 'restart': return { ...state, minute: 0, mode: 'running' }
    case 'speed': return { ...state, speed: action.speed }
  }
}
