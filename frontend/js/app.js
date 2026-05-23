/* ==========================================================================
   SUCRESHOP - FRONTEND APPLICATION CONTROLLER
   ========================================================================== */

// 1. STATE MANAGEMENT
const state = {
    user: null,
    token: null,
    currentView: "landing",
    stores: [],
    products: [],
    searchQuery: "",
    filters: {
        category: "",
        brand: "",
        maxPrice: 2000,
        inStock: false
    },
    // Store owner state
    myStore: null,
    myProducts: []
};

// 2. DOM CONTENT LOADED - INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    // Check session
    const session = api.getSession();
    state.token = session.token;
    state.user = session.user;
    
    // Setup UI according to Auth State
    updateAuthNavbar();
    
    // Initialize Router
    window.addEventListener("hashchange", handleRouting);
    handleRouting();
    
    // Setup Global Event Listeners
    setupGlobalListeners();
    
    // Update Stats on Landing Page
    updateLandingStats();
    
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

// 3. SPA ROUTING
function handleRouting() {
    const hash = window.location.hash || "#landing";
    const parts = hash.split("/");
    const route = parts[0];
    
    // Hide all views
    document.querySelectorAll(".view-container").forEach(el => el.classList.add("hidden"));
    
    // Reset active nav state
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    
    if (route === "#landing") {
        state.currentView = "landing";
        document.getElementById("view-landing").classList.remove("active");
        document.getElementById("view-landing").classList.remove("hidden");
        document.querySelector('[data-view="landing"]').classList.add("active");
        loadLandingStores();
    } 
    else if (route === "#search") {
        state.currentView = "search";
        document.getElementById("view-search").classList.remove("hidden");
        document.querySelector('[data-view="search"]').classList.add("active");
        
        // Extract query param if any (e.g. #search?q=something)
        const qIndex = window.location.hash.indexOf("?q=");
        if (qIndex !== -1) {
            const queryVal = decodeURIComponent(window.location.hash.substring(qIndex + 3));
            document.getElementById("search-input").value = queryVal;
            triggerAISearch(queryVal);
        } else {
            // Load standard products
            loadProductsList();
        }
    } 
    else if (route === "#store" && parts[1]) {
        state.currentView = "store-profile";
        document.getElementById("view-store-profile").classList.remove("hidden");
        loadStoreProfile(parts[1]);
    } 
    else if (route === "#dashboard") {
        // Auth Guard
        if (!state.token || !state.user || !state.user.is_store_owner) {
            showToast("Acceso denegado. Debe iniciar sesión como tienda.", "error");
            window.location.hash = "#landing";
            return;
        }
        state.currentView = "dashboard";
        document.getElementById("view-store-dashboard").classList.remove("hidden");
        loadStoreDashboard();
    } 
    else if (route === "#admin" || route === "#admin-dashboard") {
        // Auth Guard for admin
        if (!state.token || !state.user || !state.user.is_admin) {
            showToast("Acceso denegado. Se requieren permisos de administrador.", "error");
            window.location.hash = "#landing";
            return;
        }
        state.currentView = "admin-dashboard";
        document.getElementById("view-admin-dashboard").classList.remove("hidden");
        loadAdminDashboard();
    }
    else {
        // Fallback to landing
        window.location.hash = "#landing";
    }
    
    // Close modal if route changes
    closeModal("auth-modal");
    closeModal("product-editor-modal");
    closeModal("admin-store-detail-modal");
    closeModal("admin-action-modal");
    
    // Re-create icons for static layouts
    setTimeout(() => {
        if (window.lucide) lucide.createIcons();
    }, 100);
}

// 4. AUTH NAVIGATION STATE SYNC
function updateAuthNavbar() {
    const container = document.getElementById("auth-nav-container");
    const mainNav = document.getElementById("main-nav");
    
    // Remove dashboard and admin links from nav if exists
    const dashNavItem = document.getElementById("nav-dash-item");
    if (dashNavItem) dashNavItem.remove();
    const adminNavItem = document.getElementById("nav-admin-item");
    if (adminNavItem) adminNavItem.remove();

    if (state.token && state.user) {
        // Show dashboard nav link if owner
        if (state.user.is_store_owner) {
            const dashLink = document.createElement("a");
            dashLink.href = "#dashboard";
            dashLink.id = "nav-dash-item";
            dashLink.className = `nav-item ${state.currentView === 'dashboard' ? 'active' : ''}`;
            dashLink.dataset.view = "dashboard";
            dashLink.textContent = "Panel de Control";
            mainNav.appendChild(dashLink);
        }
        // Show admin dashboard nav link if admin
        if (state.user.is_admin) {
            const adminLink = document.createElement("a");
            adminLink.href = "#admin";
            adminLink.id = "nav-admin-item";
            adminLink.className = `nav-item ${state.currentView === 'admin-dashboard' ? 'active' : ''}`;
            adminLink.dataset.view = "admin-dashboard";
            adminLink.textContent = "Panel Admin";
            mainNav.appendChild(adminLink);
        }
        
        // Logged In Navbar
        container.innerHTML = `
            <div class="user-pill-nav">
                <span class="user-nav-name"><i data-lucide="user" class="inline-icon"></i> ${state.user.full_name}</span>
                <button class="btn btn-outline btn-sm" id="btn-nav-logout">Cerrar Sesión</button>
            </div>
        `;
        
        // Bind logout
        document.getElementById("btn-nav-logout").addEventListener("click", () => {
            api.clearSession();
            state.token = null;
            state.user = null;
            state.myStore = null;
            state.myProducts = [];
            showToast("Sesión cerrada correctamente.");
            updateAuthNavbar();
            window.location.hash = "#landing";
        });
    } else {
        // Logged Out Navbar
        container.innerHTML = `
            <button class="btn btn-outline" id="btn-nav-login">Iniciar Sesión</button>
            <button class="btn btn-primary" id="btn-nav-register">Registrar Negocio</button>
        `;
        
        // Bind actions
        document.getElementById("btn-nav-login").addEventListener("click", () => openAuthModal("login"));
        document.getElementById("btn-nav-register").addEventListener("click", () => openAuthModal("register"));
    }
    
    if (window.lucide) lucide.createIcons();
}

// 5. TOAST NOTIFICATIONS UTILITY
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "check-circle";
    if (type === "error") icon = "alert-circle";
    if (type === "warning") icon = "alert-triangle";
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        </div>
        <button style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.2rem;" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    if (window.lucide) lucide.createIcons();
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// 6. GLOBAL LISTENERS
function setupGlobalListeners() {
    // Logo redirect
    document.getElementById("nav-logo").addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = "#landing";
    });
    
    // Landing Hero Actions
    document.getElementById("hero-btn-explore").addEventListener("click", () => {
        window.location.hash = "#search";
    });
    document.getElementById("hero-btn-register-store").addEventListener("click", () => {
        openAuthModal("register");
        document.getElementById("register-is-owner").checked = true;
        document.getElementById("register-store-name-container").classList.remove("hidden");
    });
    document.getElementById("benefits-register-btn").addEventListener("click", () => {
        openAuthModal("register");
        document.getElementById("register-is-owner").checked = true;
        document.getElementById("register-store-name-container").classList.remove("hidden");
    });

    // AI Landing Live Preview Demo Box
    const aiDemoInput = document.getElementById("ai-demo-input");
    const aiDemoSubmit = document.getElementById("ai-demo-submit");
    const aiDemoViz = document.getElementById("ai-demo-viz");
    
    const triggerDemoParse = async () => {
        const val = aiDemoInput.value.trim();
        if (!val) return;
        
        // Show indicator / loading state
        aiDemoViz.innerHTML = `<div class="viz-placeholder"><i data-lucide="loader" class="animate-spin"></i> Interpretando búsqueda...</div>`;
        if (window.lucide) lucide.createIcons();
        
        try {
            const data = await api.aiSearch(val);
            const inter = data.interpretation;
            
            // Build filter string
            let filtersStr = [];
            if (inter.color) filtersStr.push(`Color: ${inter.color}`);
            if (inter.size) filtersStr.push(`Talla: ${inter.size}`);
            if (inter.max_price) filtersStr.push(`Máx: $${inter.max_price}`);
            if (inter.min_price) filtersStr.push(`Mín: $${inter.min_price}`);
            if (inter.in_stock_only) filtersStr.push("En Stock");
            if (inter.is_budget) filtersStr.push("Económico");
            for (let [k, v] of Object.entries(inter.specs)) {
                filtersStr.push(`${k}: ${v}`);
            }
            
            aiDemoViz.innerHTML = `
                <div class="viz-results">
                    <div class="viz-item"><span class="viz-label">Categoría:</span> <span class="viz-value">${inter.category || "General"}</span></div>
                    <div class="viz-item"><span class="viz-label">Marca:</span> <span class="viz-value">${inter.brand || "Todas"}</span></div>
                    <div class="viz-item"><span class="viz-label">Filtros:</span> <span class="viz-value">${filtersStr.length > 0 ? filtersStr.join(", ") : "Ninguno"}</span></div>
                    <div class="viz-explanation">${inter.explanation}</div>
                    <button class="btn btn-outline btn-sm btn-block" id="viz-search-btn-demo">Buscar este producto real</button>
                </div>
            `;
            
            if (window.lucide) lucide.createIcons();
            
            // Redirect to search view with query
            document.getElementById("viz-search-btn-demo").addEventListener("click", () => {
                window.location.hash = `#search?q=${encodeURIComponent(val)}`;
            });
            
        } catch (err) {
            aiDemoViz.innerHTML = `<div class="viz-placeholder" style="color:hsl(var(--danger))">Error al conectar con la IA.</div>`;
        }
    };

    aiDemoSubmit.addEventListener("click", triggerDemoParse);
    aiDemoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") triggerDemoParse();
    });

    // REAL EXPLORE SEARCH INPUTS
    const searchInput = document.getElementById("search-input");
    const btnSearchSubmit = document.getElementById("btn-search-submit");
    
    btnSearchSubmit.addEventListener("click", () => {
        triggerAISearch(searchInput.value.trim());
    });
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") triggerAISearch(searchInput.value.trim());
    });

    // SEARCH FILTER CONTROLS (SIDEBAR)
    document.querySelectorAll('input[name="filter-category"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            state.filters.category = e.target.value;
            loadProductsList();
        });
    });
    
    const stockCheckbox = document.getElementById("filter-stock-only");
    stockCheckbox.addEventListener("change", (e) => {
        state.filters.inStock = e.target.checked;
        loadProductsList();
    });

    const priceRange = document.getElementById("filter-price-range");
    const priceRangeVal = document.getElementById("price-range-value");
    priceRange.addEventListener("input", (e) => {
        priceRangeVal.textContent = `Hasta $${e.target.value}`;
        state.filters.maxPrice = parseFloat(e.target.value);
    });
    priceRange.addEventListener("change", () => {
        loadProductsList();
    });

    document.getElementById("btn-clear-filters").addEventListener("click", () => {
        document.getElementById("search-input").value = "";
        document.getElementById("ai-insights-panel").classList.add("hidden");
        
        // Reset state filters
        state.filters.category = "";
        state.filters.brand = "";
        state.filters.inStock = false;
        state.filters.maxPrice = 2000;
        
        // Reset controls
        document.querySelectorAll('input[name="filter-category"]')[0].checked = true;
        document.getElementById("filter-stock-only").checked = false;
        document.getElementById("filter-price-range").value = 2000;
        priceRangeVal.textContent = "Hasta $2000";
        
        // Reset brand check if any
        document.querySelectorAll(".brand-filter-check").forEach(chk => chk.checked = false);
        
        loadProductsList();
    });

    // Sorting dropdown listener
    document.getElementById("sort-select").addEventListener("change", () => {
        renderProductsGrid();
    });

    // AUTH MODAL TAB TRIGGERS
    const authLoginBtn = document.getElementById("auth-tab-login-btn");
    const authRegisterBtn = document.getElementById("auth-tab-register-btn");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authTitle = document.getElementById("auth-modal-title");

    authLoginBtn.addEventListener("click", () => toggleAuthTabs("login"));
    authRegisterBtn.addEventListener("click", () => toggleAuthTabs("register"));
    document.getElementById("link-to-register").addEventListener("click", (e) => {
        e.preventDefault();
        toggleAuthTabs("register");
    });
    document.getElementById("link-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        toggleAuthTabs("login");
    });

    // Store registration checkbox
    const isOwnerCheck = document.getElementById("register-is-owner");
    const storeNameContainer = document.getElementById("register-store-name-container");
    const storeNameInput = document.getElementById("register-store-name");

    isOwnerCheck.addEventListener("change", (e) => {
        if (e.target.checked) {
            storeNameContainer.classList.remove("hidden");
            storeNameInput.setAttribute("required", "required");
        } else {
            storeNameContainer.classList.add("hidden");
            storeNameInput.removeAttribute("required");
        }
    });

    // AUTH SUBMISSIONS
    loginForm.addEventListener("submit", handleLoginSubmit);
    registerForm.addEventListener("submit", handleRegisterSubmit);

    // MODAL CLOSING ACTIONS
    document.getElementById("btn-close-auth-modal").addEventListener("click", () => closeModal("auth-modal"));
    document.getElementById("btn-close-product-modal").addEventListener("click", () => closeModal("product-editor-modal"));
    document.getElementById("btn-cancel-product-modal").addEventListener("click", () => closeModal("product-editor-modal"));
}

// 7. VIEW LOADER: LANDING PAGE STORES
async function loadLandingStores() {
    const grid = document.getElementById("landing-stores-grid");
    grid.innerHTML = `<div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div>`;
    
    try {
        const stores = await api.getStores();
        state.stores = stores;
        
        if (stores.length === 0) {
            grid.innerHTML = `<div class="no-results glass-card">No se encontraron tiendas oficiales registradas.</div>`;
            return;
        }
        
        grid.innerHTML = stores.map(store => `
            <div class="store-card glass-card" onclick="window.location.hash='#store/${store.id}'">
                <div class="store-logo-wrapper">
                    <img src="${store.logo_url || '/uploads/default_logo.png'}" alt="Logo ${store.name}" class="store-logo-img" onerror="this.onerror=null;this.src='/uploads/default_logo.png';">
                </div>
                <h4>${store.name}</h4>
                <p class="store-card-desc">${store.description || 'Sin descripción.'}</p>
                <div class="store-meta-badge">
                    <i data-lucide="map-pin" style="width:14px;height:14px;"></i>
                    <span>${store.address || 'Sucre'}</span>
                </div>
            </div>
        `).join("");
        
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        grid.innerHTML = `<div class="error-msg glass-card">Error al cargar tiendas: ${err.message}</div>`;
    }
}

async function updateLandingStats() {
    try {
        const stores = await api.getStores();
        const products = await api.getProducts();
        
        document.getElementById("stat-stores").textContent = `+${stores.length} Tiendas`;
        document.getElementById("stat-products").textContent = `+${products.length} Productos`;
    } catch (e) {
        console.warn("Could not load landing stats", e);
    }
}

// 8. VIEW LOADER: ADVANCED AI SEARCH & EXPLORE
async function triggerAISearch(query) {
    if (!query) {
        loadProductsList();
        return;
    }
    
    const grid = document.getElementById("search-products-grid");
    const insightsPanel = document.getElementById("ai-insights-panel");
    const resultsCount = document.getElementById("results-count-text");
    
    grid.innerHTML = `<div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div>`;
    
    try {
        const data = await api.aiSearch(query);
        const inter = data.interpretation;
        state.products = data.results;
        
        // Show AI Insights panel
        insightsPanel.classList.remove("hidden");
        document.getElementById("ai-explanation-content").innerHTML = inter.explanation;
        
        // Render interpreted tags
        const tagsContainer = document.getElementById("ai-tags-container");
        tagsContainer.innerHTML = "";
        
        const addTag = (text, icon) => {
            const tag = document.createElement("span");
            tag.className = "badge badge-purple";
            tag.innerHTML = `<i data-lucide="${icon}" style="width:12px;height:12px;margin-right:0.25rem;"></i> ${text}`;
            tagsContainer.appendChild(tag);
        };
        
        if (inter.category) addTag(`Categoría: ${inter.category}`, "tag");
        if (inter.brand) addTag(`Marca: ${inter.brand}`, "award");
        if (inter.color) addTag(`Color: ${inter.color}`, "palette");
        if (inter.size) addTag(`Talla: ${inter.size}`, "maximize-2");
        if (inter.max_price) addTag(`Precio Máx: $${inter.max_price}`, "arrow-down");
        if (inter.min_price) addTag(`Precio Mín: $${inter.min_price}`, "arrow-up");
        if (inter.in_stock_only) addTag("En Stock", "check-circle");
        if (inter.is_budget) addTag("Económico", "dollar-sign");
        for (let [k, v] of Object.entries(inter.specs)) {
            addTag(`${k}: ${v}`, "cpu");
        }
        
        // SYNC AI INTERPRETATIONS WITH SIDEBAR FILTERS!
        // Sync Category radio
        if (inter.category) {
            const radio = document.querySelector(`input[name="filter-category"][value="${inter.category}"]`);
            if (radio) radio.checked = true;
            state.filters.category = inter.category;
        } else {
            document.querySelectorAll(`input[name="filter-category"]`)[0].checked = true;
            state.filters.category = "";
        }
        
        // Sync Stock checkbox
        const stockChk = document.getElementById("filter-stock-only");
        stockChk.checked = inter.in_stock_only;
        state.filters.inStock = inter.in_stock_only;
        
        // Sync Price slider
        if (inter.max_price) {
            document.getElementById("filter-price-range").value = inter.max_price;
            document.getElementById("price-range-value").textContent = `Hasta $${inter.max_price}`;
            state.filters.maxPrice = inter.max_price;
        } else {
            document.getElementById("filter-price-range").value = 2000;
            document.getElementById("price-range-value").textContent = "Hasta $2000";
            state.filters.maxPrice = 2000;
        }
        
        // Render results
        renderProductsGrid();
        resultsCount.innerHTML = `Búsqueda Inteligente para: <em>"${query}"</em> (${data.results.length} coincidencias)`;
        
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        showToast("Error en búsqueda inteligente: " + err.message, "error");
        grid.innerHTML = `<div class="error-msg glass-card">Error al realizar la búsqueda: ${err.message}</div>`;
    }
}

async function loadProductsList() {
    const grid = document.getElementById("search-products-grid");
    const resultsCount = document.getElementById("results-count-text");
    grid.innerHTML = `<div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div>`;
    
    try {
        const products = await api.getProducts(state.filters);
        state.products = products;
        
        // Update Popular Brands List in Sidebar dynamically based on total products
        updateSidebarBrands(products);
        
        renderProductsGrid();
        
        let filterDesc = [];
        if (state.filters.category) filterDesc.push(`Categoría: ${state.filters.category}`);
        if (state.filters.inStock) filterDesc.push("En Stock");
        if (state.filters.maxPrice < 2000) filterDesc.push(`Máx: $${state.filters.maxPrice}`);
        if (state.filters.brand) filterDesc.push(`Marca: ${state.filters.brand}`);
        
        resultsCount.textContent = filterDesc.length > 0 
            ? `Productos Filtrados (${filterDesc.join(", ")})`
            : "Todos los Productos";
            
    } catch (err) {
        grid.innerHTML = `<div class="error-msg glass-card">Error al cargar productos: ${err.message}</div>`;
    }
}

function updateSidebarBrands(products) {
    const container = document.getElementById("filter-brands-list");
    
    // Extract unique brands
    const brandsSet = new Set();
    products.forEach(p => {
        if (p.brand) brandsSet.add(p.brand.trim());
    });
    
    const uniqueBrands = Array.from(brandsSet).slice(0, 6); // Cap at 6 brands
    
    if (uniqueBrands.length === 0) {
        container.innerHTML = `<span style="font-size:0.85rem; color:hsl(var(--text-muted));">No hay marcas disponibles.</span>`;
        return;
    }
    
    container.innerHTML = uniqueBrands.map(brand => `
        <label class="filter-checkbox-label">
            <input type="checkbox" class="brand-filter-check" value="${brand}" ${state.filters.brand === brand ? 'checked' : ''}>
            <span>${brand}</span>
        </label>
    `).join("");
    
    // Bind click events
    document.querySelectorAll(".brand-filter-check").forEach(chk => {
        chk.addEventListener("change", (e) => {
            // Uncheck other checks
            document.querySelectorAll(".brand-filter-check").forEach(other => {
                if (other !== e.target) other.checked = false;
            });
            
            state.filters.brand = e.target.checked ? e.target.value : "";
            loadProductsList();
        });
    });
}

function renderProductsGrid() {
    const grid = document.getElementById("search-products-grid");
    
    // Apply client side sorting
    const sortVal = document.getElementById("sort-select").value;
    const sorted = [...state.products];
    
    if (sortVal === "price_asc") {
        sorted.sort((a, b) => a.price - b.price);
    } else if (sortVal === "price_desc") {
        sorted.sort((a, b) => b.price - a.price);
    } else if (sortVal === "stock_desc") {
        sorted.sort((a, b) => b.stock - a.stock);
    }
    
    if (sorted.length === 0) {
        grid.innerHTML = `
            <div class="no-results glass-card" style="grid-column: 1 / -1; text-align:center; padding: 3rem 1rem;">
                <i data-lucide="info" style="width:40px;height:40px;color:hsl(var(--secondary));margin-bottom:1rem;"></i>
                <h4>No se encontraron productos coincidentes</h4>
                <p style="color:hsl(var(--text-muted)); font-size:0.9rem; margin-top:0.4rem;">Intenta removiendo filtros o cambiando tu término de búsqueda.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    grid.innerHTML = sorted.map(prod => {
        const isOutOfStock = prod.stock <= 0;
        const stockText = isOutOfStock ? "Agotado" : `Disponibles: ${prod.stock}`;
        const stockClass = isOutOfStock ? "badge-outline" : "badge-success";
        
        return `
            <div class="product-card glass-card">
                <div class="product-image-container">
                    <img src="${prod.image_url || '/uploads/default_product.png'}" alt="${prod.name}" class="product-img" onerror="this.onerror=null;this.src='/uploads/default_product.png';">
                    <span class="product-badge-stock badge ${stockClass}">${stockText}</span>
                </div>
                <div class="product-info">
                    <a href="#store/${prod.store_id}" class="product-store-link">${prod.store_name || 'Tienda Oficial'}</a>
                    <h4 class="product-name" title="${prod.name}">${prod.name}</h4>
                    <p class="product-desc">${prod.description || 'Sin descripción detallada.'}</p>
                    
                    <!-- Dynamic rendering of sizes or specs if available -->
                    <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom: 0.8rem;">
                        ${prod.brand ? `<span class="badge badge-outline" style="font-size:0.65rem;">${prod.brand}</span>` : ''}
                        ${prod.color ? `<span class="badge badge-outline" style="font-size:0.65rem; color:${prod.color}">${prod.color}</span>` : ''}
                        ${prod.size ? `<span class="badge badge-outline" style="font-size:0.65rem;">Talla: ${prod.size}</span>` : ''}
                    </div>

                    <div class="product-card-footer">
                        <span class="product-price">$${prod.price.toFixed(2)}</span>
                        <a href="https://wa.me/${prod.store_phone || '59170000000'}?text=Hola,%20estoy%20interesado%20en%20el%20producto%20${encodeURIComponent(prod.name)}%20de%20tu%20tienda%20SucreShop." 
                           target="_blank" class="btn btn-outline btn-sm">
                           <i data-lucide="message-square" style="width:14px;height:14px;margin-right:0.25rem;"></i> Consultar
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join("");
    
    if (window.lucide) lucide.createIcons();
}

// 9. VIEW LOADER: PUBLIC STORE PROFILE
async function loadStoreProfile(storeId) {
    const productsGrid = document.getElementById("store-products-grid");
    productsGrid.innerHTML = `<div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div>`;
    
    try {
        const store = await api.getStore(storeId);
        const products = await api.getStoreProducts(storeId);
        
        // Sync static profile cards
        document.getElementById("store-view-name").textContent = store.name;
        document.getElementById("store-view-description").textContent = store.description || "Esta tienda no posee una descripción oficial registrada.";
        document.getElementById("store-view-address").innerHTML = `<i data-lucide="map-pin"></i> Dirección: ${store.address || "Sucre, Bolivia"}`;
        document.getElementById("store-view-phone").innerHTML = `<i data-lucide="phone"></i> WhatsApp/Tlf: ${store.phone || "No especificado"}`;
        document.getElementById("store-view-logo").src = store.logo_url || "/uploads/default_logo.png";
        
        // Web Link
        const webLink = document.getElementById("store-view-web");
        if (store.website_url) {
            webLink.href = store.website_url;
            webLink.classList.remove("hidden");
        } else {
            webLink.classList.add("hidden");
        }
        
        // Social networks icons
        const socialsRow = document.getElementById("store-view-socials");
        socialsRow.innerHTML = "";
        
        const addSocial = (url, iconName, colorClass) => {
            if (!url) return;
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.className = "social-icon-btn";
            a.innerHTML = `<i data-lucide="${iconName}"></i>`;
            socialsRow.appendChild(a);
        };
        
        addSocial(store.instagram_url, "instagram");
        addSocial(store.facebook_url, "facebook");
        addSocial(store.twitter_url, "twitter");
        
        // Setup local catalog text filter
        const catalogSearchInput = document.getElementById("store-catalog-search");
        catalogSearchInput.value = "";
        
        const renderStoreProducts = (filterQuery = "") => {
            let filtered = products;
            if (filterQuery) {
                const term = filterQuery.toLowerCase();
                filtered = products.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    (p.description && p.description.toLowerCase().includes(term)) || 
                    (p.brand && p.brand.toLowerCase().includes(term))
                );
            }
            
            if (filtered.length === 0) {
                productsGrid.innerHTML = `<div class="no-results glass-card" style="grid-column:1/-1;">No se encontraron productos en catálogo.</div>`;
                return;
            }
            
            productsGrid.innerHTML = filtered.map(prod => {
                const isOutOfStock = prod.stock <= 0;
                const stockText = isOutOfStock ? "Agotado" : `En Stock: ${prod.stock}`;
                const stockClass = isOutOfStock ? "badge-outline" : "badge-success";
                
                return `
                    <div class="product-card glass-card">
                        <div class="product-image-container">
                            <img src="${prod.image_url || '/uploads/default_product.png'}" alt="${prod.name}" class="product-img" onerror="this.onerror=null;this.src='/uploads/default_product.png';">
                            <span class="product-badge-stock badge ${stockClass}">${stockText}</span>
                        </div>
                        <div class="product-info">
                            <span class="product-store-link">${store.name}</span>
                            <h4 class="product-name" title="${prod.name}">${prod.name}</h4>
                            <p class="product-desc">${prod.description || 'Sin descripción detallada.'}</p>
                            
                            <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom: 0.8rem;">
                                ${prod.brand ? `<span class="badge badge-outline" style="font-size:0.65rem;">${prod.brand}</span>` : ''}
                                ${prod.color ? `<span class="badge badge-outline" style="font-size:0.65rem;">${prod.color}</span>` : ''}
                                ${prod.size ? `<span class="badge badge-outline" style="font-size:0.65rem;">Talla: ${prod.size}</span>` : ''}
                            </div>

                            <div class="product-card-footer">
                                <span class="product-price">$${prod.price.toFixed(2)}</span>
                                <a href="https://wa.me/${store.phone || '59170000000'}?text=Hola,%20estoy%20interesado%20en%20el%20producto%20${encodeURIComponent(prod.name)}%20visto%20en%20SucreShop." 
                                   target="_blank" class="btn btn-outline btn-sm">
                                   <i data-lucide="message-square" style="width:14px;height:14px;margin-right:0.25rem;"></i> Consultar
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
            if (window.lucide) lucide.createIcons();
        };
        
        // Bind keyup local search
        catalogSearchInput.replaceWith(catalogSearchInput.cloneNode(true));
        document.getElementById("store-catalog-search").addEventListener("keyup", (e) => {
            renderStoreProducts(e.target.value.trim());
        });

        // Trigger first render
        renderStoreProducts();
        
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        productsGrid.innerHTML = `<div class="error-msg glass-card">Error al cargar la tienda oficial: ${err.message}</div>`;
    }
}

// 10. VIEW LOADER: STORE OWNER DASHBOARD
async function loadStoreDashboard() {
    setupDashboardTabs();
    
    try {
        const storeProfile = await api.getMyStoreProfile();
        state.myStore = storeProfile;
        
        // Fill Dashboard Sidebar Profile
        document.getElementById("dash-store-logo").src = storeProfile.logo_url || "/uploads/default_logo.png";
        document.getElementById("dash-store-name").textContent = storeProfile.name;
        document.getElementById("dash-owner-name").textContent = state.user.full_name;
        
        // Update store status banner
        const banner = document.getElementById("store-status-banner");
        banner.className = ""; // Reset classes
        banner.classList.add("hidden");
        
        if (storeProfile.status === "pending") {
            banner.classList.remove("hidden");
            banner.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
            banner.style.borderColor = "rgba(245, 158, 11, 0.3)";
            banner.style.color = "#fbbf24";
            banner.innerHTML = `
                <i data-lucide="clock" style="margin-top: 0.1rem; flex-shrink: 0;"></i>
                <div>
                    <h5 style="font-weight: 700; font-size: 0.95rem;">Tienda Pendiente de Aprobación</h5>
                    <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.2rem;">Tu tienda oficial está siendo revisada por el equipo de administración. Tus productos y perfil público no serán visibles en las búsquedas ni exploración pública hasta que seas aprobado.</p>
                </div>
            `;
        } else if (storeProfile.status === "rejected") {
            banner.classList.remove("hidden");
            banner.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            banner.style.borderColor = "rgba(239, 68, 68, 0.3)";
            banner.style.color = "#f87171";
            banner.innerHTML = `
                <i data-lucide="x-circle" style="margin-top: 0.1rem; flex-shrink: 0;"></i>
                <div>
                    <h5 style="font-weight: 700; font-size: 0.95rem;">Solicitud de Registro Rechazada</h5>
                    <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.2rem;">Tu solicitud de registro fue rechazada por el administrador y tu catálogo se encuentra inactivo.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.4rem; font-weight: 600; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px;">Motivo del Rechazo: ${storeProfile.status_reason || 'No especificado.'}</p>
                </div>
            `;
        } else if (storeProfile.status === "deleted") {
            banner.classList.remove("hidden");
            banner.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            banner.style.borderColor = "rgba(239, 68, 68, 0.3)";
            banner.style.color = "#f87171";
            banner.innerHTML = `
                <i data-lucide="trash-2" style="margin-top: 0.1rem; flex-shrink: 0;"></i>
                <div>
                    <h5 style="font-weight: 700; font-size: 0.95rem;">Tienda Desactivada / Eliminada</h5>
                    <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.2rem;">Tu tienda oficial ha sido eliminada o desactivada por la administración y ya no está expuesta al público.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.4rem; font-weight: 600; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px;">Motivo: ${storeProfile.status_reason || 'No especificado.'}</p>
                </div>
            `;
        }
        
        if (window.lucide) lucide.createIcons();
        
        // Load Catalog & Edit Profile Forms
        loadDashboardCatalog();
        loadDashboardProfileForm(storeProfile);
        
    } catch (err) {
        showToast("Error al cargar panel de administración: " + err.message, "error");
        window.location.hash = "#landing";
    }
}

function setupDashboardTabs() {
    document.querySelectorAll(".dash-menu-item").forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Clear previous listeners
    });
    
    document.querySelectorAll(".dash-menu-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.dataset.tab;
            
            // Toggle active menu button
            document.querySelectorAll(".dash-menu-item").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            // Toggle tab content
            document.querySelectorAll(".dash-tab-content").forEach(content => content.classList.add("hidden"));
            document.getElementById(`tab-${targetTab}`).classList.remove("hidden");
        });
    });
}

async function loadDashboardCatalog() {
    const tableBody = document.getElementById("dash-products-table-body");
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem;"><i data-lucide="loader" class="animate-spin" style="margin:0 auto;"></i> Cargando catálogo...</td></tr>`;
    if (window.lucide) lucide.createIcons();

    try {
        const products = await api.getStoreProducts(state.user.store_id);
        state.myProducts = products;
        
        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:hsl(var(--text-muted));">No posees productos en tu catálogo oficial todavía. ¡Agrega tu primer producto!</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = products.map(prod => {
            let attribs = [];
            if (prod.brand) attribs.push(`Marca: ${prod.brand}`);
            if (prod.color) attribs.push(`Color: ${prod.color}`);
            if (prod.size) attribs.push(`Talla: ${prod.size}`);
            
            return `
                <tr>
                    <td>
                        <img src="${prod.image_url || '/uploads/default_product.png'}" class="table-img" onerror="this.onerror=null;this.src='/uploads/default_product.png';">
                    </td>
                    <td style="font-weight:600; color:white;">${prod.name}</td>
                    <td><span class="badge badge-purple">${prod.category}</span></td>
                    <td style="font-weight:600;">$${prod.price.toFixed(2)}</td>
                    <td>
                        <span class="badge ${prod.stock > 0 ? 'badge-success' : 'badge-outline'}">
                            ${prod.stock > 0 ? `${prod.stock} disp.` : 'Agotado'}
                        </span>
                    </td>
                    <td style="font-size:0.8rem; color:hsl(var(--text-muted)); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${attribs.length > 0 ? attribs.join(", ") : "Ninguno"}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-outline btn-sm edit-prod-btn" data-id="${prod.id}">Editar</button>
                            <button class="btn btn-danger btn-sm delete-prod-btn" data-id="${prod.id}">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
        
        if (window.lucide) lucide.createIcons();
        
        // Bind Actions
        document.querySelectorAll(".edit-prod-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.target.dataset.id);
                openProductModal(id);
            });
        });
        
        document.querySelectorAll(".delete-prod-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.target.dataset.id);
                handleDeleteProduct(id);
            });
        });
        
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:hsl(var(--danger));">Error al cargar catálogo: ${err.message}</td></tr>`;
    }
}

function loadDashboardProfileForm(store) {
    document.getElementById("profile-name").value = store.name;
    document.getElementById("profile-description").value = store.description || "";
    document.getElementById("profile-address").value = store.address || "";
    document.getElementById("profile-phone").value = store.phone || "";
    document.getElementById("profile-web").value = store.website_url || "";
    document.getElementById("profile-insta").value = store.instagram_url || "";
    document.getElementById("profile-fb").value = store.facebook_url || "";
    document.getElementById("profile-tw").value = store.twitter_url || "";
    
    // Clear logo input
    document.getElementById("profile-logo").value = "";
    
    const form = document.getElementById("store-profile-form");
    form.replaceWith(form.cloneNode(true)); // Clear previous listeners
    
    document.getElementById("store-profile-form").addEventListener("submit", handleStoreProfileSubmit);
}

async function handleStoreProfileSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-save-profile");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Guardando...`;
    if (window.lucide) lucide.createIcons();
    
    const formData = new FormData();
    formData.append("name", document.getElementById("profile-name").value.trim());
    formData.append("description", document.getElementById("profile-description").value.trim());
    formData.append("address", document.getElementById("profile-address").value.trim());
    formData.append("phone", document.getElementById("profile-phone").value.trim());
    formData.append("website_url", document.getElementById("profile-web").value.trim());
    formData.append("instagram_url", document.getElementById("profile-insta").value.trim());
    formData.append("facebook_url", document.getElementById("profile-fb").value.trim());
    formData.append("twitter_url", document.getElementById("profile-tw").value.trim());
    
    const logoFile = document.getElementById("profile-logo").files[0];
    if (logoFile) {
        formData.append("logo", logoFile);
    }
    
    try {
        const updatedStore = await api.updateMyStoreProfile(formData);
        showToast("Perfil de la tienda oficial actualizado con éxito.");
        
        // Update sidebar logo & name
        document.getElementById("dash-store-logo").src = updatedStore.logo_url || "/uploads/default_logo.png";
        document.getElementById("dash-store-name").textContent = updatedStore.name;
        state.myStore = updatedStore;
        
        // Refresh session object
        const session = api.getSession();
        session.user.store_name = updatedStore.name;
        api.setSession(session.token, session.user);
        
    } catch (err) {
        showToast("Error al guardar cambios: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Guardar Cambios";
        if (window.lucide) lucide.createIcons();
    }
}

// 11. CATALOG CRUD: PRODUCT EDITOR MODAL
document.getElementById("btn-dash-add-product").addEventListener("click", () => {
    openProductModal();
});

function openProductModal(productId = null) {
    const modal = document.getElementById("product-editor-modal");
    const form = document.getElementById("product-editor-form");
    const title = document.getElementById("product-modal-title");
    
    // Reset Form
    form.reset();
    document.getElementById("edit-product-id").value = "";
    document.getElementById("prod-specs-json").value = "";
    
    if (productId) {
        // Edit Mode
        title.textContent = "Editar Producto";
        const prod = state.myProducts.find(p => p.id === productId);
        if (prod) {
            document.getElementById("edit-product-id").value = prod.id;
            document.getElementById("prod-name").value = prod.name;
            document.getElementById("prod-category").value = prod.category;
            document.getElementById("prod-price").value = prod.price;
            document.getElementById("prod-stock").value = prod.stock;
            document.getElementById("prod-brand").value = prod.brand || "";
            document.getElementById("prod-color").value = prod.color || "";
            document.getElementById("prod-size").value = prod.size || "";
            document.getElementById("prod-description").value = prod.description || "";
            document.getElementById("prod-image-url").value = prod.image_url || "";
            if (prod.specs) {
                document.getElementById("prod-specs-json").value = JSON.stringify(prod.specs);
            }
        }
    } else {
        // Add Mode
        title.textContent = "Agregar Producto";
    }
    
    modal.classList.remove("hidden");
    
    // Bind Submit handler
    form.replaceWith(form.cloneNode(true));
    document.getElementById("product-editor-form").addEventListener("submit", handleProductFormSubmit);
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("btn-submit-product-modal");
    const editId = document.getElementById("edit-product-id").value;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Guardando...`;
    if (window.lucide) lucide.createIcons();
    
    const formData = new FormData();
    formData.append("name", document.getElementById("prod-name").value.trim());
    formData.append("category", document.getElementById("prod-category").value);
    formData.append("price", parseFloat(document.getElementById("prod-price").value));
    formData.append("stock", parseInt(document.getElementById("prod-stock").value));
    formData.append("brand", document.getElementById("prod-brand").value.trim());
    formData.append("color", document.getElementById("prod-color").value.trim());
    formData.append("size", document.getElementById("prod-size").value.trim());
    formData.append("description", document.getElementById("prod-description").value.trim());
    formData.append("image_url_fallback", document.getElementById("prod-image-url").value.trim());
    
    // Custom specs as stringified JSON
    const specsJson = document.getElementById("prod-specs-json").value.trim();
    if (specsJson) {
        try {
            // Verify correct json parsing first
            JSON.parse(specsJson);
            formData.append("specs_json", specsJson);
        } catch (err) {
            showToast("El formato de Especificaciones JSON no es válido.", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Guardar Producto";
            return;
        }
    }
    
    const imageFile = document.getElementById("prod-image").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }
    
    try {
        if (editId) {
            // Update call
            await api.updateProduct(editId, formData);
            showToast("Producto actualizado correctamente en el catálogo.");
        } else {
            // Create call
            await api.createProduct(formData);
            showToast("Producto agregado con éxito al catálogo oficial.");
        }
        
        closeModal("product-editor-modal");
        loadDashboardCatalog(); // Refresh table
        
    } catch (err) {
        showToast("Error al guardar producto: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Guardar Producto";
        if (window.lucide) lucide.createIcons();
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm("¿Está seguro de que desea eliminar este producto del catálogo oficial? Esta acción es irreversible.")) {
        return;
    }
    
    try {
        await api.deleteProduct(productId);
        showToast("Producto eliminado exitosamente.");
        loadDashboardCatalog();
    } catch (err) {
        showToast("Error al eliminar producto: " + err.message, "error");
    }
}

// 12. AUTH MODAL HELPERS & SUBMISSIONS
function openAuthModal(mode = "login") {
    const modal = document.getElementById("auth-modal");
    modal.classList.remove("hidden");
    toggleAuthTabs(mode);
}

function toggleAuthTabs(mode) {
    const loginBtn = document.getElementById("auth-tab-login-btn");
    const regBtn = document.getElementById("auth-tab-register-btn");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const title = document.getElementById("auth-modal-title");
    
    if (mode === "login") {
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        title.textContent = "Iniciar Sesión";
    } else {
        loginBtn.classList.remove("active");
        regBtn.classList.add("active");
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        title.textContent = "Crear Cuenta de Comercio";
        
        // Initialize checkbox state
        document.getElementById("register-is-owner").checked = false;
        document.getElementById("register-store-name-container").classList.add("hidden");
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Conectando...`;
    if (window.lucide) lucide.createIcons();

    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;

    try {
        const data = await api.login(email, pass);
        state.token = data.access_token;
        state.user = data.user;
        
        showToast(`¡Bienvenido de vuelta, ${data.user.full_name}!`);
        updateAuthNavbar();
        closeModal("auth-modal");
        
        // Redirect to dashboard if owner, admin or buyer
        if (data.user.is_admin) {
            window.location.hash = "#admin";
        } else if (data.user.is_store_owner) {
            window.location.hash = "#dashboard";
        } else {
            window.location.hash = "#search";
        }
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Ingresar a la Plataforma";
        if (window.lucide) lucide.createIcons();
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Registrando...`;
    if (window.lucide) lucide.createIcons();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const pass = document.getElementById("register-password").value;
    const isOwner = document.getElementById("register-is-owner").checked;
    const storeName = document.getElementById("register-store-name").value.trim();

    try {
        await api.register(name, email, pass, isOwner, storeName);
        showToast("Registro completado con éxito. Ahora puedes iniciar sesión.");
        
        // Redirect to login tab
        toggleAuthTabs("login");
        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = pass;
    } catch (err) {
        showToast("Error al registrarse: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Crear Cuenta";
        if (window.lucide) lucide.createIcons();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("hidden");
    }
}

// ==========================================================================
// VIEW 10.5: ADMINISTRATIVE DASHBOARD CONTROLLER
// ==========================================================================
let adminActiveFilter = "all";
let adminStores = [];

async function loadAdminDashboard() {
    setupAdminListeners();
    
    const tableBody = document.getElementById("admin-stores-table-body");
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;"><i data-lucide="loader" class="animate-spin" style="margin:0 auto;"></i> Cargando tiendas...</td></tr>`;
    if (window.lucide) lucide.createIcons();
    
    try {
        const stores = await api.adminGetStores();
        adminStores = stores;
        
        // Update stats
        const pending = stores.filter(s => s.status === "pending").length;
        const approved = stores.filter(s => s.status === "approved").length;
        const rejected = stores.filter(s => s.status === "rejected").length;
        const deleted = stores.filter(s => s.status === "deleted").length;
        
        document.getElementById("admin-stat-pending").textContent = pending;
        document.getElementById("admin-stat-approved").textContent = approved;
        document.getElementById("admin-stat-rejected").textContent = rejected;
        document.getElementById("admin-stat-deleted").textContent = deleted;
        document.getElementById("admin-badge-pending-count").textContent = pending;
        
        renderAdminStoresTable();
        
    } catch (err) {
        showToast("Error al cargar panel de administración: " + err.message, "error");
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:hsl(var(--danger));">Error: ${err.message}</td></tr>`;
    }
}

function renderAdminStoresTable() {
    const tableBody = document.getElementById("admin-stores-table-body");
    
    let filtered = adminStores;
    if (adminActiveFilter !== "all") {
        filtered = adminStores.filter(s => s.status === adminActiveFilter);
    }
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:3rem; color:hsl(var(--text-muted));">No hay tiendas en esta lista.</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = filtered.map(store => {
        let statusBadge = "";
        if (store.status === "pending") statusBadge = `<span class="badge badge-warning">Pendiente</span>`;
        else if (store.status === "approved") statusBadge = `<span class="badge badge-success">Aprobada</span>`;
        else if (store.status === "rejected") statusBadge = `<span class="badge badge-outline" style="color:#fbbf24; border-color:#fbbf24; background:none;">Rechazada</span>`;
        else if (store.status === "deleted") statusBadge = `<span class="badge badge-outline" style="color:#ef4444; border-color:#ef4444; background:none;">Eliminada</span>`;
        
        let actionButtons = `
            <button class="btn btn-outline btn-sm admin-detail-btn" data-id="${store.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Detalle</button>
        `;
        
        if (store.status === "pending") {
            actionButtons += `
                <button class="btn btn-primary btn-sm admin-approve-btn" data-id="${store.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:linear-gradient(135deg, #10b981, #059669); box-shadow:none;">Aprobar</button>
                <button class="btn btn-danger btn-sm admin-reject-btn" data-id="${store.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Rechazar</button>
            `;
        } else if (store.status === "approved") {
            actionButtons += `
                <button class="btn btn-danger btn-sm admin-delete-btn" data-id="${store.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Eliminar</button>
            `;
        }
        
        return `
            <tr>
                <td>
                    <img src="${store.logo_url || '/uploads/default_logo.png'}" class="table-img" onerror="this.src='/uploads/default_logo.png'">
                </td>
                <td style="font-weight:600; color:white;">${store.name}</td>
                <td>
                    <div style="font-size:0.9rem; font-weight:500; color:white;">${store.owner_name}</div>
                    <div style="font-size:0.75rem; color:hsl(var(--text-muted));">${store.owner_email}</div>
                </td>
                <td>${store.phone || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons" style="gap:0.4rem;">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
    
    if (window.lucide) lucide.createIcons();
    
    // Bind buttons
    document.querySelectorAll(".admin-detail-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            openAdminDetailModal(id);
        });
    });
    
    document.querySelectorAll(".admin-approve-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            await handleAdminApproveStore(id);
        });
    });
    
    document.querySelectorAll(".admin-reject-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            openAdminActionModal(id, "reject");
        });
    });
    
    document.querySelectorAll(".admin-delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            openAdminActionModal(id, "delete");
        });
    });
}

function setupAdminListeners() {
    // Tab filters
    document.querySelectorAll(".admin-filter-btn").forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    document.querySelectorAll(".admin-filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".admin-filter-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            adminActiveFilter = e.currentTarget.dataset.status;
            renderAdminStoresTable();
        });
    });
    
    // Close modal detail buttons
    document.getElementById("btn-close-admin-detail-modal").onclick = () => closeModal("admin-store-detail-modal");
    document.getElementById("btn-close-admin-detail-modal-footer").onclick = () => closeModal("admin-store-detail-modal");
    
    // Close modal action buttons
    document.getElementById("btn-close-admin-action-modal").onclick = () => closeModal("admin-action-modal");
    document.getElementById("btn-cancel-admin-action").onclick = () => closeModal("admin-action-modal");
    
    // Admin action form submit
    const form = document.getElementById("admin-action-form");
    form.replaceWith(form.cloneNode(true));
    document.getElementById("admin-action-form").addEventListener("submit", handleAdminActionSubmit);
}

function openAdminDetailModal(storeId) {
    const store = adminStores.find(s => s.id === storeId);
    if (!store) return;
    
    document.getElementById("admin-detail-logo").src = store.logo_url || "/uploads/default_logo.png";
    document.getElementById("admin-detail-name").textContent = store.name;
    document.getElementById("admin-detail-owner").textContent = store.owner_name;
    document.getElementById("admin-detail-email").textContent = store.owner_email;
    document.getElementById("admin-detail-address").textContent = store.address || "No especificada";
    document.getElementById("admin-detail-phone").textContent = store.phone || "No especificado";
    document.getElementById("admin-detail-description").textContent = store.description || "Sin descripción.";
    
    // Badge status
    const statusBadge = document.getElementById("admin-detail-status-badge");
    statusBadge.className = "badge";
    if (store.status === "pending") {
        statusBadge.classList.add("badge-warning");
        statusBadge.textContent = "Pendiente";
    } else if (store.status === "approved") {
        statusBadge.classList.add("badge-success");
        statusBadge.textContent = "Aprobada";
    } else if (store.status === "rejected") {
        statusBadge.classList.add("badge-outline");
        statusBadge.textContent = "Rechazada";
    } else if (store.status === "deleted") {
        statusBadge.classList.add("badge-outline");
        statusBadge.textContent = "Eliminada";
    }
    
    // Links list
    const linksDiv = document.getElementById("admin-detail-links");
    linksDiv.innerHTML = "";
    if (store.website_url) {
        linksDiv.innerHTML += `<a href="${store.website_url}" target="_blank" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;"><i data-lucide="globe" style="width:12px; height:12px;"></i> Web</a>`;
    }
    if (store.instagram_url) {
        linksDiv.innerHTML += `<a href="${store.instagram_url}" target="_blank" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;"><i data-lucide="instagram" style="width:12px; height:12px;"></i> Instagram</a>`;
    }
    if (store.facebook_url) {
        linksDiv.innerHTML += `<a href="${store.facebook_url}" target="_blank" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;"><i data-lucide="facebook" style="width:12px; height:12px;"></i> Facebook</a>`;
    }
    if (store.twitter_url) {
        linksDiv.innerHTML += `<a href="${store.twitter_url}" target="_blank" class="btn btn-outline btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;"><i data-lucide="twitter" style="width:12px; height:12px;"></i> Twitter</a>`;
    }
    if (!linksDiv.innerHTML) {
        linksDiv.innerHTML = `<span style="font-size:0.85rem; color:hsl(var(--text-muted));">Sin enlaces oficiales.</span>`;
    }
    
    // Status reason container
    const reasonContainer = document.getElementById("admin-detail-reason-container");
    if (store.status === "rejected" || store.status === "deleted") {
        reasonContainer.classList.remove("hidden");
        document.getElementById("admin-detail-status-reason").textContent = store.status_reason || "No se especificó motivo.";
    } else {
        reasonContainer.classList.add("hidden");
    }
    
    if (window.lucide) lucide.createIcons();
    document.getElementById("admin-store-detail-modal").classList.remove("hidden");
}

async function handleAdminApproveStore(storeId) {
    if (!confirm("¿Está seguro de que desea aprobar esta solicitud de registro de comercio oficial?")) {
        return;
    }
    try {
        await api.adminApproveStore(storeId);
        showToast("Comercio oficial aprobado con éxito.");
        loadAdminDashboard();
    } catch (err) {
        showToast("Error al aprobar comercio: " + err.message, "error");
    }
}

function openAdminActionModal(storeId, actionType) {
    document.getElementById("admin-action-store-id").value = storeId;
    document.getElementById("admin-action-type").value = actionType;
    document.getElementById("admin-action-reason").value = "";
    
    const title = document.getElementById("admin-action-title");
    const label = document.getElementById("admin-action-label");
    const submitBtn = document.getElementById("btn-submit-admin-action");
    
    if (actionType === "reject") {
        title.textContent = "Rechazar Solicitud de Tienda";
        label.textContent = "Especifique el motivo de rechazo *";
        submitBtn.className = "btn btn-danger";
        submitBtn.textContent = "Confirmar Rechazo";
    } else {
        title.textContent = "Eliminar / Desactivar Tienda";
        label.textContent = "Especifique el motivo de eliminación/desactivación *";
        submitBtn.className = "btn btn-danger";
        submitBtn.textContent = "Confirmar Eliminación";
    }
    
    document.getElementById("admin-action-modal").classList.remove("hidden");
}

async function handleAdminActionSubmit(e) {
    e.preventDefault();
    const storeId = parseInt(document.getElementById("admin-action-store-id").value);
    const actionType = document.getElementById("admin-action-type").value;
    const reason = document.getElementById("admin-action-reason").value.trim();
    
    if (!reason) {
        showToast("El motivo es obligatorio.", "error");
        return;
    }
    
    const submitBtn = document.getElementById("btn-submit-admin-action");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Procesando...`;
    if (window.lucide) lucide.createIcons();
    
    try {
        if (actionType === "reject") {
            await api.adminRejectStore(storeId, reason);
            showToast("La solicitud de registro ha sido rechazada.");
        } else {
            await api.adminDeleteStore(storeId, reason);
            showToast("La tienda ha sido inactivada/eliminada.");
        }
        closeModal("admin-action-modal");
        loadAdminDashboard();
    } catch (err) {
        showToast("Error: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
        if (actionType === "reject") {
            submitBtn.textContent = "Confirmar Rechazo";
        } else {
            submitBtn.textContent = "Confirmar Eliminación";
        }
        if (window.lucide) lucide.createIcons();
    }
}
