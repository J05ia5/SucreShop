import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../context/AuthContext';

export default function StoreProfile() {
  const { id } = useParams();
  const { openCheckout } = useContext(AuthContext);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch store info
    fetch(`/api/stores/${id}`)
      .then(res => res.json())
      .then(data => {
        setStore(data);
        // Fetch store products
        return fetch(`/api/stores/${id}/products`);
      })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="container section-padding">Cargando tienda...</div>;
  if (!store) return <div className="container section-padding">Tienda no encontrada.</div>;

  return (
    <div className="store-profile-page">
      <div className="store-header" style={{backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-3xl) 0', borderBottom: '1px solid var(--border-default)'}}>
        <div className="container" style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)'}}>
          <img 
            src={store.logo_url} 
            alt={store.name} 
            style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)'}}
          />
          <div>
            <h1 className="text-h2" style={{marginBottom: 'var(--spacing-xs)'}}>{store.name}</h1>
            <p style={{color: 'var(--text-secondary)', maxWidth: '600px'}}>{store.description}</p>
          </div>
        </div>
      </div>
      
      <div className="container section-padding">
        <h2 className="text-h2" style={{marginBottom: 'var(--spacing-xl)'}}>Catálogo Oficial</h2>
        <div className="product-grid">
          {products.map(p => (
            <ProductCard key={p.id} product={p} onBuy={openCheckout} />
          ))}
        </div>
      </div>
    </div>
  );
}
