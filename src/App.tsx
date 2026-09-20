import { useCallback, useEffect, useMemo, useState } from 'react'
import { ComparisonScreen } from './components/ComparisonScreen'
import { Landing } from './components/Landing'
import { ResultScreen } from './components/ResultScreen'
import { BrainReport } from './components/BrainReport'
import { RouteSelection } from './components/RouteSelection'
import { SimulationScreen } from './components/SimulationScreen'
import { createSimulationPlan, createSimulationResult } from './simulation/engine'
import { getRoute } from './data/routes'
import type { MoodSnapshot, SimulationPlan, SimulationResult } from './types/simulation'
import type { TransitRoute } from './types/transit'
import { LanguageProvider, LanguageSwitch } from './i18n'

type Screen = 'landing' | 'routes' | 'simulation' | 'result' | 'comparison' | 'brain-report'

const makeSeed = (): number => Math.floor(10_000 + Math.random() * 89_999)

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [seed, setSeed] = useState(makeSeed)
  const [plan, setPlan] = useState<SimulationPlan | null>(null)
  const [results, setResults] = useState<SimulationResult[]>([])
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null)
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [screen])

  const selectRoute = (route: TransitRoute) => {
    const nextPlan = createSimulationPlan(route, seed)
    setPlan(nextPlan)
    setCurrentResult(null)
    setScreen('simulation')
  }

  const completeSimulation = useCallback((history: MoodSnapshot[]) => {
    if (!plan) return
    const result = createSimulationResult(plan, history)
    setCurrentResult(result)
    setResults((previous) => previous.some((item) => item.id === result.id) ? previous : [...previous, result])
  }, [plan])

  const runAgain = () => {
    if (!plan) return
    const drawnSeed = makeSeed()
    const nextSeed = drawnSeed === plan.seed ? drawnSeed + 1 : drawnSeed
    setSeed(nextSeed)
    setPlan(createSimulationPlan(getRoute(plan.route.id), nextSeed))
    setCurrentResult(null)
    setScreen('simulation')
  }

  const content = useMemo(() => {
    if (screen === 'landing') return <Landing onBegin={() => setScreen('routes')} />
    if (screen === 'routes') return <RouteSelection seed={seed} onSeedChange={setSeed} onSelect={selectRoute} onBack={() => setScreen('landing')} />
    if (screen === 'simulation' && plan) return <SimulationScreen key={plan.id} plan={plan} completed={results.some((result) => result.id === plan.id)} onComplete={completeSimulation} onSummary={() => setScreen('result')} onRerun={runAgain} onCompare={() => setScreen('comparison')} onChooseRoute={() => setScreen('routes')} />
    if (screen === 'result' && currentResult && plan) return <ResultScreen result={currentResult} resultCount={results.length} onRunAgain={runAgain} onChooseRoute={() => setScreen('routes')} onCompare={() => setScreen('comparison')} onReview={() => setScreen('simulation')} onBrainReport={() => setScreen('brain-report')} />
    if (screen === 'brain-report' && plan) return <BrainReport plan={plan} onBack={() => setScreen('result')} />
    if (screen === 'comparison') return <ComparisonScreen results={results} onBack={() => setScreen(currentResult ? 'result' : 'routes')} onNewRun={() => setScreen('routes')} />
    return <Landing onBegin={() => setScreen('routes')} />
  }, [completeSimulation, currentResult, plan, results, screen, seed])

  return <LanguageProvider><LanguageSwitch />{content}</LanguageProvider>
}
