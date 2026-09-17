import "../styles/layout/footer.css";

const Footer = () => {
  return (
    <footer className="footer-bar">
      <p className="footer-brand">
        <span className="footer-dot"></span>
        <strong>EEST Flow</strong> — Sistema de Administración para Escuelas de Educación
        Secundaria Técnica
      </p>

      <nav className="footer-links">
        <a href="#reglamento">Reglamento Técnico</a>
        <a href="#soporte">Soporte TIC</a>
        <span className="footer-version">Versión 2.4</span>
      </nav>    
    </footer>
  );
};

export default Footer;