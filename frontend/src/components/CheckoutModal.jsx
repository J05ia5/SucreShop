import React, { useState, useContext } from 'react';
import { CreditCard, Smartphone, CheckCircle, X, Star } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './CheckoutModal.css';

export default function CheckoutModal({ product, isOpen, onClose }) {
  const { addToCart } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Confirm payment, 2: Key & Rate
  const [loading, setLoading] = useState(false);
  const [productKey, setProductKey] = useState('');
  const [productRating, setProductRating] = useState(0);
  const [storeRating, setStoreRating] = useState(0);
  const [productRatingHover, setProductRatingHover] = useState(0);
  const [storeRatingHover, setStoreRatingHover] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handlePayment = async (method) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.requestProduct(product.id, method);
      setProductKey(result.product_key);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error al procesar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRatings = async () => {
    if (productRating === 0 && storeRating === 0) {
      alert('Por favor selecciona al menos una estrella para calificar.');
      return;
    }
    setLoading(true);
    try {
      const promises = [];
      if (productRating > 0) {
        promises.push(api.rateProduct(product.id, productRating));
      }
      if (storeRating > 0 && product.store_id) {
        promises.push(api.rateStore(product.store_id, storeRating));
      }
      await Promise.all(promises);
      setRatingSubmitted(true);
      alert('¡Gracias por tus calificaciones! Tu opinión es valiosa.');
      onClose();
    } catch (err) {
      alert('Error al enviar calificaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, setRating, hoverRating, setHoverRating) => {
    return (
      <div className="star-rating-input">
        {[1, 2, 3, 4, 5].map((val) => (
          <span
            key={val}
            className={`star-char ${(hoverRating || rating) >= val ? 'filled' : ''}`}
            onClick={() => setRating(val)}
            onMouseEnter={() => setHoverRating(val)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal-box">
        <div className="checkout-modal-header">
          <h3>Reservar Producto</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="checkout-error">{error}</div>}

        <div className="checkout-product-details">
          <img
            src={product.image_url || '/uploads/default_product.png'}
            alt={product.name}
            className="checkout-prod-img"
          />
          <div className="checkout-prod-info">
            <h4>{product.name}</h4>
            <p className="checkout-prod-store">{product.store_name || 'Tienda Oficial'}</p>
            <p className="checkout-prod-price">${product.price.toFixed(2)}</p>
          </div>
        </div>

        {step === 1 && (
          <div className="checkout-step-confirm">
            <p className="checkout-instructions">Selecciona tu método de pago para confirmar la reserva:</p>
            
            <div className="payment-methods-grid">
              <button
                className="payment-method-btn"
                onClick={() => handlePayment('card')}
                disabled={loading}
              >
                <CreditCard size={32} className="card-icon" />
                <span className="method-title">Pagar con Tarjeta</span>
                <span className="method-subtitle">Débito / Crédito</span>
              </button>

              <button
                className="payment-method-btn"
                onClick={() => handlePayment('qr')}
                disabled={loading}
              >
                <Smartphone size={32} className="qr-icon" />
                <span className="method-title">Pagar con QR</span>
                <span className="method-subtitle">Pago Móvil / Banco</span>
              </button>
            </div>

            <div className="checkout-actions" style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => { addToCart(product); onClose(); }} 
                disabled={loading}
              >
                Añadir al Carrito
              </button>
              <button className="btn btn-primary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-step-success">
            <div className="success-icon-wrapper">
              <CheckCircle size={48} className="success-icon" />
            </div>
            <h4>¡Reserva Exitosa!</h4>
            <p className="success-instructions">
              Tu solicitud fue registrada. Guarda esta clave para recoger tu producto en la tienda:
            </p>

            <div className="checkout-product-key-box">
              <p className="key-label">Clave de Producto</p>
              <p className="key-value">{productKey}</p>
              <p className="key-subtext">Presenta esta clave al vendedor para verificar tu compra.</p>
            </div>

            <div className="next-steps-info">
              <p>
                <strong>¿Qué sigue?</strong> El vendedor recibirá tu solicitud en su panel y descontará el stock al entregártelo.
              </p>
            </div>

            {!ratingSubmitted && (
              <div className="checkout-rating-section">
                <h4>Calificar Experiencia</h4>
                
                <div className="rating-group">
                  <label>Califica el Producto:</label>
                  {renderStars(productRating, setProductRating, productRatingHover, setProductRatingHover)}
                </div>

                <div className="rating-group">
                  <label>Califica el Comercio:</label>
                  {renderStars(storeRating, setStoreRating, storeRatingHover, setStoreRatingHover)}
                </div>

                <div className="checkout-rating-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitRatings}
                    disabled={loading || (productRating === 0 && storeRating === 0)}
                  >
                    {loading ? 'Enviando...' : 'Enviar Calificaciones'}
                  </button>
                  <button className="btn btn-outline" onClick={onClose}>
                    Terminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
