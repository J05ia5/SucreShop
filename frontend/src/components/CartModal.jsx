import { useState, useContext } from 'react';
import { CreditCard, Smartphone, CheckCircle, X, Trash2, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './CartModal.css';

export default function CartModal() {
  const { cart, removeFromCart, clearCart, isCartOpen, closeCart } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Cart listing & payment choice, 2: Success keys
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservationResults, setReservationResults] = useState([]);

  const handleClose = () => {
    if (step === 2) {
      handleFinish();
    } else {
      closeCart();
    }
  };

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handlePayment = async (method) => {
    setLoading(true);
    setError('');
    try {
      const promises = cart.map(product => 
        api.requestProduct(product.id, method)
          .then(res => ({
            id: product.id,
            name: product.name,
            storeName: product.store_name || 'Tienda Oficial',
            image_url: product.image_url,
            key: res.product_key,
            success: true
          }))
          .catch(err => ({
            id: product.id,
            name: product.name,
            storeName: product.store_name || 'Tienda Oficial',
            image_url: product.image_url,
            error: err.message || 'Error al reservar',
            success: false
          }))
      );
      
      const results = await Promise.all(promises);
      setReservationResults(results);
      setStep(2);
    } catch {
      setError('Error al procesar las reservas. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    // Clear only successful items from cart
    const failedIds = reservationResults
      .filter(r => !r.success)
      .map(r => r.id);
      
    if (failedIds.length === 0) {
      clearCart();
    } else {
      // Remove successful ones and keep failed ones in cart
      cart.forEach(item => {
        if (!failedIds.includes(item.id)) {
          removeFromCart(item.id);
        }
      });
    }
    
    setStep(1);
    setReservationResults([]);
    closeCart();
  };

  return (
    <div className="modal-overlay">
      <div className="cart-modal-box">
        <div className="cart-modal-header">
          <h3>Carrito de Reservas</h3>
          <button className="btn-close-modal" onClick={handleClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="checkout-error">{error}</div>}

        {step === 1 && (
          <div className="cart-step-list">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <p>Tu carrito está vacío.</p>
                <p className="cart-empty-subtext">Explora el catálogo y añade productos para reservarlos juntos.</p>
                <button className="btn btn-primary" onClick={closeCart}>
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div className="cart-item-row" key={item.id}>
                      <img
                        src={item.image_url || '/uploads/default_product.png'}
                        alt={item.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p className="cart-item-store">{item.store_name || 'Tienda Oficial'}</p>
                        <p className="cart-item-price">${item.price.toFixed(2)}</p>
                      </div>
                      <button 
                        className="btn-remove-item"
                        onClick={() => removeFromCart(item.id)}
                        title="Eliminar del carrito"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary-section">
                  <div className="cart-total-row">
                    <span>Total a Reservar:</span>
                    <span className="cart-total-price">${total.toFixed(2)}</span>
                  </div>
                  
                  <p className="cart-instructions">
                    Selecciona tu método de pago para confirmar las reservas de todos los productos en el carrito:
                  </p>

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
                </div>

                <div className="cart-actions">
                  <button className="btn btn-outline" onClick={closeCart} disabled={loading}>
                    Seguir Comprando
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="cart-step-success">
            <div className="success-icon-wrapper">
              <CheckCircle size={48} className="success-icon" />
            </div>
            <h4>¡Procesamiento Completado!</h4>
            <p className="success-instructions">
              Revisa a continuación el resultado de tus solicitudes de reserva:
            </p>

            <div className="cart-results-list">
              {reservationResults.map((res, index) => (
                <div key={index} className={`cart-result-item ${res.success ? 'success' : 'failed'}`}>
                  <img
                    src={res.image_url || '/uploads/default_product.png'}
                    alt={res.name}
                    className="result-item-img"
                  />
                  <div className="result-item-info">
                    <h5>{res.name}</h5>
                    <p className="result-item-store">{res.storeName}</p>
                    {res.success ? (
                      <div className="result-key-box">
                        <span className="result-key-label">Clave de Recogida:</span>
                        <span className="result-key-value">{res.key}</span>
                      </div>
                    ) : (
                      <div className="result-error-box">
                        <AlertTriangle size={14} />
                        <span>{res.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="next-steps-info" style={{ marginTop: 'var(--spacing-lg)' }}>
              <p>
                <strong>¿Qué sigue?</strong> Presenta estas claves en las tiendas locales correspondientes para pagar y retirar tus productos. Las tiendas asociadas ya han sido notificadas de tu reserva.
              </p>
            </div>

            <div className="cart-success-actions">
              <button className="btn btn-primary" onClick={handleFinish}>
                Terminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
