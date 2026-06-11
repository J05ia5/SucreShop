import { useState, useEffect, useRef, useContext } from 'react';
import { Search as SearchIcon, Sparkles, X, SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { AuthContext } from '../context/AuthContext';
import './Search.css';

const CATEGORIES = ['Tecnología', 'Moda', 'Comida', 'Hogar', 'Deportes', 'Belleza'];
const SORT_OPTIONS = [
  { value: '', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: Menor a Mayor' },
  { value: 'price_desc', label: 'Precio: Mayor a Menor' },
  { value: 'best_rated', label: 'Mejor Valorados' },
  { value: 'most_purchased', label: 'Más Vendidos' },
  { value: 'recent', label: 'Más Recientes' },
];

const INITIAL_FILTERS = {
  category: '',
  brand: '',
  color: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sortBy: '',
};

export default function Search() {
  const { openCheckout } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [results, setResults] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
  const [aiFiltersApplied, setAiFiltersApplied] = useState([]);
  const skipFilterEffect = useRef(false);

  // Load all products on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setAllProducts(data);
        setResults(data);
        setLoading(false);
        setInitialLoad(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        setInitialLoad(false);
      });
  }, []);

  const availableBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const availableColors = [...new Set(allProducts.map(p => p.color).filter(Boolean))].sort();

  const applyLocalFilters = (products, f) => {
    let filtered = [...products];
    if (f.category) filtered = filtered.filter(p => p.category === f.category);
    if (f.brand) filtered = filtered.filter(p => p.brand && p.brand.toLowerCase() === f.brand.toLowerCase());
    if (f.color) filtered = filtered.filter(p => p.color && p.color.toLowerCase() === f.color.toLowerCase());
    if (f.minPrice) filtered = filtered.filter(p => p.price >= parseFloat(f.minPrice));
    if (f.maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(f.maxPrice));
    if (f.inStock) filtered = filtered.filter(p => p.stock > 0);

    if (f.sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    else if (f.sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    else if (f.sortBy === 'best_rated') filtered.sort((a, b) => b.rating - a.rating);
    else if (f.sortBy === 'most_purchased') filtered.sort((a, b) => b.sales_count - a.sales_count);
    else if (f.sortBy === 'recent') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered;
  };

  // Re-apply when manual filters change — skip when AI just set them
  useEffect(() => {
    if (initialLoad) return;
    if (skipFilterEffect.current) {
      skipFilterEffect.current = false;
      return;
    }
    const baseData = aiResults !== null ? aiResults : allProducts;
    setResults(applyLocalFilters(baseData, filters));
  }, [filters, allProducts, aiResults, initialLoad]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setInsights(null);
      setAiResults(null);
      setAiFiltersApplied([]);
      setFilters({ ...INITIAL_FILTERS });
      setResults(allProducts);
      return;
    }

    setLoading(true);
    fetch(`/api/search?query=${encodeURIComponent(trimmed)}`)
      .then(res => res.json())
      .then(data => {
        const interpretation = data.interpretation;
        setInsights(interpretation);
        setAiResults(data.results);

        const newFilters = { ...INITIAL_FILTERS };
        const appliedLabels = [];

        if (interpretation.category) {
          newFilters.category = interpretation.category;
          appliedLabels.push({ key: 'category', label: `Categoría: ${interpretation.category}` });
        }
        if (interpretation.brand) {
          newFilters.brand = interpretation.brand;
          appliedLabels.push({ key: 'brand', label: `Marca: ${interpretation.brand}` });
        }
        if (interpretation.color) {
          newFilters.color = interpretation.color;
          appliedLabels.push({ key: 'color', label: `Color: ${interpretation.color}` });
        }
        if (interpretation.min_price != null) {
          newFilters.minPrice = String(interpretation.min_price);
          appliedLabels.push({ key: 'minPrice', label: `Desde: $${interpretation.min_price}` });
        }
        if (interpretation.max_price != null) {
          newFilters.maxPrice = String(interpretation.max_price);
          appliedLabels.push({ key: 'maxPrice', label: `Hasta: $${interpretation.max_price}` });
        }
        if (interpretation.in_stock_only) {
          newFilters.inStock = true;
          appliedLabels.push({ key: 'inStock', label: 'Solo en Stock' });
        }
        if (interpretation.sort_by) {
          newFilters.sortBy = interpretation.sort_by;
          const sortLabel = SORT_OPTIONS.find(s => s.value === interpretation.sort_by);
          if (sortLabel) appliedLabels.push({ key: 'sortBy', label: `Orden: ${sortLabel.label}` });
        }

        setAiFiltersApplied(appliedLabels);
        skipFilterEffect.current = true;
        setFilters(newFilters);
        setResults(data.results);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setAiFiltersApplied(prev => prev.filter(f => f.key !== name));
  };

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: INITIAL_FILTERS[key] }));
    setAiFiltersApplied(prev => prev.filter(f => f.key !== key));
  };

  const clearAllFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
    setQuery('');
    setInsights(null);
    setAiResults(null);
    setAiFiltersApplied([]);
    setResults(allProducts);
  };

  const hasActiveFilters = Object.keys(filters).some(k => k === 'inStock' ? filters[k] : filters[k] !== '');
  const activeFilterCount = Object.keys(filters).filter(k => k === 'inStock' ? filters[k] : filters[k] !== '').length;

  return (
    <div className="search-page container section-padding">
      <div className="search-header">
        <h1 className="text-h2">Explorar Catálogo</h1>
        <form onSubmit={handleSearch} className="search-bar-container">
          <Sparkles className="ai-icon" size={20} />
          <input 
            type="text" 
            className="search-input"
            placeholder="Busca con IA: 'zapatillas baratas rojas', 'laptop gamer 16gb ram'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear-btn" onClick={() => { setQuery(''); clearAllFilters(); }}>
              <X size={16} />
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            <SearchIcon size={16} /> Buscar
          </button>
        </form>
      </div>

      {insights && (
        <div className="ai-insights-panel">
          <div className="insights-header">
            <span className="badge badge-natural">IA Gemini</span>
            <h4>Interpretación de Búsqueda</h4>
          </div>
          <p className="insights-text">{insights.explanation}</p>
          {aiFiltersApplied.length > 0 && (
            <div className="ai-chips">
              <Tag size={14} className="chips-icon" />
              {aiFiltersApplied.map(chip => (
                <span key={chip.key} className="ai-chip">
                  {chip.label}
                  <button type="button" className="chip-remove" onClick={() => clearFilter(chip.key)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      <button className="btn btn-outline mobile-filter-btn" onClick={() => setShowFiltersMobile(!showFiltersMobile)}>
        <SlidersHorizontal size={16} /> Filtros
        {activeFilterCount > 0 && <span className="filter-count-badge">{activeFilterCount}</span>}
      </button>

      <div className="search-content">
        <div className={`filters-sidebar ${showFiltersMobile ? 'show' : ''}`}>
          <div className="filters-title-row">
            <h4 className="filters-title"><SlidersHorizontal size={16} /> Filtros</h4>
            {hasActiveFilters && (
              <button className="filters-clear-btn" onClick={clearAllFilters}>Limpiar todo</button>
            )}
          </div>
          
          <div className="filter-group">
            <label>Categoría</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">Todas</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Marca</label>
            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="">Todas</option>
              {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Color</label>
            <select name="color" value={filters.color} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {availableColors.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Rango de Precio ($)</label>
            <div className="price-range-inputs">
              <input type="number" name="minPrice" placeholder="Mín" value={filters.minPrice} onChange={handleFilterChange} min="0" />
              <span className="price-separator">—</span>
              <input type="number" name="maxPrice" placeholder="Máx" value={filters.maxPrice} onChange={handleFilterChange} min="0" />
            </div>
          </div>

          <div className="filter-group-checkbox">
            <input type="checkbox" id="inStock" name="inStock" checked={filters.inStock} onChange={handleFilterChange} />
            <label htmlFor="inStock">Solo en Stock</label>
          </div>

          <div className="filter-group" style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-subtle)' }}>
            <label><ArrowUpDown size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Ordenar por</label>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="results-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Buscando productos...</span>
            </div>
          ) : (
            <>
              <div className="results-header">
                <span>{results.length} producto{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
                {hasActiveFilters && <button className="results-clear-link" onClick={clearAllFilters}>Limpiar filtros</button>}
              </div>
              {results.length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron productos</h3>
                  <p>Intenta con otra búsqueda o ajusta los filtros.</p>
                  <button className="btn btn-outline" onClick={clearAllFilters}>Limpiar todos los filtros</button>
                </div>
              ) : (
                <div className="product-grid">
                  {results.map(p => <ProductCard key={p.id} product={p} onBuy={openCheckout} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
