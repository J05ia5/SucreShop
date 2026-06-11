import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, ArrowRight, Store } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const { openCheckout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.slice(0, 8));
        setLoadingProducts(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingProducts(false);
      });

    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        setStores(data);
        setLoadingStores(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingStores(false);
      });
  }, []);


  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.3;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Star key={i} size={14} fill="#E8A838" stroke="#E8A838" />);
      } else if (i === full && hasHalf) {
        stars.push(
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: 14, height: 14 }}>
            <Star size={14} stroke="#E0D6C8" fill="none" />
            <span style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Star size={14} fill="#E8A838" stroke="#E8A838" />
            </span>
          </span>
        );
      } else {
        stars.push(<Star key={i} size={14} stroke="#E0D6C8" fill="none" />);
      }
    }
    return stars;
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-split">
          <div className="hero-text-container">
            <h1 className="text-hero hero-title">Auténtico. Local. Premium.</h1>
            <p className="hero-subtitle">
              Descubre las mejores tiendas de Sucre, seleccionadas por su calidad y compromiso.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/explore')}>
              Explorar Colección
            </button>
          </div>
          <div className="hero-image-container">
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800" 
              alt="Premium Product" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding container">
        <div className="section-header">
          <h2 className="text-h2">Destacados</h2>
          <button className="btn btn-outline" onClick={() => navigate('/explore')}>
            Ver todos los productos →
          </button>
        </div>
        
        {loadingProducts ? (
          <div className="loading-state">Cargando catálogo...</div>
        ) : (
          <div className="product-grid">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onBuy={openCheckout} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Stores */}
      <section className="featured-stores-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="text-h2">Tiendas Destacadas</h2>
              <p className="section-subtitle">Comercios verificados y aprobados de la ciudad de Sucre.</p>
            </div>
          </div>

          {loadingStores ? (
            <div className="loading-state">Cargando tiendas...</div>
          ) : (
            <div className="stores-grid">
              {stores.map(store => (
                <Link to={`/store/${store.id}`} className="store-card" key={store.id}>
                  <div className="store-card-header">
                    <div className="store-card-logo">
                      {store.logo_url && !store.logo_url.includes('default') ? (
                        <img src={store.logo_url} alt={store.name} />
                      ) : (
                        <Store size={28} />
                      )}
                    </div>
                    <div className="store-card-verified">
                      <span className="badge badge-natural">Verificada</span>
                    </div>
                  </div>
                  <div className="store-card-body">
                    <h3 className="store-card-name">{store.name}</h3>
                    <div className="store-card-rating">
                      <div className="store-stars">{renderStars(store.rating)}</div>
                      <span className="store-rating-value">{store.rating.toFixed(1)}</span>
                      <span className="store-rating-count">({store.rating_count})</span>
                    </div>
                    <p className="store-card-desc">
                      {store.description && store.description.length > 100 
                        ? store.description.substring(0, 100) + '...' 
                        : store.description}
                    </p>
                  </div>
                  <div className="store-card-footer">
                    {store.address && (
                      <div className="store-card-location">
                        <MapPin size={13} />
                        <span>{store.address.split(',')[0]}</span>
                      </div>
                    )}
                    <div className="store-card-cta">
                      Ver tienda <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Promo Banner */}
      <section className="ai-promo-section">
        <div className="container ai-promo-content">
          <h2 className="text-h2" style={{color: 'white'}}>Encuentra exactamente lo que buscas.</h2>
          <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto var(--spacing-lg) auto'}}>
            Nuestro motor de IA impulsado por Gemini entiende consultas complejas. "Busco algo para correr barato en color rojo".
          </p>
          <button className="btn btn-outline" style={{borderColor: 'white', color: 'white'}} onClick={() => navigate('/explore')}>
            Probar Búsqueda IA
          </button>
        </div>
      </section>
    </div>
  );
}

