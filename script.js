document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const cartBtn = document.querySelector('.cart-btn');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const subtotalAmount = document.querySelector('.subtotal-amount');
    const totalAmount = document.querySelector('.total-amount');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const minOrderMessage = document.querySelector('.min-order-message');
    
    // Carrinho de compras
    let cart = [];
    const shippingFee = 0; // Frete grátis
    const minOrderValue = 300;
    
    // Variáveis para autenticação
    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Elementos do DOM para autenticação
    const userInfoSection = document.getElementById('user-info');
    const loginSection = document.getElementById('login-section');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersBtn = document.getElementById('orders-btn');
    const sellerPanelBtn = document.getElementById('seller-panel-btn');
    const loginBtn = document.getElementById('login-btn');
    const notificationBadge = document.getElementById('notification-badge');
    
    // Modais
    const authModal = document.getElementById('auth-modal');
    const ordersModal = document.getElementById('orders-modal');
    const sellerPanelModal = document.getElementById('seller-panel-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Formulários
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // Listas
    const ordersList = document.getElementById('orders-list');
    const sellerOrdersList = document.getElementById('seller-orders-list');
    
    // Função para ajustar a altura do carrinho
    function adjustCartHeight() {
        const headerHeight = document.querySelector('.cart-header').offsetHeight;
        const summaryHeight = document.querySelector('.cart-summary').offsetHeight;
        const availableHeight = window.innerHeight - headerHeight - summaryHeight;
        
        document.querySelector('.cart-items').style.maxHeight = `${availableHeight}px`;
    }
    
    // Abrir carrinho
    cartBtn.addEventListener('click', () => {
        document.body.classList.add('cart-open');
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        adjustCartHeight();
    });
    
    // Fechar carrinho
    function closeCart() {
        document.body.classList.remove('cart-open');
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }
    
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    // Redimensionar quando a janela mudar de tamanho
    window.addEventListener('resize', adjustCartHeight);
    
    // Adicionar ao carrinho
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
    
    // Controle de quantidade nos produtos
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentNode.querySelector('.quantity-input');
            input.value = parseInt(input.value) + 1;
            updateDiscountBadge(this.closest('.product-card'));
        });
    });
    
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentNode.querySelector('.quantity-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                updateDiscountBadge(this.closest('.product-card'));
            }
        });
    });
    
    // Adicionar quantidades em bloco
    document.querySelectorAll('.bulk-qty').forEach(button => {
        button.addEventListener('click', function() {
            const qty = parseInt(this.dataset.qty);
            const input = this.parentNode.querySelector('.quantity-input');
            input.value = parseInt(input.value) + qty;
            updateDiscountBadge(this.closest('.product-card'));
        });
    });
    
    // Atualizar input manualmente
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value < 1) this.value = 1;
            updateDiscountBadge(this.closest('.product-card'));
        });
    });
    
    // Calcular desconto com base na quantidade
    function calculateDiscount(quantity, price) {
        let discount = 0;
        
        if (quantity >= 1000) {
            discount = 0.65; // 65% de desconto
        } else if (quantity >= 500) {
            discount = 0.55; // 55% de desconto
        } else if (quantity >= 100) {
            discount = 0.45; // 45% de desconto
        } else if (quantity >= 10) {
            discount = 0.25; // 25% de desconto
        }
        
        const discountedPrice = price * (1 - discount);
        return {
            discountRate: Math.round(discount * 100), // Arredondado para evitar decimais
            discountedPrice: discountedPrice,
            totalSavings: (price * quantity) - (discountedPrice * quantity)
        };
    }
    
    // Atualizar badge de desconto
    function updateDiscountBadge(productCard) {
        const quantity = parseInt(productCard.querySelector('.quantity-input').value);
        const price = parseFloat(productCard.querySelector('.add-to-cart').dataset.price);
        const discountBadge = productCard.querySelector('.discount-badge');
        
        const discountInfo = calculateDiscount(quantity, price);
        
        if (discountInfo.discountRate > 0) {
            discountBadge.textContent = `${discountInfo.discountRate}% OFF!`;
            discountBadge.style.display = 'inline-block';
        } else {
            discountBadge.style.display = 'none';
        }
    }
    
    function addToCart(e) {
        const button = e.target;
        const productCard = button.closest('.product-card');
        const quantityInput = productCard.querySelector('.quantity-input');
        
        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = parseFloat(button.dataset.price);
        const image = button.dataset.image;
        const quantity = parseInt(quantityInput.value);

        // Calcular preço com desconto
        const discountInfo = calculateDiscount(quantity, price);
        const finalPrice = discountInfo.discountRate > 0 ? discountInfo.discountedPrice : price;

        // Verificar se o item já está no carrinho
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            // Incrementar quantidade
            existingItem.quantity += quantity;
            // Atualizar preço se houver desconto melhor
            if (discountInfo.discountRate > existingItem.discountRate) {
                existingItem.price = finalPrice;
                existingItem.discountRate = discountInfo.discountRate;
                existingItem.originalPrice = price;
            }
        } else {
            // Adicionar novo item
            cart.push({
                id,
                name,
                price: finalPrice,
                originalPrice: price,
                quantity,
                image,
                discountRate: discountInfo.discountRate
            });
        }
        
        updateCart();
        
        // Feedback visual
        button.textContent = 'Adicionado!';
        button.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            button.textContent = 'adicionar ao carrinho';
            button.style.backgroundColor = '';
        }, 1000);
    }
    
    // Atualizar carrinho
    function updateCart() {
        renderCartItems();
        updateCartTotal();
        updateCartCount();
        checkMinOrder();
    }
    
    // Renderizar itens do carrinho
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio</p>';
            return;
        }
        
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            
            const discountText = item.discountRate > 0 
                ? `<div class="cart-item-discount">${item.discountRate}% OFF (Economia: R$${(item.originalPrice * item.quantity - item.price * item.quantity).toFixed(2)})</div>`
                : '';
            
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">
                            ${item.discountRate > 0 
                                ? `<span class="original-price">R$${item.originalPrice.toFixed(2)}</span> `
                                : ''}
                            R$${item.price.toFixed(2)}
                        </div>
                        ${discountText}
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                        <span class="cart-item-quantity-value editable-qty" data-id="${item.id}">${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}">Remover</button>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        // Adicionar eventos para os novos botões
        document.querySelectorAll('.decrease').forEach(button => {
            button.addEventListener('click', decreaseQuantity);
        });
        
        document.querySelectorAll('.increase').forEach(button => {
            button.addEventListener('click', increaseQuantity);
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', removeItem);
        });

        // Adicionar evento para edição direta da quantidade
        document.querySelectorAll('.editable-qty').forEach(element => {
            element.addEventListener('click', function(e) {
                const id = this.dataset.id;
                const item = cart.find(item => item.id === id);
                const currentQty = item.quantity;
                
                const input = document.createElement('input');
                input.type = 'number';
                input.value = currentQty;
                input.min = '1';
                input.className = 'qty-edit-input';
                
                this.replaceWith(input);
                input.focus();
                
                function handleBlur() {
                    const newQty = parseInt(input.value) || 1;
                    updateItemQuantity(id, newQty);
                    input.removeEventListener('blur', handleBlur);
                    input.removeEventListener('keypress', handleKeyPress);
                }
                
                function handleKeyPress(e) {
                    if (e.key === 'Enter') {
                        const newQty = parseInt(input.value) || 1;
                        updateItemQuantity(id, newQty);
                    }
                }
                
                input.addEventListener('blur', handleBlur);
                input.addEventListener('keypress', handleKeyPress);
            });
        });
    }

    // Função para atualizar quantidade do item
    function updateItemQuantity(id, newQuantity) {
        if (newQuantity < 1) newQuantity = 1;
        
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity = newQuantity;
            
            // Recalcular desconto
            const discountInfo = calculateDiscount(item.quantity, item.originalPrice);
            if (discountInfo.discountRate !== item.discountRate) {
                item.price = discountInfo.discountRate > 0 ? discountInfo.discountedPrice : item.originalPrice;
                item.discountRate = discountInfo.discountRate;
            }
            
            updateCart();
        }
    }
    
    // Diminuir quantidade
    function decreaseQuantity(e) {
        const id = e.target.dataset.id;
        const item = cart.find(item => item.id === id);
        
        if (item.quantity > 1) {
            item.quantity -= 1;
            // Recalcular desconto quando diminuir a quantidade
            const discountInfo = calculateDiscount(item.quantity, item.originalPrice);
            if (discountInfo.discountRate !== item.discountRate) {
                item.price = discountInfo.discountRate > 0 ? discountInfo.discountedPrice : item.originalPrice;
                item.discountRate = discountInfo.discountRate;
            }
        } else {
            cart = cart.filter(item => item.id !== id);
        }
        
        updateCart();
    }
    
    // Aumentar quantidade
    function increaseQuantity(e) {
        const id = e.target.dataset.id;
        const item = cart.find(item => item.id === id);
        item.quantity += 1;
        
        // Recalcular desconto quando aumentar a quantidade
        const discountInfo = calculateDiscount(item.quantity, item.originalPrice);
        if (discountInfo.discountRate !== item.discountRate) {
            item.price = discountInfo.discountRate > 0 ? discountInfo.discountedPrice : item.originalPrice;
            item.discountRate = discountInfo.discountRate;
        }
        
        updateCart();
    }
    
    // Remover item
    function removeItem(e) {
        const id = e.target.dataset.id;
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }
    
    // Atualizar total do carrinho
    function updateCartTotal() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + shippingFee;
        
        subtotalAmount.textContent = `R$${subtotal.toFixed(2)}`;
        totalAmount.textContent = `R$${total.toFixed(2)}`;
    }
    
    // Atualizar contador do carrinho
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = count;
    }
    
    // Verificar pedido mínimo
    function checkMinOrder() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (subtotal < minOrderValue) {
            minOrderMessage.style.display = 'block';
            checkoutBtn.disabled = true;
        } else {
            minOrderMessage.style.display = 'none';
            checkoutBtn.disabled = false;
        }
    }
    
    // Verificar se há usuário logado
    function checkLoggedInUser() {
        const loggedInUser = JSON.parse(localStorage.getItem('currentUser'));
        if (loggedInUser) {
            currentUser = loggedInUser;
            updateUIForLoggedInUser();
            updateNotificationBadge();
        } else {
            updateUIForLoggedOutUser();
        }
    }
    
    function updateUIForLoggedInUser() {
        userInfoSection.style.display = 'flex';
        loginSection.style.display = 'none';
        usernameDisplay.textContent = ''; // Removido o nome do usuário
        
        if (currentUser.isSeller) {
            sellerPanelBtn.style.display = 'inline-block';
        } else {
            sellerPanelBtn.style.display = 'none';
        }
    }
    
    function updateUIForLoggedOutUser() {
        userInfoSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
    
    function updateNotificationBadge() {
        if (!currentUser) return;
        
        const pendingOrders = orders.filter(order => 
            order.userId === currentUser.id && 
            order.status !== 'completed' && 
            order.status !== 'cancelled'
        ).length;
        
        notificationBadge.textContent = pendingOrders;
        notificationBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
    }
    
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateUIForLoggedInUser();
            updateNotificationBadge();
            hideModal(authModal);
            loginForm.reset();
        } else {
            alert('Email ou senha incorretos.');
        }
    }
    
    function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const cpf = document.getElementById('register-cpf').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const cep = document.getElementById('register-cep').value;
        const address = document.getElementById('register-address').value;
        const number = document.getElementById('register-number').value;
        const complement = document.getElementById('register-complement').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }
        
        if (users.some(u => u.email === email)) {
            alert('Este email já está cadastrado.');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            cpf,
            email,
            phone,
            cep,
            address,
            number,
            complement,
            password,
            isSeller: false
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        document.querySelector('.tab-btn[data-tab="login"]').click();
        registerForm.reset();
    }
    
    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForLoggedOutUser();
    }
    
    function showOrders() {
        if (!currentUser) {
            alert('Por favor, faça login para ver seus pedidos.');
            showModal(authModal);
            return;
        }
        
        showModal(ordersModal);
        renderUserOrders();
    }
    
    function showSellerPanel() {
        if (!currentUser || !currentUser.isSeller) return;
        
        showModal(sellerPanelModal);
        renderSellerOrders();
    }
    
    function renderUserOrders() {
        if (!currentUser) return;
        
        const userOrders = orders.filter(order => order.userId === currentUser.id)
                               .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (userOrders.length === 0) {
            ordersList.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            return;
        }
        
        ordersList.innerHTML = '';
        
        userOrders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            const statusClass = `status-${order.status.toLowerCase()}`;
            
            orderElement.innerHTML = `
                <h3>Pedido #${order.id.substring(0, 8)}</h3>
                <p>Data: ${new Date(order.date).toLocaleString()}</p>
                <p>Total: R$${order.total.toFixed(2)}</p>
                <p>Status: <span class="order-status ${statusClass}">${getStatusText(order.status)}</span></p>
                <div class="order-products">
                    ${order.products.map(product => `
                        <div class="order-product">
                            <span>${product.name} (${product.quantity}x)</span>
                            <span>R$${(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            ordersList.appendChild(orderElement);
        });
    }
    
    function renderSellerOrders() {
        if (!currentUser || !currentUser.isSeller) return;
        
        const sellerOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sellerOrders.length === 0) {
            sellerOrdersList.innerHTML = '<p>Nenhum pedido encontrado.</p>';
            return;
        }
        
        sellerOrdersList.innerHTML = '';
        
        sellerOrders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            
            const statusClass = `status-${order.status.toLowerCase()}`;
            const user = users.find(u => u.id === order.userId);
            const userName = user ? user.name : 'Cliente desconhecido';
            
            orderElement.innerHTML = `
                <h3>Pedido #${order.id.substring(0, 8)} - ${userName}</h3>
                <p>Data: ${new Date(order.date).toLocaleString()}</p>
                <p>Total: R$${order.total.toFixed(2)}</p>
                <p>Status: <span class="order-status ${statusClass}">${getStatusText(order.status)}</span></p>
                <div class="order-products">
                    ${order.products.map(product => `
                        <div class="order-product">
                            <span>${product.name} (${product.quantity}x)</span>
                            <span>R$${(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="seller-actions">
                    ${order.status === 'pending' ? `
                        <button class="process-order" data-order-id="${order.id}">Processar</button>
                        <button class="cancel-order" data-order-id="${order.id}">Cancelar</button>
                    ` : ''}
                    ${order.status === 'processing' ? `
                        <button class="complete-order" data-order-id="${order.id}">Completar</button>
                    ` : ''}
                </div>
            `;
            
            sellerOrdersList.appendChild(orderElement);
        });
        
        // Adicionar eventos para os botões de ação do vendedor
        document.querySelectorAll('.process-order').forEach(btn => {
            btn.addEventListener('click', (e) => updateOrderStatus(e.target.dataset.orderId, 'processing'));
        });
        
        document.querySelectorAll('.cancel-order').forEach(btn => {
            btn.addEventListener('click', (e) => updateOrderStatus(e.target.dataset.orderId, 'cancelled'));
        });
        
        document.querySelectorAll('.complete-order').forEach(btn => {
            btn.addEventListener('click', (e) => updateOrderStatus(e.target.dataset.orderId, 'completed'));
        });
    }
    
    function getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'processing': 'Em processamento',
            'completed': 'Concluído',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }
    
    function updateOrderStatus(orderId, newStatus) {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
            renderSellerOrders();
            updateNotificationBadge();
        }
    }
    
    function createOrder() {
        if (!currentUser || cart.length === 0) return;
        
        const newOrder = {
            id: Date.now().toString(),
            userId: currentUser.id,
            date: new Date().toISOString(),
            products: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending'
        };
        
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Atualizar notificação para o usuário
        updateNotificationBadge();
    }
    
    // Finalizar compra
    checkoutBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('Por favor, faça login para finalizar a compra.');
            showModal(authModal);
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (subtotal >= minOrderValue) {
            createOrder();
            alert('Compra finalizada com sucesso! Em breve entraremos em contato.');
            cart = [];
            updateCart();
            closeCart();
        } else {
            alert(`Pedido mínimo de R$${minOrderValue.toFixed(2)} não atingido.`);
        }
    });

    // Função para bloquear/desbloquear rolagem
    function toggleBodyScroll(enable) {
        document.body.classList.toggle('modal-open', !enable);
    }

    // Funções para mostrar/esconder modais
    function showModal(modal) {
        toggleBodyScroll(false);
        modal.style.display = 'block';
        
        // Focar no primeiro elemento interativo
        const focusable = modal.querySelector('button, input, select, textarea, a[href]');
        if (focusable) focusable.focus();
    }

    function hideModal(modal) {
        toggleBodyScroll(true);
        modal.style.display = 'none';
    }

    // Event Listeners para autenticação
    loginBtn.addEventListener('click', () => showModal(authModal));
    logoutBtn.addEventListener('click', logout);
    ordersBtn.addEventListener('click', showOrders);
    sellerPanelBtn.addEventListener('click', showSellerPanel);
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) hideModal(authModal);
        if (e.target === ordersModal) hideModal(ordersModal);
        if (e.target === sellerPanelModal) hideModal(sellerPanelModal);
    });
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.auth-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Inicializar badges de desconto
    document.querySelectorAll('.product-card').forEach(productCard => {
        updateDiscountBadge(productCard);
    });

    // Verificar usuário logado ao carregar a página
    checkLoggedInUser();

    // Criar usuário vendedor padrão se não existir
    if (!users.some(u => u.isSeller)) {
        users.push({
            id: 'seller1',
            name: 'Vendedor',
            email: 'vendedor@example.com',
            password: '123456',
            isSeller: true
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
});