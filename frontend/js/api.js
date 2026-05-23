/* ==========================================================================
   SUCRESHOP - API CLIENT
   ========================================================================== */

const API_BASE = ""; // Relative path, served from the same server

const api = {
    // Session token management
    setSession(token, user) {
        localStorage.setItem("sucreshop_token", token);
        localStorage.setItem("sucreshop_user", JSON.stringify(user));
    },

    getSession() {
        const token = localStorage.getItem("sucreshop_token");
        const userJson = localStorage.getItem("sucreshop_user");
        return {
            token,
            user: userJson ? JSON.parse(userJson) : null
        };
    },

    clearSession() {
        localStorage.removeItem("sucreshop_token");
        localStorage.removeItem("sucreshop_user");
    },

    // Helper for requests
    async request(url, options = {}) {
        const session = this.getSession();
        
        // Add auth header if token exists
        options.headers = options.headers || {};
        if (session.token) {
            options.headers["Authorization"] = `Bearer ${session.token}`;
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                // Return server validation error details if available
                const errorMsg = data.detail || "Ha ocurrido un error inesperado.";
                throw new Error(errorMsg);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error on ${url}:`, error);
            throw error;
        }
    },

    // --- AUTHENTICATION ---
    
    async login(email, password) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        const response = await this.request(`${API_BASE}/api/auth/login`, {
            method: "POST",
            body: formData
        });
        
        this.setSession(response.access_token, response.user);
        return response;
    },

    async register(fullName, email, password, isStoreOwner, storeName) {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("full_name", fullName);
        formData.append("is_store_owner", isStoreOwner);
        if (isStoreOwner && storeName) {
            formData.append("store_name", storeName);
        }

        return await this.request(`${API_BASE}/api/auth/register`, {
            method: "POST",
            body: formData
        });
    },

    async getMe() {
        return await this.request(`${API_BASE}/api/auth/me`);
    },

    // --- STORES ---
    
    async getStores() {
        return await this.request(`${API_BASE}/api/stores`);
    },

    async getStore(storeId) {
        return await this.request(`${API_BASE}/api/stores/${storeId}`);
    },

    async getStoreProducts(storeId) {
        return await this.request(`${API_BASE}/api/stores/${storeId}/products`);
    },

    // --- PRODUCTS & SEARCH ---
    
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.append("category", filters.category);
        if (filters.brand) params.append("brand", filters.brand);
        if (filters.maxPrice) params.append("max_price", filters.maxPrice);
        if (filters.inStock) params.append("in_stock", filters.inStock);

        const url = `${API_BASE}/api/products?${params.toString()}`;
        return await this.request(url);
    },

    async aiSearch(query) {
        const params = new URLSearchParams({ query });
        return await this.request(`${API_BASE}/api/search?${params.toString()}`);
    },

    // --- STORE OWNER OPERATIONS ---
    
    async getMyStoreProfile() {
        return await this.request(`${API_BASE}/api/stores/me/profile`);
    },

    async updateMyStoreProfile(formData) {
        return await this.request(`${API_BASE}/api/stores/me/profile`, {
            method: "PUT",
            body: formData // Multipart form data
        });
    },

    async createProduct(formData) {
        return await this.request(`${API_BASE}/api/products/create`, {
            method: "POST",
            body: formData // Multipart form data
        });
    },

    async updateProduct(productId, formData) {
        return await this.request(`${API_BASE}/api/products/${productId}/update`, {
            method: "PUT",
            body: formData // Multipart form data
        });
    },

    async deleteProduct(productId) {
        return await this.request(`${API_BASE}/api/products/${productId}/delete`, {
            method: "DELETE"
        });
    },

    // --- ADMINISTRATIVE OPERATIONS ---

    async adminGetStores() {
        return await this.request(`${API_BASE}/api/admin/stores`);
    },

    async adminApproveStore(storeId) {
        return await this.request(`${API_BASE}/api/admin/stores/${storeId}/approve`, {
            method: "POST"
        });
    },

    async adminRejectStore(storeId, reason) {
        return await this.request(`${API_BASE}/api/admin/stores/${storeId}/reject`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        });
    },

    async adminDeleteStore(storeId, reason) {
        return await this.request(`${API_BASE}/api/admin/stores/${storeId}/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        });
    }
};
