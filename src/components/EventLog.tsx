import { useEffect, useRef } from 'react'
import type { SimulationEvent } from '../types/simulation'
import { formatTimeFromElapsed } from '../utils/time'

interface EventLogProps {
  events: SimulationEvent[]
}

export function EventLog({ events }: EventLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events.length])
  return (
    <section className="event-log instrument-panel">
      <div className="panel-label"><span>03 / LO QUE VA PASANDO</span><span>{events.length.toString().padStart(2, '0')} EVENTOS</span></div>
      <div className="event-log__body" ref={logRef} aria-live="polite" role="log">
        {events.map((event) => (
          <div className={`event-entry event-entry--${event.tone}`} key={event.id}>
            <time>{formatTimeFromElapsed(event.atMinute)}</time>
            <p>{event.message}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
