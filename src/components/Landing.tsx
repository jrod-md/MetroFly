import { FlyAvatar } from './FlyAvatar'

interface LandingProps {
  onBegin: () => void
}

export function Landing({ onBegin }: LandingProps) {
  return (
    <main className="landing page-shell">
      <header className="wordmark"><span className="status-dot" /> METROFLY / MF-01</header>
      <section className="landing__grid">
        <div className="landing__copy reveal reveal--1">
          <p className="eyebrow">Un viaje de todos los días · Ciudad de Panamá</p>
          <h1>METRO<br />FLY</h1>
          <div className="landing__thesis">
            <p>Puse una mosca a hacer mi viaje a la UTP.</p>
            <p>Tiene una hora para llegar a clase.</p>
          </div>
          <p className="landing__aside">Sale del trabajo en Costa del Este a las 17:00. La clase empieza a las 18:00. Tú eliges la ruta; Panamá decide el resto.</p>
          <button className="button button--primary" type="button" onClick={onBegin}>
            Elegir el recorrido <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="landing__specimen reveal reveal--2">
          <div className="specimen-frame">
            <span className="specimen-frame__label">D. MELANOGASTER / MACHO / MF-01</span>
            <FlyAvatar large />
          </div>
          <div className="journey-bracket">
            <div><span>17:00</span><strong>Trabajo en Costa del Este</strong></div>
            <div className="journey-bracket__line"><i /></div>
            <div><span>18:00</span><strong>UTP / empieza la clase</strong></div>
          </div>
        </div>
      </section>
      <footer className="landing__footer"><span>ESCENARIO: LA CLASE DE LAS 6</span><span>SIMULACIÓN NARRATIVA</span></footer>
    </main>
  )
}
