import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h4 className="footer-title">Simply® SucreShop</h4>
          <p className="footer-text">Calidad premium y diseño minimalista en el corazón de Sucre.</p>
        </div>
        <div className="footer-col">
          <h4 className="footer-title">Explorar</h4>
          <ul className="footer-list">
            <li><a href="#">Catálogo</a></li>
            <li><a href="#">Tiendas Oficiales</a></li>
            <li><a href="#">Ofertas</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-title">Información</h4>
          <ul className="footer-list">
            <li><a href="#">Sobre Nosotros</a></li>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Términos y Condiciones</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-title">Redes Sociales</h4>
          <ul className="footer-list">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Twitter</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Simply® SucreShop. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
