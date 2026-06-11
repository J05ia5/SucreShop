/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storeId = localStorage.getItem('storeId');
    const fullName = localStorage.getItem('fullName');
    const email = localStorage.getItem('email');
    
    if (token && role) {
      return { token, role, storeId, fullName, email };
    }
    return null;
  });
  
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error('Error parsing cart from localStorage', e);
      }
    }
    return [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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
    localStorage.removeItem('cart'); // Clear cart on logout
    setUser(null);
    setCart([]);
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

  const addToCart = (product) => {
    if (!user) {
      alert('Debes iniciar sesión para poder usar el carrito de compras.');
      window.location.href = '/login';
      return;
    }
    setCart((prevCart) => {
      const exists = prevCart.some((item) => item.id === product.id);
      if (exists) {
        alert('Este producto ya se encuentra en tu carrito de compras.');
        return prevCart;
      }
      alert('¡Producto agregado al carrito exitosamente!');
      return [...prevCart, product];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => {
    if (!user) {
      alert('Debes iniciar sesión para ver tu carrito.');
      window.location.href = '/login';
      return;
    }
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading: false, 
      checkoutProduct, 
      openCheckout, 
      closeCheckout,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      isCartOpen,
      openCart,
      closeCart
    }}>
      {children}
    </AuthContext.Provider>
  );
}
