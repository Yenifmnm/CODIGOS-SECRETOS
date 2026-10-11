import { LogoCodigos } from '../../components/promo/LogoCodigos';
import purosol from '../../assets/logos/purosol.webp';
import './coming-back.css';

export default function ComingBack() {
  return (
    <main id="contenido" className="coming-back" aria-labelledby="coming-back-title">
      <img className="coming-back__brand" src={purosol} alt="PuroSol" />
      <div className="coming-back__content">
        <LogoCodigos className="coming-back__logo" resplandor="horneado" />
        <h1 id="coming-back-title" className="coming-back__title">
          En breve<br />estamos de vuelta
        </h1>
      </div>
    </main>
  );
}
