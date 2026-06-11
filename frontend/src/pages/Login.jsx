import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const formData = new URLSearchParams();
    formData.append('email', username); // FastAPI espera el campo 'email'
    formData.append('password', password);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await res.json();
      const user = data.user;
      const role = user.is_admin ? 'admin' : user.is_store_owner ? 'store' : 'buyer';
      const storeId = user.store_id;
      login(data.access_token, role, storeId, user.full_name, user.email);
      
      if (role === 'admin') navigate('/admin');
      else if (role === 'store') navigate('/dashboard');
      else navigate('/');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-image-container">
          <img 
            src="/sucre_city_login.png" 
            alt="SucreShop Premium" 
            className="auth-image"
          />
        </div>
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <h1 className="text-h2">Bienvenido de nuevo.</h1>
            <p className="auth-subtitle">Ingresa a tu panel de control de Simply® SucreShop.</p>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label>Usuario / Email</label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 'var(--spacing-md)'}}>
                Iniciar Sesión
              </button>
            </form>
            
            <p className="auth-footer">
              ¿No tienes una cuenta de tienda? <Link to="/register">Regístrate aquí</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
