import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, cart, openCart } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Simply<span className="trademark">®</span> SucreShop
        </Link>
        
        <nav className="navbar-links">
          <Link to="/" className="nav-item">Inicio</Link>
          <Link to="/explore" className="nav-item">Explorar Catálogo</Link>
          <Link to="/about" className="nav-item">Sobre Nosotros</Link>
        </nav>
        
        <div className="navbar-actions">
          <Link to="/explore" className="action-btn">
            <Search size={20} />
          </Link>
          <button className="action-btn navbar-cart-btn" onClick={openCart} title="Carrito de Compras">
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="navbar-cart-badge">{cart.length}</span>
            )}
          </button>
          
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="action-btn">
                <User size={20} />
              </Link>
              <button className="action-btn" onClick={handleLogout} title="Cerrar Sesión">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="action-btn">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
