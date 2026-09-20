import { ROUTES } from '../data/routes'
import type { TransitRoute } from '../types/transit'

interface RouteSelectionProps {
  seed: number
  onSeedChange: (seed: number) => void
  onSelect: (route: TransitRoute) => void
  onBack: () => void
}

export function RouteSelection({ seed, onSeedChange, onSelect, onBack }: RouteSelectionProps) {
  return (
    <main className="page-shell route-select">
      <header className="topbar">
        <button className="text-button" type="button" onClick={onBack}>← METROFLY</button>
        <span>01 / ELIGE EL RECORRIDO</span>
      </header>
      <section className="route-select__intro reveal reveal--1">
        <p className="eyebrow">La clase de las 6</p>
        <h1>¿Por dónde nos vamos?</h1>
        <p>Elige el recorrido. Después, observa cómo avanza el viaje. La mosca también tiene clase.</p>
        <label className="seed-control">
          <span>SEMILLA / REPITE EL MISMO VIAJE</span>
          <input type="number" value={seed} onChange={(event) => onSeedChange(Number(event.target.value) || 1)} />
        </label>
      </section>
      <section className="route-list" aria-label="Available routes">
        {ROUTES.map((route, index) => (
          <article className="route-row reveal" style={{ '--delay': `${index * 90 + 160}ms` } as React.CSSProperties} key={route.id}>
            <div className="route-row__index">0{index + 1}</div>
            <div className="route-row__main">
              <span className="route-row__code" style={{ color: route.accent }}>{route.shortCode}</span>
              <h2>{route.name}</h2>
              <p>{route.description}</p>
              <div className="route-row__notes">
                {route.notes.map((note) => <span key={note}>{note}</span>)}
              </div>
            </div>
            <div className="route-row__meta">
              <div><span>REFERENCIA</span><strong>{route.referenceDurationMinutes ? `~${route.referenceDurationMinutes} min` : 'Sin datos'}</strong></div>
              <div><span>INCERTIDUMBRE</span><strong>{{ moderate: 'Moderada', high: 'Alta', unknown: 'Desconocida' }[route.uncertainty]}</strong></div>
              <div><span>CONEXIONES</span><strong>{route.id === 'pirata' ? '1–2' : route.transfers}</strong></div>
            </div>
            <button className="button button--route" type="button" onClick={() => onSelect(route)}>
              SIMULAR RUTA <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </section>
      <aside className="route-select__disclaimer">
        Las referencias provienen de experiencias personales, no de un horario garantizado. Los tiempos por tramo siguen siendo supuestos ajustables.
      </aside>
    </main>
  )
}
