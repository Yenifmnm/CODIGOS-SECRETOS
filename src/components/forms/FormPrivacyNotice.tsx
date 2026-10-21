import { Link } from 'react-router-dom';
import './form-privacy-notice.css';

export function FormPrivacyNotice() {
  return (
    <div className="form-privacy-notice">
      <p>
        <span>Este formulario está protegido por Cloudflare Turnstile.</span>
        <span>
          Consultá nuestra{' '}
          <Link to="/privacidad" target="_blank" rel="noopener noreferrer">
            Política de Privacidad
          </Link>.
        </span>
      </p>
    </div>
  );
}
