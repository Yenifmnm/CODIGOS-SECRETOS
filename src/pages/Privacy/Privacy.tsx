import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import purosol from '../../assets/logos/purosol.webp';
import policy from './privacy-policy.txt?raw';
import './privacy.css';

const [title, updated, ...paragraphs] = policy.trim().split(/\r?\n\s*\r?\n/);

export default function Privacy() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Códigos Secretos`;
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="privacy-page">
      <header className="privacy-page__header">
        <Link to="/" aria-label="PuroSol, volver al inicio">
          <img src={purosol} alt="PuroSol" width="140" />
        </Link>
        <Link className="privacy-page__back" to="/registro">Volver al registro</Link>
      </header>
      <main id="contenido" className="privacy-page__paper" aria-labelledby="privacy-title">
        <h1 id="privacy-title">{title}</h1>
        <p className="privacy-page__updated">{updated}</p>
        <div className="privacy-page__body">
          {paragraphs.map((paragraph, index) => {
            if (/^\d+\. /.test(paragraph)) {
              return <h2 key={index}>{paragraph}</h2>;
            }
            if (paragraph.startsWith('* ')) {
              return (
                <ul key={index}>
                  {paragraph.split(/\r?\n/).map((item) => <li key={item}>{item.replace(/^\* /, '')}</li>)}
                </ul>
              );
            }
            if (/^https:\/\/\S+$/.test(paragraph)) {
              return <p key={index}><a href={paragraph}>{paragraph}</a></p>;
            }
            return <p key={index}>{paragraph}</p>;
          })}
        </div>
        <footer className="privacy-page__footer">
          <Link to="/">Volver al inicio</Link>
          <Link to="/registro">Volver al registro</Link>
        </footer>
      </main>
    </div>
  );
}
