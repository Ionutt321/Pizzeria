document.addEventListener("DOMContentLoaded", () => {
    
    // Navbar Scroll Effect
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

    // Functie Adaugare in Cos (Animatia Originala, fara re-randare)
    window.addToCartDB = function(id, name, price, is1plus1, btnElement) {
        if (typeof storeIsOpen !== 'undefined' && !storeIsOpen) return alert("Magazinul este momentan închis!");
        
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const item = cart.find(i => i.id === id);
        
        if (item) item.quantity += 1;
        else cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1, is1plus1: is1plus1 === 'true' });
        
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        
        // Animația Verde de Rotire
        if (btnElement) {
            btnElement.classList.add('spin-green');
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btnElement.classList.remove('spin-green');
                btnElement.innerHTML = '<i class="fas fa-plus"></i>';
            }, 800);
        }

        // Anunțăm DOAR coșul lateral să se actualizeze
        window.dispatchEvent(new Event('cartUpdated'));

        // Efect Pungă de Sus
        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

    // Modificare cantitate direct din Sidebar-ul coșului (Plus și Minus)
    window.changeQtySidebar = function(index, change) {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        cart[index].quantity += change;
        if(cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // Randare vizuală DOAR pentru Coșul Lateral
    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const container = document.getElementById('cart-items');
        let totalItems = 0, totalPrice = 0;
        
        if (container) {
            container.innerHTML = '';
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:50px 20px;"><i class="fas fa-shopping-basket" style="font-size:3.5rem; color:#cbd5e1; margin-bottom:20px;"></i><p style="color:#64748b; font-weight:600; font-family:\'Plus Jakarta Sans\', sans-serif;">Coșul este gol.</p></div>';
            } else {
                cart.forEach((item, index) => {
                    totalItems += item.quantity;
                    totalPrice += item.price * item.quantity;
                    const giftHTML = item.is1plus1 ? `<div style="color:var(--success); font-size:0.85rem; font-weight:800; margin-top:5px; font-family:\'Plus Jakarta Sans\', sans-serif;"><i class="fas fa-gift"></i> +${item.quantity} produs(e) GRATIS</div>` : '';

                    container.innerHTML += `
                        <div class="cart-item">
                            <div style="flex:1;">
                                <h4>${item.name}</h4>
                                <p style="color:var(--primary); font-weight:800; font-family:\'Cinzel\', serif; font-size:1.1rem;">${(item.price * item.quantity).toFixed(2)} lei</p>
                                ${giftHTML}
                            </div>
                            <div class="cart-controls">
                                <button onclick="changeQtySidebar(${index}, -1)">-</button>
                                <span style="font-weight:800; width:22px; text-align:center; font-family:\'Plus Jakarta Sans\', sans-serif;">${item.quantity}</span>
                                <button onclick="changeQtySidebar(${index}, 1)">+</button>
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

    window.addEventListener('cartUpdated', () => { 
        if (typeof updateCartUI === 'function') updateCartUI(); 
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
