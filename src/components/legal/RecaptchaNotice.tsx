import './recaptcha-notice.css';

interface RecaptchaNoticeProps {
  className?: string;
}

export function RecaptchaNotice({ className = '' }: RecaptchaNoticeProps) {
  return (
    <p className={`recaptcha-notice ${className}`.trim()}>
      Este sitio está protegido por reCAPTCHA y se aplican la{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
        Política de Privacidad
      </a>{' '}
      y los{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
        Términos de Servicio
      </a>{' '}
      de Google.
    </p>
  );
}

