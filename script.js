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
    const shippingFee = 100;
    const minOrderValue = 300;
    
    // Abrir/fechar carrinho
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });
    
    closeCartBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
    
    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
    
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
        } else if (quantity >= 100) {
            discount = 0.45; // 45% de desconto
        } else if (quantity >= 10) {
            discount = 0.25; // 25% de desconto
        }
        
        const discountedPrice = price * (1 - discount);
        return {
            discountRate: discount * 100,
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
                    <div>
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
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span class="cart-item-quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item" data-id="${item.id}">Remover</button>
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
    
    // Finalizar compra
    checkoutBtn.addEventListener('click', () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (subtotal >= minOrderValue) {
            alert('Compra finalizada com sucesso! Em breve entraremos em contato.');
            cart = [];
            updateCart();
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        } else {
            alert(`Pedido mínimo de R$${minOrderValue.toFixed(2)} não atingido.`);
        }
    });

    // Inicializar badges de desconto
    document.querySelectorAll('.product-card').forEach(productCard => {
        updateDiscountBadge(productCard);
    });
});