/* eslint-disable react-hooks/set-state-in-effect */
import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Clock, CheckCircle, XCircle, Trash2, Eye, X, Globe } from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Admin states
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0
  });

  // Modal states
  const [selectedStore, setSelectedStore] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('reject'); // 'reject' or 'delete'
  const [actionReason, setActionReason] = useState('');
  const [actionStoreId, setActionStoreId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const activeFilterRef = useRef(activeFilter);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  const calculateStats = (data) => {
    const pending = data.filter(s => s.status === 'pending').length;
    const approved = data.filter(s => s.status === 'approved').length;
    const rejected = data.filter(s => s.status === 'rejected').length;
    const deleted = data.filter(s => s.status === 'deleted').length;
    setStats({ pending, approved, rejected, deleted });
  };

  const filterAndSetStores = (data, filter) => {
    if (filter === 'all') {
      setFilteredStores(data);
    } else {
      setFilteredStores(data.filter(s => s.status === filter));
    }
  };

  const loadStores = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const data = await api.adminGetStores();
      setStores(data);
      calculateStats(data);
      filterAndSetStores(data, activeFilterRef.current);
    } catch (err) {
      console.error('Error loading admin stores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadStores(false);
  }, [user, navigate, loadStores]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    filterAndSetStores(stores, filter);
  };

  const handleOpenDetailModal = (store) => {
    setSelectedStore(store);
    setIsDetailModalOpen(true);
  };

  const handleOpenActionModal = (storeId, type) => {
    setActionStoreId(storeId);
    setActionType(type);
    setActionReason('');
    setIsActionModalOpen(true);
  };

  const handleApproveStore = async (storeId) => {
    if (!window.confirm('¿Está seguro de que desea aprobar esta solicitud de registro de comercio oficial?')) {
      return;
    }
    try {
      await api.adminApproveStore(storeId);
      alert('Comercio oficial aprobado con éxito.');
      loadStores();
    } catch (err) {
      alert('Error al aprobar comercio: ' + err.message);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      alert('El motivo es obligatorio.');
      return;
    }
    setActionLoading(true);
    try {
      if (actionType === 'reject') {
        await api.adminRejectStore(actionStoreId, actionReason.trim());
        alert('La solicitud de registro ha sido rechazada.');
      } else {
        await api.adminDeleteStore(actionStoreId, actionReason.trim());
        alert('La tienda ha sido inactivada/eliminada.');
      }
      setIsActionModalOpen(false);
      loadStores();
    } catch (err) {
      alert('Error al procesar acción: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;
  if (loading && stores.length === 0) return <div className="container section-padding">Cargando panel de administración...</div>;

  return (
    <div className="dashboard-page container section-padding">
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ width: 48, height: 48, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-h2" style={{ marginBottom: 2 }}>Super Administrador</h1>
          <p className="text-muted">Control total y aprobación de comercios oficiales en SucreShop</p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-grid-sm">
        <div className="stat-card-sm" onClick={() => handleFilterChange('pending')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper-sm pending"><Clock size={20} /></div>
          <div>
            <h4 className="stat-number-sm">{stats.pending}</h4>
            <p className="stat-label-sm">Pendientes</p>
          </div>
        </div>
        <div className="stat-card-sm" onClick={() => handleFilterChange('approved')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper-sm approved"><CheckCircle size={20} /></div>
          <div>
            <h4 className="stat-number-sm">{stats.approved}</h4>
            <p className="stat-label-sm">Aprobadas</p>
          </div>
        </div>
        <div className="stat-card-sm" onClick={() => handleFilterChange('rejected')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper-sm rejected"><XCircle size={20} /></div>
          <div>
            <h4 className="stat-number-sm">{stats.rejected}</h4>
            <p className="stat-label-sm">Rechazadas</p>
          </div>
        </div>
        <div className="stat-card-sm" onClick={() => handleFilterChange('deleted')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper-sm deleted"><Trash2 size={20} /></div>
          <div>
            <h4 className="stat-number-sm">{stats.deleted}</h4>
            <p className="stat-label-sm">Eliminadas</p>
          </div>
        </div>
      </div>

      {/* TAB FILTERS */}
      <div className="admin-filters-tabs">
        <button className={`auth-tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilterChange('all')}>
          Todas ({stores.length})
        </button>
        <button className={`auth-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => handleFilterChange('pending')}>
          Pendientes ({stats.pending})
        </button>
        <button className={`auth-tab-btn ${activeFilter === 'approved' ? 'active' : ''}`} onClick={() => handleFilterChange('approved')}>
          Aprobadas ({stats.approved})
        </button>
        <button className={`auth-tab-btn ${activeFilter === 'rejected' ? 'active' : ''}`} onClick={() => handleFilterChange('rejected')}>
          Rechazadas ({stats.rejected})
        </button>
        <button className={`auth-tab-btn ${activeFilter === 'deleted' ? 'active' : ''}`} onClick={() => handleFilterChange('deleted')}>
          Eliminadas ({stats.deleted})
        </button>
      </div>

      {/* STORES TABLE */}
      <div className="dashboard-card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nombre Comercial</th>
                <th>Dueño</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                    No se encontraron tiendas en esta lista.
                  </td>
                </tr>
              ) : (
                filteredStores.map(store => (
                  <tr key={store.id}>
                    <td>
                      <img 
                        src={store.logo_url || '/uploads/default_logo.png'} 
                        alt={store.name} 
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-default)' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{store.name}</td>
                    <td>
                      <div>{store.owner_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{store.owner_email}</div>
                    </td>
                    <td>{store.phone || '-'}</td>
                    <td>
                      <span className={`badge badge-state-${store.status}`}>
                        {store.status === 'approved' ? 'Aprobada' : store.status === 'pending' ? 'Pendiente' : store.status === 'rejected' ? 'Rechazada' : 'Eliminada'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="action-icon-btn" 
                          onClick={() => handleOpenDetailModal(store)}
                          title="Ver Detalle"
                        >
                          <Eye size={16} />
                        </button>

                        {store.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-primary btn-sm btn-success-bg"
                              onClick={() => handleApproveStore(store.id)}
                            >
                              Aprobar
                            </button>
                            <button 
                              className="btn btn-outline btn-sm btn-danger-text"
                              onClick={() => handleOpenActionModal(store.id, 'reject')}
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {store.status === 'approved' && (
                          <button 
                            className="btn btn-outline btn-sm btn-danger-text"
                            onClick={() => handleOpenActionModal(store.id, 'delete')}
                          >
                            Inactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedStore && (
        <div className="modal-overlay">
          <div className="checkout-modal-box" style={{ maxWidth: '600px' }}>
            <div className="checkout-modal-header">
              <h3>Ficha del Comercio</h3>
              <button className="btn-close-modal" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="store-detail-modal-body" style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <img 
                  src={selectedStore.logo_url || '/uploads/default_logo.png'} 
                  alt={selectedStore.name} 
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }}
                />
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 2 }}>{selectedStore.name}</h4>
                  <span className={`badge badge-state-${selectedStore.status}`}>
                    {selectedStore.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción:</strong>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>{selectedStore.description || 'Sin descripción.'}</p>

              <div className="form-row-2" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dueño Comercial:</strong>
                  <p>{selectedStore.owner_name} ({selectedStore.owner_email})</p>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teléfono / WhatsApp:</strong>
                  <p>{selectedStore.phone || 'No especificado'}</p>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dirección Física:</strong>
                <p>{selectedStore.address || 'No especificada'}</p>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enlaces y Redes:</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {selectedStore.website_url && (
                    <a href={selectedStore.website_url} target="_blank" rel="noopener noreferrer" className="action-icon-btn" title="Web Oficial">
                      <Globe size={16} />
                    </a>
                  )}
                  {selectedStore.instagram_url && (
                    <a href={selectedStore.instagram_url} target="_blank" rel="noopener noreferrer" className="action-icon-btn" title="Instagram">
                      <InstagramIcon />
                    </a>
                  )}
                  {selectedStore.facebook_url && (
                    <a href={selectedStore.facebook_url} target="_blank" rel="noopener noreferrer" className="action-icon-btn" title="Facebook">
                      <FacebookIcon />
                    </a>
                  )}
                  {selectedStore.twitter_url && (
                    <a href={selectedStore.twitter_url} target="_blank" rel="noopener noreferrer" className="action-icon-btn" title="Twitter/X">
                      <TwitterIcon />
                    </a>
                  )}
                  {!selectedStore.website_url && !selectedStore.instagram_url && !selectedStore.facebook_url && !selectedStore.twitter_url && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin enlaces registrados.</span>
                  )}
                </div>
              </div>

              {(selectedStore.status === 'rejected' || selectedStore.status === 'deleted') && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '6px', color: '#b91c1c' }}>
                  <strong style={{ display: 'block', color: '#b91c1c', fontSize: '0.75rem' }}>Motivo de la Acción:</strong>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{selectedStore.status_reason || 'No especificado.'}</p>
                </div>
              )}

              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--spacing-lg)' }}>
                <button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTION REASON MODAL */}
      {isActionModalOpen && (
        <div className="modal-overlay">
          <div className="checkout-modal-box" style={{ maxWidth: '480px' }}>
            <div className="checkout-modal-header">
              <h3>{actionType === 'reject' ? 'Rechazar Registro' : 'Inactivar Tienda'}</h3>
              <button className="btn-close-modal" onClick={() => setIsActionModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} style={{ padding: 'var(--spacing-lg)' }}>
              <div className="form-group">
                <label>Especifica el motivo de esta acción *</label>
                <textarea 
                  rows="3" 
                  required 
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Detalla los motivos reglamentarios..."
                />
                <span style={{ color: '#b91c1c', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                  Este motivo será notificado al comercio oficial.
                </span>
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--spacing-lg)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsActionModalOpen(false)} disabled={actionLoading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626' }} disabled={actionLoading}>
                  {actionLoading ? 'Procesando...' : actionType === 'reject' ? 'Confirmar Rechazo' : 'Confirmar Inactivación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
