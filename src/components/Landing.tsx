import { FlyAvatar } from './FlyAvatar'
import { auditCopy, useTranslation } from '../i18n'

interface LandingProps {
  onBegin: () => void
}

export function Landing({ onBegin }: LandingProps) {
  const { language, t } = useTranslation(); const copy = auditCopy[language]
  return (
    <main className="landing page-shell">
      <header className="wordmark"><span className="status-dot" /> METROFLY / MF-01</header>
      <section className="landing__grid">
        <div className="landing__copy reveal reveal--1">
          <p className="eyebrow">{t('landingEyebrow')}</p>
          <h1>METRO<br />FLY</h1>
          <div className="landing__thesis">
            <p>{t('landingThesis')}</p>
            <p>{t('landingDeadline')}</p>
          </div>
          <p className="landing__aside">{copy.landingAside}</p>
          <button className="button button--primary" type="button" onClick={onBegin}>
            {t('routeSelection')} <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="landing__specimen reveal reveal--2">
          <div className="specimen-frame">
            <span className="specimen-frame__label">D. MELANOGASTER / MACHO / MF-01</span>
            <FlyAvatar large />
          </div>
          <div className="journey-bracket">
            <div><span>17:00</span><strong>{copy.work}</strong></div>
            <div className="journey-bracket__line"><i /></div>
            <div><span>18:00</span><strong>{copy.classAtUtp}</strong></div>
          </div>
        </div>
      </section>
      <footer className="landing__footer"><span>{copy.scenario}</span><span>{copy.narrativeSimulation}</span></footer>
    </main>
  )
}
