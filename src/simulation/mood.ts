import type { MoodSnapshot, MoodState, SimulationEvent, SimulationPlan } from '../types/simulation'
import type { RouteSegment } from '../types/transit'
import { SIMULATION_LIMITS } from '../data/scenarios'
import { formatTimeFromElapsed } from '../utils/time'

const INITIAL_MOOD: MoodState = {
  hope: 90,
  anxiety: 10,
  confusion: 4,
  regret: 0,
  relief: 8,
  resignation: 0,
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value))
const mapMood = (mood: MoodState, transform: (value: number) => number): MoodState => ({
  hope: transform(mood.hope), anxiety: transform(mood.anxiety),
  confusion: transform(mood.confusion), regret: transform(mood.regret),
  relief: transform(mood.relief), resignation: transform(mood.resignation),
})

const applyMinutePressure = (mood: MoodState, segment: RouteSegment | undefined, minute: number): MoodState => {
  const segmentType = segment?.type
  const deadlinePassed = minute >= SIMULATION_LIMITS.classDeadlineMinute
  const congestionPressure = segment?.bottleneck ? 0.8 : 0
  return {
    hope: clamp(mood.hope - (segmentType === 'wait' ? 0.45 : 0.12) - congestionPressure - (deadlinePassed ? 0.65 : 0)),
    anxiety: clamp(mood.anxiety + (segmentType === 'wait' ? 0.45 : 0.1) + congestionPressure + (minute > 45 ? 0.3 : 0)),
    confusion: clamp(mood.confusion + (segmentType === 'transfer' ? 0.45 : -0.08)),
    regret: clamp(mood.regret + congestionPressure * 0.5 + (deadlinePassed ? 0.25 : 0.02)),
    relief: clamp(mood.relief - 0.2),
    resignation: clamp(mood.resignation + (deadlinePassed ? 1.8 : -0.1)),
  }
}

const applyEvent = (mood: MoodState, event: SimulationEvent): MoodState => {
  const next = { ...mood }
  switch (event.type) {
    case 'FINAL_STRETCH':
      next.hope -= 5; next.anxiety += 7; break
    case 'BUS_ARRIVED':
    case 'METRO_ARRIVED':
      next.hope += 12; next.relief += 22; next.anxiety -= 9; break
    case 'BUS_WRONG_ROUTE':
      next.confusion += 18; next.regret += 7; next.anxiety += 5; break
    case 'CONTINUATION_SELECTED':
      next.confusion += 10; next.anxiety += 5; next.hope -= 4; break
    case 'STILL_WAITING':
      next.hope -= 8; next.anxiety += 13; next.regret += 4; break
    case 'HEAVY_TRAFFIC':
      next.hope -= 9; next.anxiety += 16; next.regret += 8; break
    case 'TRANSFER_MISSED':
      next.anxiety += 22; next.regret += 20; next.confusion += 12; break
    case 'CLASS_STARTED':
      next.hope -= 30; next.resignation += 42; next.regret += 18; break
    case 'ARRIVED_UTP':
      next.relief += 42; next.anxiety -= 24; next.hope += 8; break
    default:
      break
  }
  return mapMood(next, clamp)
}

export const buildMoodHistory = (plan: SimulationPlan): MoodSnapshot[] => {
  const history: MoodSnapshot[] = []
  let mood = { ...INITIAL_MOOD }
  for (let minute = 0; minute <= plan.totalMinutes; minute += 1) {
    const segment = plan.segmentRuns.find((run) => minute - 1 >= run.startMinute && minute - 1 < run.endMinute)?.segment
    if (minute > 0) mood = applyMinutePressure(mood, segment, minute)
    plan.events.filter((event) => event.atMinute === minute).forEach((event) => { mood = applyEvent(mood, event) })
    history.push({ minute, label: formatTimeFromElapsed(minute), ...mapMood(mood, Math.round) })
  }
  return history
}

export const calculateNarrativeSuffering = (mood: MoodState, lateMinutes: number): number =>
  Math.round(clamp(mood.anxiety * 0.32 + mood.regret * 0.3 + mood.resignation * 0.28 + Math.min(10, lateMinutes * 0.5)))
