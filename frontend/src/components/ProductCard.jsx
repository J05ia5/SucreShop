import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onBuy }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleBuyClick = (e) => {
    e.stopPropagation();
    if (onBuy && product.stock > 0) {
      onBuy(product);
    }
  };

  return (
    <div 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {product.stock > 0 ? (
          <span className="badge badge-natural product-badge">En Stock</span>
        ) : (
          <span className="badge badge-outline product-badge" style={{backgroundColor: '#888888', color: 'white'}}>Agotado</span>
        )}
        <img 
          src={product.image_url} 
          alt={product.name} 
          className={`product-image ${isHovered ? 'hovered' : ''}`}
        />
      </div>
      <div className="product-info">
        <h4 className="product-title">{product.name}</h4>
        <p className="product-store">{product.store_name}</p>
        <div className="product-bottom">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.stock > 0 ? (
            <button 
              className={`btn-add-cart ${isHovered ? 'visible' : ''}`}
              onClick={handleBuyClick}
            >
              Reservar
            </button>
          ) : (
            <button 
              className="btn-add-cart disabled" 
              disabled
              style={{ backgroundColor: '#888888', cursor: 'not-allowed' }}
            >
              Agotado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
