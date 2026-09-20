import type { MoodSnapshot, MoodState, SimulationEvent, SimulationPlan } from '../types/simulation'
import type { RouteSegment } from '../types/transit'
import { SIMULATION_LIMITS } from '../data/scenarios'
import { formatTimeFromElapsed } from '../utils/time'

const INITIAL_MOOD: MoodState = { hope: 82, anxiety: 10, confusion: 5, regret: 0, relief: 18, resignation: 0, arousal: .12, negativeValence: .08, persistence: .04, deadlinePressure: 0 }

const mapMood = (mood: MoodState, transform: (value: number) => number): MoodState => ({
  hope: transform(mood.hope), anxiety: transform(mood.anxiety),
  confusion: transform(mood.confusion), regret: transform(mood.regret),
  relief: transform(mood.relief), resignation: transform(mood.resignation),
  arousal: transform(mood.arousal), negativeValence: transform(mood.negativeValence), persistence: transform(mood.persistence), deadlinePressure: transform(mood.deadlinePressure),
})

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount
const eventImpact = (events: SimulationEvent[]) => events.reduce((impact, event) => Math.max(impact, ({ HEAVY_TRAFFIC: .9, TRANSFER_MISSED: 1, BUS_WRONG_ROUTE: .62, STILL_WAITING: .6, CLASS_STARTED: .9, FINAL_STRETCH: .42, CONTINUATION_SELECTED: .34, TRANSFER_STARTED: .28, BUS_ARRIVED: -.26, METRO_ARRIVED: -.28, ARRIVED_UTP: -.5 } as Partial<Record<SimulationEvent['type'], number>>)[event.type] ?? 0), 0)

const nextNarrativeState = (previous: MoodState, plan: SimulationPlan, minute: number, segment: RouteSegment | undefined, events: SimulationEvent[], accumulatedWait: number): MoodState => {
  const timeToClass = Math.max(0, SIMULATION_LIMITS.classDeadlineMinute - minute)
  const estimatedRemaining = Math.max(0, plan.totalMinutes - minute)
  const feasibilityRisk = clamp01((estimatedRemaining - timeToClass + 20) / 90)
  const deadlinePressure = minute >= SIMULATION_LIMITS.classDeadlineMinute ? 1 : clamp01((minute - 32) / 28) * (.35 + feasibilityRisk * .65)
  const uncertainty = plan.route.uncertainty === 'unknown' ? .85 : plan.route.uncertainty === 'high' ? .65 : .35
  const waitingBurden = clamp01(accumulatedWait / 24)
  const traffic = segment?.bottleneck ? .72 : 0
  const impact = eventImpact(events)
  const negativeEvent = Math.max(0, impact)
  const positiveEvent = Math.max(0, -impact)
  const lateness = clamp01((minute - SIMULATION_LIMITS.classDeadlineMinute) / 50)
  const arousalTarget = clamp01(.12 + .38 * Math.abs(impact) + .24 * deadlinePressure + .16 * traffic + .1 * uncertainty)
  const negativeTarget = clamp01(.04 + .27 * waitingBurden + .28 * traffic + .23 * deadlinePressure + .18 * lateness + .18 * negativeEvent - .15 * positiveEvent)
  const arousal = lerp(previous.arousal, arousalTarget, .44)
  const negativeValence = lerp(previous.negativeValence, negativeTarget, .28)
  const persistence = clamp01(previous.persistence * .88 + negativeValence * .12)
  const progress = plan.totalMinutes ? minute / plan.totalMinutes : 1
  const hope = 100 * clamp01(.88 - .56 * deadlinePressure - .28 * negativeValence - .12 * uncertainty + .16 * positiveEvent + .08 * Math.min(progress, .7) - .32 * lateness)
  const baseline = plan.route.referenceDurationMinutes ?? plan.totalMinutes
  const outcomeOverrun = clamp01((minute - baseline) / 55)
  const regret = 100 * clamp01(.46 * lateness + .24 * outcomeOverrun + .19 * negativeValence + .11 * persistence)
  const suffering = 100 * clamp01(.5 * negativeValence + .25 * arousal + .25 * persistence)
  return { hope, anxiety: suffering, regret, confusion: 100 * clamp01(.5 * uncertainty + .35 * arousal), relief: 100 * clamp01(.18 + .45 * positiveEvent + .2 * progress - .25 * negativeValence), resignation: 100 * clamp01(.55 * lateness + .45 * persistence), arousal, negativeValence, persistence, deadlinePressure }
}

export const buildMoodHistory = (plan: SimulationPlan): MoodSnapshot[] => {
  const history: MoodSnapshot[] = []
  let mood = { ...INITIAL_MOOD }
  for (let minute = 0; minute <= plan.totalMinutes; minute += 1) {
    const segment = plan.segmentRuns.find((run) => minute - 1 >= run.startMinute && minute - 1 < run.endMinute)?.segment
    const events = plan.events.filter((event) => event.atMinute === minute)
    const accumulatedWait = plan.segmentRuns.reduce((total, run) => total + (run.segment.type === 'wait' ? Math.max(0, Math.min(minute, run.endMinute) - run.startMinute) : 0), 0)
    mood = nextNarrativeState(mood, plan, minute, segment, events, accumulatedWait)
    history.push({ minute, label: formatTimeFromElapsed(minute), ...mapMood(mood, value => Math.round(value * 100) / 100) })
  }
  return history
}

export const calculateNarrativeSuffering = (mood: MoodState, _lateMinutes: number): number => Math.round(mood.anxiety)
