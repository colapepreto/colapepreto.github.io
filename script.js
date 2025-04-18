// ===== CONFIGURAÇÕES GLOBAIS =====
const SECURE_CONFIG = {
    API_BASE_URL: 'https://sua-api.com',
    MIN_ORDER_VALUE: 300,
    REQUEST_TIMEOUT: 5000,
    ACTION_DELAY: 1000
};

// ===== ESTADO DA APLICAÇÃO =====
const APP_STATE = {
    cart: [],
    currentUser: null,
    products: [],
    lastActionTime: 0
};

// ===== SELECTORS ===== 
const DOM = {
    // Carrinho
    cartBtn: document.querySelector('.cart-btn'),
    cartSidebar: document.querySelector('.cart-sidebar'),
    closeCartBtn: document.querySelector('.close-cart'),
    cartItemsContainer: document.querySelector('.cart-items'),
    cartCount: document.querySelector('.cart-count'),
    subtotalAmount: document.querySelector('.subtotal-amount'),
    totalAmount: document.querySelector('.total-amount'),
    checkoutBtn: document.querySelector('.checkout-btn'),
    minOrderMessage: document.querySelector('.min-order-message'),
    
    // Autenticação
    userInfoSection: document.getElementById('user-info'),
    loginSection: document.getElementById('login-section'),
    usernameDisplay: document.getElementById('username-display'),
    logoutBtn: document.getElementById('logout-btn'),
    ordersBtn: document.getElementById('orders-btn'),
    sellerPanelBtn: document.getElementById('seller-panel-btn'),
    loginBtn: document.getElementById('login-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    
    // Modais
    authModal: document.getElementById('auth-modal'),
    ordersModal: document.getElementById('orders-modal'),
    sellerPanelModal: document.getElementById('seller-panel-modal'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    sellerLogin: document.getElementById('seller-login'),
    
    // Produtos
    productsContainer: document.querySelector('.products-grid')
};

// ===== FUNÇÕES DE SEGURANÇA =====
const Security = {
    sanitize: (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    setCookie: (name, value, days) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;Secure;SameSite=Strict`;
    },

    getCookie: (name) => {
        return document.cookie.split('; ')
            .find(row => row.startsWith(name))
            ?.split('=')[1];
    },

    deleteCookie: (name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
};

// ===== FUNÇÕES DO CARRINHO ===== 
const Cart = {
    addItem: (product, quantity) => {
        const existingItem = APP_STATE.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            APP_STATE.cart.push({
                ...product,
                quantity,
                originalPrice: product.price
            });
        }
        Cart.update();
    },

    removeItem: (id) => {
        APP_STATE.cart = APP_STATE.cart.filter(item => item.id !== id);
        Cart.update();
    },

    updateItemQuantity: (id, newQuantity) => {
        const item = APP_STATE.cart.find(item => item.id === id);
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            Cart.update();
        }
    },

    calculateDiscount: (quantity) => {
        if (quantity >= 1000) return 0.65;
        if (quantity >= 500) return 0.55;
        if (quantity >= 100) return 0.45;
        if (quantity >= 10) return 0.25;
        return 0;
    },

    update: () => {
        // Atualiza totais
        const subtotal = APP_STATE.cart.reduce((sum, item) => {
            const discount = Cart.calculateDiscount(item.quantity);
            item.price = item.originalPrice * (1 - discount);
            return sum + (item.price * item.quantity);
        }, 0);

        DOM.subtotalAmount.textContent = `R$${subtotal.toFixed(2)}`;
        DOM.totalAmount.textContent = `R$${subtotal.toFixed(2)}`;
        DOM.cartCount.textContent = APP_STATE.cart.reduce((sum, item) => sum + item.quantity, 0);

        // Verifica valor mínimo
        DOM.checkoutBtn.disabled = subtotal < SECURE_CONFIG.MIN_ORDER_VALUE;
        DOM.minOrderMessage.style.display = subtotal < SECURE_CONFIG.MIN_ORDER_VALUE ? 'block' : 'none';

        // Renderiza itens
        DOM.cartItemsContainer.innerHTML = APP_STATE.cart.length === 0 
            ? '<p>Seu carrinho está vazio</p>'
            : APP_STATE.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <img src="${Security.sanitize(item.image)}" alt="${Security.sanitize(item.name)}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${Security.sanitize(item.name)}</div>
                            <div class="cart-item-price">
                                R$${item.price.toFixed(2)}
                                ${item.price < item.originalPrice 
                                    ? `<span class="original-price">R$${item.originalPrice.toFixed(2)}</span>`
                                    : ''}
                            </div>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">Remover</button>
                    </div>
                </div>
            `).join('');
    }
};

// ===== FUNÇÕES DE PRODUTOS =====
const Products = {
    load: async () => {
        try {
            const response = await fetch(`${SECURE_CONFIG.API_BASE_URL}/products`);
            APP_STATE.products = await response.json();
            Products.render();
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        }
    },

    render: () => {
        DOM.productsContainer.innerHTML = APP_STATE.products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${Security.sanitize(product.name)}" class="product-image">
                <div class="product-info">
                    <span class="product-price">R$${product.price.toFixed(2)}</span>
                    <h3 class="product-name">${Security.sanitize(product.name)}</h3>
                    <div class="quantity-selector">
                        <button class="quantity-btn decrease-qty">-</button>
                        <input type="number" class="quantity-input" value="1" min="1">
                        <button class="quantity-btn increase-qty">+</button>
                    </div>
                    <button class="add-to-cart" 
                        data-id="${product.id}"
                        data-name="${Security.sanitize(product.name)}"
                        data-price="${product.price}"
                        data-image="${product.image}">
                        Adicionar ao carrinho
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
const Auth = {
    login: async (email, password, isSeller) => {
        try {
            const response = await fetch(`${SECURE_CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, isSeller })
            });
            
            const data = await response.json();
            Security.setCookie('authToken', data.token, 1);
            APP_STATE.currentUser = data.user;
            Auth.updateUI();
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    },

    logout: () => {
        Security.deleteCookie('authToken');
        APP_STATE.currentUser = null;
        Auth.updateUI();
    },

    updateUI: () => {
        if (APP_STATE.currentUser) {
            DOM.userInfoSection.style.display = 'flex';
            DOM.loginSection.style.display = 'none';
            DOM.usernameDisplay.textContent = APP_STATE.currentUser.name.split(' ')[0];
            DOM.sellerPanelBtn.style.display = APP_STATE.currentUser.isSeller ? 'block' : 'none';
        } else {
            DOM.userInfoSection.style.display = 'none';
            DOM.loginSection.style.display = 'block';
        }
    }
};

// ===== EVENT LISTENERS =====
const setupEventListeners = () => {
    // Carrinho
    DOM.cartBtn.addEventListener('click', () => {
        DOM.cartSidebar.classList.add('active');
        DOM.cartOverlay.classList.add('active');
    });

    DOM.closeCartBtn.addEventListener('click', () => {
        DOM.cartSidebar.classList.remove('active');
        DOM.cartOverlay.classList.remove('active');
    });

    // Autenticação
    DOM.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await Auth.login(DOM.loginEmail.value, DOM.loginPassword.value, DOM.sellerLogin.checked);
    });

    DOM.logoutBtn.addEventListener('click', Auth.logout);

    // Produtos
    DOM.productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            const quantity = parseInt(productCard.querySelector('.quantity-input').value);
            const product = {
                id: e.target.dataset.id,
                name: e.target.dataset.name,
                price: parseFloat(e.target.dataset.price),
                image: e.target.dataset.image
            };
            Cart.addItem(product, quantity);
        }
    });
};

// ===== INICIALIZAÇÃO =====
const init = async () => {
    setupEventListeners();
    await Products.load();
    
    // Verifica autenticação
    const token = Security.getCookie('authToken');
    if (token) {
        try {
            const response = await fetch(`${SECURE_CONFIG.API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            APP_STATE.currentUser = await response.json();
            Auth.updateUI();
        } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
        }
    }
};

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);