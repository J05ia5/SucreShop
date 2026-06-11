import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, ClipboardList, Settings, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

export default function StoreDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalog');

  // Store data states
  const [myStore, setMyStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerRequests, setBuyerRequests] = useState([]);

  // Product modal / editor state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding a new product
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Tecnología',
    price: '',
    stock: '',
    brand: '',
    color: '',
    size: '',
    description: '',
    image_url_fallback: '',
    specs_json: ''
  });
  const [productImage, setProductImage] = useState(null);
  const [productModalError, setProductModalError] = useState('');

  // Store profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    website_url: '',
    instagram_url: '',
    facebook_url: '',
    twitter_url: ''
  });
  const [profileLogo, setProfileLogo] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'store' && user.role !== 'buyer')) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'store') {
        const storeData = await api.getMyStoreProfile();
        setMyStore(storeData);
        
        // Load products
        const productsData = await api.getStoreProducts(storeData.id);
        setProducts(productsData);

        // Load requests
        const requestsData = await api.getStoreRequests();
        setRequests(requestsData);

        // Populate profile form
        setProfileForm({
          name: storeData.name || '',
          description: storeData.description || '',
          address: storeData.address || '',
          phone: storeData.phone || '',
          website_url: storeData.website_url || '',
          instagram_url: storeData.instagram_url || '',
          facebook_url: storeData.facebook_url || '',
          twitter_url: storeData.twitter_url || ''
        });
      } else if (user.role === 'buyer') {
        const buyerRequestsData = await api.getMyRequests();
        setBuyerRequests(buyerRequestsData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductModal = (product = null) => {
    setProductModalError('');
    setProductImage(null);
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        category: product.category || 'Tecnología',
        price: product.price || '',
        stock: product.stock || '0',
        brand: product.brand || '',
        color: product.color || '',
        size: product.size || '',
        description: product.description || '',
        image_url_fallback: product.image_url || '',
        specs_json: product.specs ? JSON.stringify(product.specs) : ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'Tecnología',
        price: '',
        stock: '0',
        brand: '',
        color: '',
        size: '',
        description: '',
        image_url_fallback: '',
        specs_json: ''
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductModalError('');

    const formData = new FormData();
    formData.append('name', productForm.name.trim());
    formData.append('category', productForm.category);
    formData.append('price', parseFloat(productForm.price));
    formData.append('stock', parseInt(productForm.stock));
    formData.append('brand', productForm.brand.trim());
    formData.append('color', productForm.color.trim());
    formData.append('size', productForm.size.trim());
    formData.append('description', productForm.description.trim());
    formData.append('image_url_fallback', productForm.image_url_fallback.trim());

    if (productForm.specs_json.trim()) {
      try {
        JSON.parse(productForm.specs_json);
        formData.append('specs_json', productForm.specs_json.trim());
      } catch (err) {
        setProductModalError('El formato de Especificaciones JSON no es válido.');
        return;
      }
    }

    if (productImage) {
      formData.append('image', productImage);
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        alert('Producto actualizado con éxito.');
      } else {
        await api.createProduct(formData);
        alert('Producto creado con éxito.');
      }
      setIsProductModalOpen(false);
      // Reload products
      const pData = await api.getStoreProducts(myStore.id);
      setProducts(pData);
    } catch (err) {
      setProductModalError(err.message || 'Error al guardar producto.');
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción es irreversible.')) {
      return;
    }
    try {
      await api.deleteProduct(prodId);
      alert('Producto eliminado correctamente.');
      // Reload products
      const pData = await api.getStoreProducts(myStore.id);
      setProducts(pData);
    } catch (err) {
      alert('Error al eliminar producto: ' + err.message);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const formData = new FormData();
    formData.append('name', profileForm.name.trim());
    formData.append('description', profileForm.description.trim());
    formData.append('address', profileForm.address.trim());
    formData.append('phone', profileForm.phone.trim());
    formData.append('website_url', profileForm.website_url.trim());
    formData.append('instagram_url', profileForm.instagram_url.trim());
    formData.append('facebook_url', profileForm.facebook_url.trim());
    formData.append('twitter_url', profileForm.twitter_url.trim());

    if (profileLogo) {
      formData.append('logo', profileLogo);
    }

    try {
      const updatedStore = await api.updateMyStoreProfile(formData);
      setMyStore(updatedStore);
      setProfileSuccess('Perfil de la tienda oficial actualizado con éxito.');
    } catch (err) {
      setProfileError(err.message || 'Error al actualizar el perfil.');
    }
  };

  // Requests action handlers
  const handleConfirmRequest = async (reqId) => {
    if (!window.confirm('¿Confirmar esta reserva? Se reducirá el stock del producto automáticamente.')) return;
    try {
      await api.confirmRequest(reqId);
      alert('Reserva confirmada. Stock actualizado.');
      const rData = await api.getStoreRequests();
      setRequests(rData);
      
      // Reload products to update stock in catalog
      if (myStore) {
        const pData = await api.getStoreProducts(myStore.id);
        setProducts(pData);
      }
    } catch (err) {
      alert('Error al confirmar: ' + err.message);
    }
  };

  const handleDeliverRequest = async (reqId) => {
    if (!window.confirm('¿Marcar este producto como entregado al comprador?')) return;
    try {
      await api.deliverRequest(reqId);
      alert('Producto marcado como entregado.');
      const rData = await api.getStoreRequests();
      setRequests(rData);
      
      // Reload products to update stock in catalog
      if (myStore) {
        const pData = await api.getStoreProducts(myStore.id);
        setProducts(pData);
      }
    } catch (err) {
      alert('Error al marcar entrega: ' + err.message);
    }
  };

  const handleRejectRequest = async (reqId) => {
    if (!window.confirm('¿Rechazar esta solicitud de reserva?')) return;
    try {
      await api.rejectRequest(reqId);
      alert('Solicitud rechazada.');
      const rData = await api.getStoreRequests();
      setRequests(rData);
      
      // Reload products to update stock in catalog
      if (myStore) {
        const pData = await api.getStoreProducts(myStore.id);
        setProducts(pData);
      }
    } catch (err) {
      alert('Error al rechazar: ' + err.message);
    }
  };

  if (!user) return null;
  if (loading) return <div className="container section-padding">Cargando panel de control...</div>;

  if (user.role === 'buyer') {
    return (
      <div className="dashboard-page container section-padding">
        <div className="dashboard-header-block">
          <div className="dash-store-badge-card">
            <div className="buyer-avatar-placeholder">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-h2" style={{ marginBottom: 4 }}>Mi Panel de Usuario</h1>
              <p className="text-muted">Cliente: {user.fullName} | Email: {user.email}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Mis Reservas Realizadas</h3>
          <p className="text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Presenta las claves de recogida en las tiendas locales correspondientes para retirar y pagar tus productos.
          </p>

          <div className="requests-cards-list">
            {buyerRequests.length === 0 ? (
              <div className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                No tienes ninguna reserva registrada en tu historial.
              </div>
            ) : (
              buyerRequests.map(req => (
                <div className="request-card-item" key={req.id}>
                  <div className="request-card-img-details">
                    <img 
                      src={req.product_image || '/uploads/default_product.png'} 
                      alt={req.product_name}
                      className="request-prod-img"
                    />
                    <div>
                      <h4>{req.product_name}</h4>
                      <p className="req-price">${req.product_price ? req.product_price.toFixed(2) : '0.00'}</p>
                      <p className="req-store-info">
                        Comercio: <strong>{req.store_name}</strong> {req.store_phone && `(Teléfono: ${req.store_phone})`}
                      </p>
                    </div>
                  </div>

                  <div className="request-card-status-info">
                    <div className="req-key-container">
                      <span className="key-title">Clave de Recogida</span>
                      <span className="key-code" style={{ letterSpacing: '1px', fontFamily: 'monospace' }}>
                        {req.product_key}
                      </span>
                    </div>

                    <div className="req-status-badge">
                      <span className={`badge badge-state-${req.status}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page container section-padding">
      <div className="dashboard-header-block">
        <div className="dash-store-badge-card">
          <img 
            src={myStore?.logo_url || '/uploads/default_logo.png'} 
            alt="Logo" 
            className="dash-store-logo-img"
          />
          <div>
            <h1 className="text-h2" style={{ marginBottom: 4 }}>{myStore?.name}</h1>
            <p className="text-muted">Propietario: {user.fullName} | Tienda ID: {myStore?.id}</p>
          </div>
        </div>

        {myStore?.status !== 'approved' && (
          <div className={`store-status-banner-card status-${myStore?.status}`}>
            <AlertCircle size={20} />
            <div>
              <strong>Estado de la Tienda: {myStore?.status === 'pending' ? 'Pendiente de Aprobación' : 'Rechazada'}</strong>
              <p>{myStore?.status_reason || 'Tu tienda está siendo revisada por un administrador.'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <button 
            className={`sidebar-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <ShoppingBag size={18} />
            <span>Catálogo de Productos</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <ClipboardList size={18} />
            <span>Solicitudes / Pedidos</span>
          </button>
          <button 
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings size={18} />
            <span>Perfil de la Tienda</span>
          </button>
        </aside>

        <main className="dashboard-content">
          {/* CATALOG TAB */}
          {activeTab === 'catalog' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Gestionar Catálogo</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleOpenProductModal()}
                  disabled={myStore?.status !== 'approved'}
                >
                  <Plus size={16} /> Añadir Producto
                </button>
              </div>
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Atributos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                          No tienes productos en tu catálogo. ¡Añade uno nuevo!
                        </td>
                      </tr>
                    ) : (
                      products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img 
                              src={p.image_url || '/uploads/default_product.png'} 
                              alt={p.name} 
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.category}</td>
                          <td>${p.price.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${p.stock > 0 ? 'badge-natural' : 'badge-outline'}`} style={p.stock === 0 ? {backgroundColor: '#e11d48', color: 'white'} : {}}>
                              {p.stock} u.
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.brand && `Marca: ${p.brand}`} {p.color && `| Color: ${p.color}`} {p.size && `| Talla: ${p.size}`}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="action-icon-btn" 
                                onClick={() => handleOpenProductModal(p)}
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="action-icon-btn btn-danger-action" 
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Solicitudes de Reserva</h3>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={loadDashboardData}
                  disabled={loading}
                >
                  Refrescar
                </button>
              </div>
              <p className="text-muted" style={{ marginBottom: 'var(--spacing-lg)', marginTop: '-10px' }}>
                Monitorea y confirma las solicitudes de recogida de tus clientes locales.
              </p>
              
              <div className="requests-cards-list">
                {requests.length === 0 ? (
                  <div className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                    No hay solicitudes pendientes en tu bandeja.
                  </div>
                ) : (
                  requests.map(req => (
                    <div className="request-card-item" key={req.id}>
                      <div className="request-card-img-details">
                        <img 
                          src={req.product_image || '/uploads/default_product.png'} 
                          alt={req.product_name}
                          className="request-prod-img"
                        />
                        <div>
                          <h4>{req.product_name}</h4>
                          <p className="req-price">${req.product_price ? req.product_price.toFixed(2) : '0.00'}</p>
                          <p className="req-buyer">
                            Comprador: <strong>{req.buyer_name}</strong> ({req.buyer_email})
                          </p>
                        </div>
                      </div>

                      <div className="request-card-status-info">
                        <div className="req-key-container">
                          <span className="key-title">Clave de Recogida</span>
                          <span className="key-code">{req.product_key}</span>
                        </div>

                        <div className="req-status-badge">
                          <span className={`badge badge-state-${req.status}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="req-actions">
                          {req.status === 'solicitado' && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleConfirmRequest(req.id)}
                              >
                                Confirmar Venta
                              </button>
                              <button 
                                className="btn btn-outline btn-sm btn-danger-text"
                                onClick={() => handleRejectRequest(req.id)}
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {req.status === 'comprado' && (
                            <button 
                              className="btn btn-primary btn-sm btn-success-bg"
                              onClick={() => handleDeliverRequest(req.id)}
                            >
                              Marcar Entregado
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="dashboard-card">
              <h3>Configuración del Comercio</h3>
              <p className="text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
                Actualiza los datos de tu comercio y el logotipo público oficial.
              </p>

              {profileError && <div className="checkout-error">{profileError}</div>}
              {profileSuccess && <div className="profile-success-msg">{profileSuccess}</div>}

              <form onSubmit={handleProfileSubmit} className="dashboard-profile-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nombre Comercial *</label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Logotipo del Comercio</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setProfileLogo(e.target.files[0])}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción de tu Tienda</label>
                  <textarea 
                    rows="3" 
                    value={profileForm.description}
                    onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                    placeholder="Escribe sobre la especialidad de tu tienda..."
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Dirección Física</label>
                    <input 
                      type="text" 
                      value={profileForm.address}
                      onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Sitio Web</label>
                    <input 
                      type="url" 
                      value={profileForm.website_url}
                      onChange={e => setProfileForm({ ...profileForm, website_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Instagram URL</label>
                    <input 
                      type="url" 
                      value={profileForm.instagram_url}
                      onChange={e => setProfileForm({ ...profileForm, instagram_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Facebook URL</label>
                    <input 
                      type="url" 
                      value={profileForm.facebook_url}
                      onChange={e => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Twitter/X URL</label>
                    <input 
                      type="url" 
                      value={profileForm.twitter_url}
                      onChange={e => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                  Guardar Cambios
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* PRODUCT EDITOR MODAL */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="checkout-modal-box" style={{ maxWidth: '640px' }}>
            <div className="checkout-modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Agregar Producto'}</h3>
              <button className="btn-close-modal" onClick={() => setIsProductModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {productModalError && <div className="checkout-error">{productModalError}</div>}

            <form onSubmit={handleProductSubmit} className="product-modal-form" style={{ padding: 'var(--spacing-lg)' }}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input 
                    type="text" 
                    required 
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <select 
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Moda">Moda</option>
                    <option value="Comida">Comida</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Belleza">Belleza</option>
                  </select>
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Precio ($) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0.01"
                    step="0.01"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Disponible *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input 
                    type="text" 
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Color</label>
                  <input 
                    type="text" 
                    value={productForm.color}
                    onChange={e => setProductForm({ ...productForm, color: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Talla / Tamaño</label>
                  <input 
                    type="text" 
                    value={productForm.size}
                    onChange={e => setProductForm({ ...productForm, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  rows="2"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Imagen (Archivo)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setProductImage(e.target.files[0])}
                  />
                </div>
                <div className="form-group">
                  <label>Alternativa (URL de Imagen)</label>
                  <input 
                    type="url" 
                    value={productForm.image_url_fallback}
                    onChange={e => setProductForm({ ...productForm, image_url_fallback: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Especificaciones Técnicas (Atributos JSON opcional)</label>
                <textarea 
                  rows="2"
                  value={productForm.specs_json}
                  onChange={e => setProductForm({ ...productForm, specs_json: e.target.value })}
                  placeholder='Ej: {"RAM": "16GB", "Disco": "SSD"}'
                />
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--spacing-lg)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsProductModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
