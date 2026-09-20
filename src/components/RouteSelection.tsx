import { ROUTES } from '../data/routes'
import type { TransitRoute } from '../types/transit'
import { routePresentation, useTranslation } from '../i18n'

interface RouteSelectionProps {
  seed: number
  onSeedChange: (seed: number) => void
  onSelect: (route: TransitRoute) => void
  onBack: () => void
}

export function RouteSelection({ seed, onSeedChange, onSelect, onBack }: RouteSelectionProps) {
  const { language, t } = useTranslation()
  const uncertaintyLabel = {
    moderate: t('uncertaintyModerate'),
    high: t('uncertaintyHigh'),
    unknown: t('uncertaintyUnknown'),
  }
  return (
    <main className="page-shell route-select">
      <header className="topbar">
        <button className="text-button" type="button" onClick={onBack}>← METROFLY</button>
        <span>01 / {t('routeSelection')}</span>
      </header>
      <section className="route-select__intro reveal reveal--1">
        <p className="eyebrow">{t('routeEyebrow')}</p>
        <h1>{t('routeHeading')}</h1>
        <p>{t('routeIntro')}</p>
        <label className="seed-control">
          <span>{t('routeSeed')}</span>
          <input type="number" value={seed} onChange={(event) => onSeedChange(Number(event.target.value) || 1)} />
        </label>
      </section>
      <section className="route-list" aria-label={t('availableRoutes')}>
        {ROUTES.map((route, index) => (
          <article className="route-row reveal" style={{ '--delay': `${index * 90 + 160}ms` } as React.CSSProperties} key={route.id}>
            <div className="route-row__index">0{index + 1}</div>
            <div className="route-row__main">
              <span className="route-row__code" style={{ color: route.accent }}>{route.shortCode}</span>
              <h2>{route.name}</h2>
              <p>{routePresentation[language][route.presentationKey].description}</p>
              <div className="route-row__notes">
                {routePresentation[language][route.presentationKey].notes.map((note) => <span key={note}>{note}</span>)}
              </div>
            </div>
            <div className="route-row__meta">
              <div><span>{t('routeReference')}</span><strong>{route.referenceDurationMinutes ? t('routeReferenceDuration', { minutes: route.referenceDurationMinutes }) : t('noData')}</strong></div>
              <div><span>{t('routeUncertainty')}</span><strong>{uncertaintyLabel[route.uncertainty]}</strong></div>
              <div><span>{t('routeConnections')}</span><strong>{route.id === 'pirata' ? '1–2' : route.transfers}</strong></div>
            </div>
            <button className="button button--route" type="button" onClick={() => onSelect(route)}>
              {t('simulateRoute')} <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </section>
      <aside className="route-select__disclaimer">
        {t('routeDisclaimer')}
      </aside>
    </main>
  )
}
