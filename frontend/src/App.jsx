import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Search from './pages/Search';
import StoreProfile from './pages/StoreProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import StoreDashboard from './pages/StoreDashboard';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import CheckoutModal from './components/CheckoutModal';

function AppContent() {
  const { checkoutProduct, closeCheckout } = useContext(AuthContext);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Search />} />
            <Route path="/store/:id" element={<StoreProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<StoreDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
        <CheckoutModal 
          product={checkoutProduct} 
          isOpen={!!checkoutProduct} 
          onClose={closeCheckout} 
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
