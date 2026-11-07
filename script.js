document.addEventListener("DOMContentLoaded", () => {
    
    // Navbar Scroll
    const navbar = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }
    });

    // Chatbot Toggle
    const chatWidget = document.getElementById('chatbot-widget');
    const chatHeader = document.getElementById('chat-toggle');
    const chatIcon = document.getElementById('chat-icon');
    if (chatHeader && chatWidget) {
        chatHeader.addEventListener('click', () => {
            chatWidget.classList.toggle('open');
            chatIcon.classList.toggle('fa-chevron-down');
            chatIcon.classList.toggle('fa-chevron-up');
        });
    }

    // Coș Lateral Toggle
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnOpenCart = document.getElementById('cart-icon-btn');
    const btnCloseCart = document.getElementById('close-cart');
    
    if (btnOpenCart) btnOpenCart.addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
    if (btnCloseCart) btnCloseCart.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });
    if (cartOverlay) cartOverlay.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });

    // Functii Coș
    window.addToCartDB = function(id, btnElement = null) {
        if (typeof storeIsOpen !== 'undefined' && !storeIsOpen) return alert("Magazinul este închis!");
        
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const item = cart.find(i => i.id === id);
        
        if (item) {
            item.quantity += 1;
        } else {
            // Căutăm produsul în lista globală descărcată din Firebase
            const product = window.dbProductsList.find(p => p.id === id);
            if (product) {
                cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, is1plus1: product.onePlusOne || false });
            }
        }
        
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        
        // Animație verde de rotire pe buton
        if (btnElement) {
            btnElement.classList.add('spin-green');
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btnElement.classList.remove('spin-green');
                btnElement.innerHTML = '<i class="fas fa-plus"></i>';
                window.dispatchEvent(new Event('cartUpdated'));
            }, 600);
        } else {
            window.dispatchEvent(new Event('cartUpdated'));
        }

        // Animație iconiță coș
        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.3)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

    // Scădere cantitate (Minus în loc de X)
    window.decreaseQtyDB = function(id) {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const index = cart.findIndex(i => i.id === id);
        if (index !== -1) {
            cart[index].quantity -= 1;
            if(cart[index].quantity <= 0) cart.splice(index, 1);
            localStorage.setItem('divino_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    // Modificare cantitate direct din Sidebar-ul coșului
    window.changeQtySidebar = function(index, change) {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        cart[index].quantity += change;
        if(cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // Randare Coș Lateral
    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const container = document.getElementById('cart-items');
        let totalItems = 0, totalPrice = 0;
        
        if (container) {
            container.innerHTML = '';
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px 20px;"><i class="fas fa-shopping-basket" style="font-size:3rem; color:#e2e8f0; margin-bottom:15px;"></i><p style="color:#64748b; font-weight:600;">Coșul este gol.</p></div>';
            } else {
                cart.forEach((item, index) => {
                    totalItems += item.quantity;
                    totalPrice += item.price * item.quantity;
                    const giftHTML = item.is1plus1 ? `<div style="color:var(--success); font-size:0.8rem; font-weight:800; margin-top:4px;"><i class="fas fa-gift"></i> +${item.quantity} GRATIS</div>` : '';

                    container.innerHTML += `
                        <div class="cart-item">
                            <div style="flex:1;">
                                <h4 style="font-size:0.95rem; color:var(--dark); margin-bottom:5px;">${item.name}</h4>
                                <p style="color:var(--primary); font-weight:800;">${(item.price * item.quantity).toFixed(2)} lei</p>
                                ${giftHTML}
                            </div>
                            <div class="cart-controls-inline">
                                <button onclick="changeQtySidebar(${index}, -1)" class="btn-qty">-</button>
                                <span style="font-weight:800; width:20px; text-align:center;">${item.quantity}</span>
                                <button onclick="changeQtySidebar(${index}, 1)" class="btn-qty">+</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        const countEl = document.getElementById('cart-count');
        const priceEl = document.getElementById('cart-total-price');
        if (countEl) countEl.textContent = totalItems;
        if (priceEl) priceEl.textContent = `${totalPrice.toFixed(2)} lei`;
    };

    window.addEventListener('cartUpdated', () => { 
        if (typeof updateCartUI === 'function') updateCartUI(); 
        if (typeof renderMenu === 'function') renderMenu(); // Re-randeaza meniul pe produse.html
    });
    
    updateCartUI();

    // Logica Pop-up Newsletter
    const popup = document.getElementById('newsletter-popup');
    const closePopupBtn = document.getElementById('close-popup');
    const popupForm = document.getElementById('popup-form');
    
    if (popup && !localStorage.getItem('newsletter_shown')) {
        setTimeout(() => { popup.classList.add('show'); }, 4000);
    }
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            localStorage.setItem('newsletter_shown', 'true');
        });
    }
});
