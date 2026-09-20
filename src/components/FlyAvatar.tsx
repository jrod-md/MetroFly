import { useId } from 'react'
import type { SimulationState } from '../types/simulation'

type FlyPose = 'idle' | 'moving' | 'waiting' | 'alarmed' | 'relieved' | 'defeated'
interface FlyAvatarProps { state?: SimulationState; large?: boolean; paused?: boolean }
const getPose = (state?: SimulationState): FlyPose => {
  if (!state) return 'idle'
  if (state.finished) return state.lateMinutes > 0 ? 'defeated' : 'relieved'
  if (state.classStarted) return 'defeated'
  if (state.currentSegment?.segment.bottleneck || state.events.at(-1)?.type === 'HEAVY_TRAFFIC') return 'alarmed'
  if (state.currentSegmentType === 'wait') return 'waiting'
  return 'moving'
}
const LABELS: Record<FlyPose, string> = {
  idle: 'Lista para salir', moving: 'En movimiento', waiting: 'Esperando',
  alarmed: 'En el tranque', defeated: 'La clase ya empezó', relieved: 'A tiempo',
}

// Original dorsal illustration: six articulated legs, two veined wings,
// halteres, compound eyes and a dark rounded male abdomen.
export function FlyAvatar({ state, large = false, paused = false }: FlyAvatarProps) {
  const id = useId().replaceAll(':', '')
  const pose = getPose(state)
  return (
    <div className={`fly-avatar fly-avatar--${pose}${large ? ' fly-avatar--large' : ''}${paused || state?.finished ? ' is-frozen' : ''}`} role="img" aria-label={`Drosophila macho: ${LABELS[pose]}${paused ? ', reproducción en pausa' : ''}`}>
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-shell`}><stop stopColor="#644326" /><stop offset=".38" stopColor="#edb76c" /><stop offset=".64" stopColor="#bc7b40" /><stop offset="1" stopColor="#482f28" /></linearGradient>
          <linearGradient id={`${id}-wing`} x2="1" y2="1"><stop stopColor="#3a7eb8" stopOpacity=".28" /><stop offset=".6" stopColor="#86d8f5" stopOpacity=".5" /><stop offset="1" stopColor="#3777bf" stopOpacity=".16" /></linearGradient>
          <radialGradient id={`${id}-eye`} cx=".35" cy=".3" r=".8"><stop stopColor="#ffb37e" /><stop offset=".45" stopColor="#cf6349" /><stop offset="1" stopColor="#652e36" /></radialGradient>
          <pattern id={`${id}-facets`} width="6" height="5" patternUnits="userSpaceOnUse"><path d="m0 2.5 3-2 3 2-3 2Z" fill="none" stroke="#552b33" strokeWidth=".6" opacity=".5" /></pattern>
        </defs>
        <g className="fly-avatar__body">
          <g className="fly-legs" fill="none" stroke="#d9a465" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
            <path className="fly-leg-a" d="m161 128-35-18-13-34-19-8m20 8-8-16" />
            <path className="fly-leg-b" d="m156 151-45 5-32 28-19 2m19-2-2 9" />
            <path className="fly-leg-a" d="m163 175-28 35-2 47-15 16m15-16 6 8" />
            <path className="fly-leg-b" d="m199 128 35-18 13-34 19-8m-20 8 8-16" />
            <path className="fly-leg-a" d="m204 151 45 5 32 28 19 2m-19-2 2 9" />
            <path className="fly-leg-b" d="m197 175 28 35 2 47 15 16m-15-16-6 8" />
          </g>
          <g fill="#edbf7c" stroke="#714e30" strokeWidth="2"><path d="m158 165-18 14m62-14 18 14" /><ellipse cx="140" cy="180" rx="5" ry="7" /><ellipse cx="220" cy="180" rx="5" ry="7" /></g>
          <path d="M158 155c-11 20-12 57-4 82 5 16 15 25 26 26s22-10 26-26c9-26 6-62-4-82Z" fill={`url(#${id}-shell)`} stroke="#322b30" strokeWidth="2" />
          <g fill="#322b30"><path d="M151 190q29 13 58 0l1 10q-30 15-60 0Z" /><path d="M151 216q29 13 58 0l-2 13q-27 13-54 0Z" /><path d="M155 238q25 10 50 0c-6 32-43 36-50 0Z" /></g>
          <g className="fly-wing fly-wing--left">
            <path d="M171 137C144 141 78 167 62 214c-8 25 8 38 30 29 31-13 64-54 79-106Z" fill={`url(#${id}-wing)`} stroke="#70bbdf" strokeWidth="1.5" />
            <path d="M169 141 78 237m85-91-76 42-22 36m96-69-46 67-25 21m57-68-18 15-22-6m21 8 1 14-25 2m-9-19-6 30" fill="none" stroke="#65a9ce" strokeWidth=".9" />
          </g>
          <g className="fly-wing fly-wing--right">
            <path d="M189 137c27 4 93 30 109 77 8 25-8 38-30 29-31-13-64-54-79-106Z" fill={`url(#${id}-wing)`} stroke="#70bbdf" strokeWidth="1.5" />
            <path d="m191 141 91 96m-85-91 76 42 22 36m-96-69 46 67 25 21m-57-68 18 15 22-6m-21 8-1 14 25 2m9-19 6 30" fill="none" stroke="#65a9ce" strokeWidth=".9" />
          </g>
          <path d="M180 100c-30 0-33 29-25 53 5 14 15 20 25 21 10-1 20-7 25-21 8-24 5-53-25-53Z" fill={`url(#${id}-shell)`} stroke="#322b30" strokeWidth="2" />
          <path d="M176 108q-9 30 1 53m8-53q9 30-1 53" fill="none" stroke="#593c29" strokeWidth="3" opacity=".7" />
          <path d="m159 113-10-11m52 11 10-11m-57 26-14-3m65 3 14-3m-62 20-12 5m58-5 12 5m-48-33-3-9m21 9 3-9" stroke="#e8bb7c" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="180" cy="91" rx="27" ry="22" fill={`url(#${id}-shell)`} stroke="#322b30" strokeWidth="2" />
          {[158, 202].map((x) => <g key={x} transform={`rotate(${x < 180 ? -18 : 18} ${x} 89)`}><ellipse cx={x} cy="89" rx="14" ry="22" fill={`url(#${id}-eye)`} stroke="#683638" strokeWidth="1.4" /><ellipse cx={x} cy="89" rx="13" ry="21" fill={`url(#${id}-facets)`} /></g>)}
          <path d="m175 78-7-16-10-9m27 25 7-16 10-9m-34 9-9 1m9-1-1-9m25 9 9 1m-9-1 1-9" fill="none" stroke="#e4b577" strokeWidth="1.4" strokeLinecap="round" />
          <path d="m175 104 5 9 5-9" fill="#80532f" />
        </g>
      </svg>
      <span className="fly-avatar__pose">{paused ? 'Observación en pausa' : state?.finished && state.lateMinutes > 0 ? 'Tarde, pero aquí' : LABELS[pose]}</span>
    </div>
  )
}
