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

    // Adăugare produs nou din butonul [+]
    window.addToCartDB = function(id, name, price, is1plus1, btnElement) {
        if (typeof storeIsOpen !== 'undefined' && !storeIsOpen) return alert("Magazinul este momentan închis!");
        
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1, is1plus1: is1plus1 === 'true' });
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        
        // Animatie verde pe buton inainte sa se transforme
        if (btnElement) {
            btnElement.classList.add('spin-green');
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                window.dispatchEvent(new Event('cartUpdated')); // Dupa 400ms se schimba in [-] 1 [+]
            }, 400);
        }

        // Efect pe iconita cosului
        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.3)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

    // Funcția universală pentru [ - ] și [ + ] (Meniu & Sidebar)
    window.changeQtyDB = function(id, change) {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const index = cart.findIndex(i => i.id === id);
        if (index !== -1) {
            cart[index].quantity += change;
            if (cart[index].quantity <= 0) cart.splice(index, 1); // Sterge daca ajunge la 0
            localStorage.setItem('divino_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated')); // Anunta site-ul
        }
    };

    // Sincronizează doar butoanele de pe meniu (FĂRĂ să strice imaginile/re-randeze)
    window.syncMenuButtons = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        if (window.dbProductsList) {
            window.dbProductsList.forEach(p => {
                const btnContainer = document.getElementById(`action-btn-${p.id}`);
                if (btnContainer) {
                    const itemInCart = cart.find(i => i.id === p.id);
                    if (itemInCart) {
                        btnContainer.innerHTML = `
                            <div style="display:flex; align-items:center; gap:8px; background:#f1f5f9; padding:4px 6px; border-radius:50px; border:1px solid var(--border);">
                                <button onclick="changeQtyDB('${p.id}', -1)" style="background:white; color:var(--dark); border:none; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.1);">-</button>
                                <span style="font-weight:800; width:22px; text-align:center; color:var(--dark); font-size:1.1rem;">${itemInCart.quantity}</span>
                                <button onclick="changeQtyDB('${p.id}', 1)" style="background:white; color:var(--dark); border:none; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.1);">+</button>
                            </div>
                        `;
                    } else {
                        btnContainer.innerHTML = `
                            <button onclick="addToCartDB('${p.id}', '${p.name}', ${p.price}, '${p.onePlusOne}', this)" class="btn-add">
                                <i class="fas fa-plus"></i>
                            </button>
                        `;
                    }
                }
            });
        }
    };

    // Actualizează Coșul Lateral
    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const container = document.getElementById('cart-items');
        let totalItems = 0, totalPrice = 0;
        
        if (container) {
            container.innerHTML = '';
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px 20px;"><i class="fas fa-shopping-basket" style="font-size:3rem; color:#e2e8f0; margin-bottom:15px;"></i><p style="color:#64748b; font-weight:600;">Coșul este gol.</p></div>';
            } else {
                cart.forEach((item) => {
                    totalItems += item.quantity;
                    totalPrice += item.price * item.quantity;
                    
                    const giftHTML = item.is1plus1 ? `<div style="color:var(--success); font-size:0.8rem; font-weight:800; margin-top:4px;"><i class="fas fa-gift"></i> +${item.quantity} produs(e) GRATIS</div>` : '';

                    container.innerHTML += `
                        <div class="cart-item">
                            <div style="flex:1;">
                                <h4 style="font-size:0.95rem; color:var(--dark); margin-bottom:5px;">${item.name}</h4>
                                <p style="color:var(--primary); font-weight:800;">${(item.price * item.quantity).toFixed(2)} lei</p>
                                ${giftHTML}
                            </div>
                            <div class="cart-controls">
                                <button onclick="changeQtyDB('${item.id}', -1)">-</button>
                                <span style="font-weight:800; width:20px; text-align:center;">${item.quantity}</span>
                                <button onclick="changeQtyDB('${item.id}', 1)">+</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        const countEl = document.getElementById('cart-count');
        const priceEl = document.getElementById('cart-total-price');
        const msgArea = document.getElementById('free-delivery-msg');
        
        if (countEl) countEl.textContent = totalItems;
        if (priceEl) priceEl.textContent = `${totalPrice.toFixed(2)} lei`;
        
        if(typeof window.FREE_DELIVERY_THRESHOLD !== 'undefined' && msgArea) {
            const diff = window.FREE_DELIVERY_THRESHOLD - totalPrice;
            msgArea.style.display = 'block';
            if (totalPrice === 0) { msgArea.innerHTML = `Comandă de <strong>${window.FREE_DELIVERY_THRESHOLD} lei</strong> pt. livrare gratuită!`; msgArea.style.background = '#e0f2fe'; msgArea.style.color = '#0369a1'; }
            else if (diff > 0) { msgArea.innerHTML = `Mai adaugă <strong>${diff.toFixed(2)} lei</strong> pt. livrare gratuită!`; msgArea.style.background = '#e0f2fe'; msgArea.style.color = '#0369a1'; }
            else { msgArea.innerHTML = `🎉 <strong>Livrare gratuită</strong>!`; msgArea.style.background = '#dcfce7'; msgArea.style.color = '#166534'; }
        }
    };

    // Ascultător Centralizat - Actualizează sidebar-ul și injectează butoanele noi în meniu
    window.addEventListener('cartUpdated', () => { 
        if (typeof updateCartUI === 'function') updateCartUI(); 
        if (typeof syncMenuButtons === 'function') syncMenuButtons();
    });
    
    updateCartUI();

    // Pop-up Manual din "X"
    const popup = document.getElementById('newsletter-popup');
    const closePopupBtn = document.getElementById('close-popup');
    
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            popup.classList.remove('show');
            localStorage.setItem('newsletter_shown', 'true');
        });
    }
});
