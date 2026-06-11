import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    store_name: '',
    store_description: ''
  });
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // FastAPI espera form data para este endpoint
    const formPayload = new URLSearchParams();
    formPayload.append('email', formData.email);
    formPayload.append('password', formData.password);
    formPayload.append('full_name', formData.full_name);
    formPayload.append('is_store_owner', isStoreOwner ? 'true' : 'false');
    
    if (isStoreOwner) {
      formPayload.append('store_name', formData.store_name);
    }
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formPayload
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Extract string from FastAPI validation errors
        let errMsg = 'Error en el registro';
        if (typeof errorData.detail === 'string') {
          errMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errMsg = errorData.detail.map(d => d.msg).join(', ');
        }
        throw new Error(errMsg);
      }

      if (isStoreOwner) {
        alert('Registro exitoso. Tu cuenta de tienda está pendiente de aprobación por el administrador.');
      } else {
        alert('Registro exitoso. ¡Bienvenido a SucreShop!');
      }
      navigate('/login');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-form-container" style={{order: 1}}>
          <div className="auth-form-wrapper">
            <h1 className="text-h2">Únete a SucreShop.</h1>
            <p className="auth-subtitle">
              {isStoreOwner 
                ? "Crea tu tienda y llega a miles de clientes locales." 
                : "Descubre los mejores productos locales con inteligencia artificial."}
            </p>
            
            {/* Toggle Tipo de Usuario */}
            <div className="auth-tabs" style={{display: 'flex', marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--border-default)'}}>
              <button 
                type="button"
                className={`tab-btn ${!isStoreOwner ? 'active' : ''}`}
                onClick={() => setIsStoreOwner(false)}
                style={{flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: !isStoreOwner ? '2px solid var(--bg-dark)' : '2px solid transparent', fontWeight: !isStoreOwner ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s ease'}}
              >
                Soy Comprador
              </button>
              <button 
                type="button"
                className={`tab-btn ${isStoreOwner ? 'active' : ''}`}
                onClick={() => setIsStoreOwner(true)}
                style={{flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: isStoreOwner ? '2px solid var(--bg-dark)' : '2px solid transparent', fontWeight: isStoreOwner ? '600' : '400', cursor: 'pointer', transition: 'all 0.2s ease'}}
              >
                Soy Comercio
              </button>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" name="full_name" required onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" name="email" required onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" name="password" required onChange={handleChange} />
              </div>
              
              {isStoreOwner && (
                <>
                  <div className="form-group">
                    <label>Nombre de la Tienda</label>
                    <input type="text" name="store_name" required={isStoreOwner} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Descripción de la Tienda</label>
                    <textarea name="store_description" required={isStoreOwner} rows="3" onChange={handleChange}></textarea>
                  </div>
                </>
              )}
              
              <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 'var(--spacing-md)'}}>
                {isStoreOwner ? "Registrar Tienda" : "Crear Cuenta"}
              </button>
            </form>
            
            <p className="auth-footer">
              ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>.
            </p>
          </div>
        </div>
        <div className="auth-image-container" style={{order: 2}}>
          <img 
            src="/sucre_city_register.png" 
            alt="Join SucreShop" 
            className="auth-image"
          />
        </div>
      </div>
    </div>
  );
}
