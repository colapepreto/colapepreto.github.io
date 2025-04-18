// Configurações globais
const API_BASE_URL = 'https://sua-api.com';
const REQUEST_TIMEOUT = 5000; // 5 segundos

// Utilitário para fetch seguro
async function secureFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                ...options.headers
            },
            credentials: 'include',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Serviço de autenticação
export const authService = {
    async login(email, password, isSeller) {
        return secureFetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password, isSeller })
        });
    },

    async register(userData) {
        return secureFetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async logout() {
        return secureFetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST'
        });
    },

    async getOrders() {
        return secureFetch(`${API_BASE_URL}/orders`);
    },

    async createOrder(cart) {
        return secureFetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            body: JSON.stringify({ products: cart })
        });
    },

    async getUserData() {
        return secureFetch(`${API_BASE_URL}/user`);
    }
};

// Serviço de produtos
export const productService = {
    async getProducts() {
        return secureFetch(`${API_BASE_URL}/products`);
    },

    async getProduct(id) {
        return secureFetch(`${API_BASE_URL}/products/${id}`);
    }
};