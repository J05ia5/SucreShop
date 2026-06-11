import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storeId = localStorage.getItem('storeId');
    const fullName = localStorage.getItem('fullName');
    const email = localStorage.getItem('email');
    
    if (token && role) {
      setUser({ token, role, storeId, fullName, email });
    }
    setLoading(false);
  }, []);

  const login = (token, role, storeId, fullName, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (storeId) localStorage.setItem('storeId', storeId);
    if (fullName) localStorage.setItem('fullName', fullName);
    if (email) localStorage.setItem('email', email);
    
    setUser({ token, role, storeId, fullName, email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('storeId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
    setUser(null);
  };

  const openCheckout = (product) => {
    if (!user) {
      alert('Debes iniciar sesión para poder reservar un producto.');
      window.location.href = '/login';
      return;
    }
    setCheckoutProduct(product);
  };

  const closeCheckout = () => {
    setCheckoutProduct(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      checkoutProduct, 
      openCheckout, 
      closeCheckout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
