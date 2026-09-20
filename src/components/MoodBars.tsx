import type { MoodState } from '../types/simulation'

interface MoodBarsProps {
  mood: MoodState
}

const MOODS: { key: keyof MoodState; label: string }[] = [
  { key: 'hope', label: 'Esperanza' },
  { key: 'anxiety', label: 'Ansiedad' },
  { key: 'confusion', label: 'Confusión' },
  { key: 'regret', label: 'Arrepentimiento' },
  { key: 'relief', label: 'Alivio' },
  { key: 'resignation', label: 'Resignación' },
]

export function MoodBars({ mood }: MoodBarsProps) {
  return (
    <section className="mood-bars instrument-panel">
      <div className="panel-label"><span>06 / ÁNIMO ACTUAL</span><span>0—100</span></div>
      <div className="mood-bars__list">
        {MOODS.map(({ key, label }) => (
          <div className="mood-bar" key={key}>
            <div><span>{label}</span><strong>{mood[key]}</strong></div>
            <div className="mood-bar__track"><i className={`mood-bar__fill mood-bar__fill--${key}`} style={{ transform: `scaleX(${mood[key] / 100})` }} /></div>
          </div>
        ))}
      </div>
      <p className="fine-print">Modelo narrativo; no es una inferencia de emociones biológicas.</p>
    </section>
  )
}
