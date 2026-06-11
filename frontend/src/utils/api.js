/* ==========================================================================
   SUCRESHOP - API CLIENT HELPER
   ========================================================================== */

const API_BASE = ""; // Relative proxy path

const api = {
  getToken() {
    return localStorage.getItem("token");
  },

  getHeaders(isJson = true) {
    const headers = {};
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (isJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  },

  async request(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      // If no content returned, return empty or status
      const contentType = response.headers.get("content-type");
      let data = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { detail: await response.text() };
      }

      if (!response.ok) {
        const errorMsg = data.detail || "Ha ocurrido un error inesperado.";
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${url}:`, error);
      throw error;
    }
  },

  // --- PUBLIC STORES & PRODUCTS ---
  async getStores() {
    return this.request(`${API_BASE}/api/stores`);
  },

  async getStore(storeId) {
    return this.request(`${API_BASE}/api/stores/${storeId}`);
  },

  async getStoreProducts(storeId) {
    return this.request(`${API_BASE}/api/stores/${storeId}/products`);
  },

  async getProducts() {
    return this.request(`${API_BASE}/api/products`);
  },

  async aiSearch(query) {
    const params = new URLSearchParams({ query });
    return this.request(`${API_BASE}/api/search?${params.toString()}`);
  },

  async rateProduct(productId, rating) {
    const formData = new URLSearchParams();
    formData.append("rating", rating);
    return this.request(`${API_BASE}/api/products/${productId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
  },

  async rateStore(storeId, rating) {
    const formData = new URLSearchParams();
    formData.append("rating", rating);
    return this.request(`${API_BASE}/api/stores/${storeId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
  },

  // --- RESERVATIONS / PURCHASE REQUESTS ---
  async requestProduct(productId, paymentMethod) {
    return this.request(`${API_BASE}/api/products/${productId}/request`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({ payment_method: paymentMethod })
    });
  },

  async getStoreRequests() {
    return this.request(`${API_BASE}/api/stores/me/requests`, {
      method: "GET",
      headers: this.getHeaders(false)
    });
  },

  async getMyRequests() {
    return this.request(`${API_BASE}/api/requests/me`, {
      method: "GET",
      headers: this.getHeaders(false)
    });
  },

  async confirmRequest(requestId) {
    return this.request(`${API_BASE}/api/requests/${requestId}/confirm`, {
      method: "PUT",
      headers: this.getHeaders(false)
    });
  },

  async deliverRequest(requestId) {
    return this.request(`${API_BASE}/api/requests/${requestId}/deliver`, {
      method: "PUT",
      headers: this.getHeaders(false)
    });
  },

  async rejectRequest(requestId) {
    return this.request(`${API_BASE}/api/requests/${requestId}/reject`, {
      method: "PUT",
      headers: this.getHeaders(false)
    });
  },

  // --- STORE OWNER OPERATIONS ---
  async getMyStoreProfile() {
    return this.request(`${API_BASE}/api/stores/me/profile`, {
      headers: this.getHeaders(false)
    });
  },

  async updateMyStoreProfile(formData) {
    return this.request(`${API_BASE}/api/stores/me/profile`, {
      method: "PUT",
      headers: this.getHeaders(false), // Let browser set Content-Type with boundary for FormData
      body: formData
    });
  },

  async createProduct(formData) {
    return this.request(`${API_BASE}/api/products/create`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: formData
    });
  },

  async updateProduct(productId, formData) {
    return this.request(`${API_BASE}/api/products/${productId}/update`, {
      method: "PUT",
      headers: this.getHeaders(false),
      body: formData
    });
  },

  async deleteProduct(productId) {
    return this.request(`${API_BASE}/api/products/${productId}/delete`, {
      method: "DELETE",
      headers: this.getHeaders(false)
    });
  },

  // --- ADMINISTRATIVE OPERATIONS ---
  async adminGetStores() {
    return this.request(`${API_BASE}/api/admin/stores`, {
      headers: this.getHeaders(false)
    });
  },

  async adminApproveStore(storeId) {
    return this.request(`${API_BASE}/api/admin/stores/${storeId}/approve`, {
      method: "POST",
      headers: this.getHeaders(false)
    });
  },

  async adminRejectStore(storeId, reason) {
    return this.request(`${API_BASE}/api/admin/stores/${storeId}/reject`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({ reason })
    });
  },

  async adminDeleteStore(storeId, reason) {
    return this.request(`${API_BASE}/api/admin/stores/${storeId}/delete`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({ reason })
    });
  }
};

export default api;
