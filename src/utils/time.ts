import { SCENARIO } from '../data/scenarios'

export const getDepartureTime = (): Date => {
  const date = new Date(2026, 8, 19, SCENARIO.departureHour, SCENARIO.departureMinute, 0, 0)
  return date
}

export const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60_000)

export const formatClock = (date: Date): string =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)

export const formatTimeFromElapsed = (elapsedMinutes: number): string =>
  formatClock(addMinutes(getDepartureTime(), elapsedMinutes))

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours > 0 ? `${hours}h ${remainder.toString().padStart(2, '0')}m` : `${remainder} min`
}
