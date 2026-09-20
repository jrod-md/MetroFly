import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MoodSnapshot } from '../types/simulation'

interface MoodHistoryProps {
  history: MoodSnapshot[]
}

export function MoodHistory({ history }: MoodHistoryProps) {
  return (
    <section className="mood-history instrument-panel">
      <div className="panel-label"><span>05 / ASÍ VA EL ÁNIMO</span><span>MODELO NARRATIVO</span></div>
      <div className="mood-history__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 16, right: 16, bottom: 2, left: -22 }}>
            <CartesianGrid stroke="#24527f" strokeOpacity={0.35} vertical={false} />
            <XAxis dataKey="label" minTickGap={44} tick={{ fill: '#81b2df', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: '#81b2df', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0a2a51', border: '1px solid #24527f', color: '#a7dfff', fontSize: 11 }} labelStyle={{ color: '#9acbf3' }} />
            <Line type="monotone" name="Esperanza" dataKey="hope" stroke="#59d4e8" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" name="Ansiedad" dataKey="anxiety" stroke="#f4ad66" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" name="Confusión" dataKey="confusion" stroke="#e6cf76" strokeDasharray="3 3" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" name="Arrepentimiento" dataKey="regret" stroke="#d29bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" name="Alivio" dataKey="relief" stroke="#6da8ff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" name="Resignación" dataKey="resignation" stroke="#d8ce75" strokeWidth={1} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend"><span className="hope">Esperanza</span><span className="anxiety">Ansiedad</span><span className="confusion">Confusión</span><span className="regret">Arrepentimiento</span><span className="relief">Alivio</span><span>Resignación</span></div>
    </section>
  )
}
