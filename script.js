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

    // ==========================================
    // LOGICA AI CHATBOT CONECTAT LA VERCEL
    // ==========================================
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatLogs = document.getElementById('chat-logs');
    let messageHistory = []; // Istoricul discutiei

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        // 1. Afisam mesajul utilizatorului
        chatLogs.innerHTML += `<div class="msg user">${text}</div>`;
        chatInput.value = '';
        chatLogs.scrollTop = chatLogs.scrollHeight; // scroll jos

        // 2. Salvam in istoric
        messageHistory.push({ role: "user", content: text });

        // 3. Indicator de incarcare
        const loadingId = 'load-' + Date.now();
        chatLogs.innerHTML += `<div id="${loadingId}" class="msg bot" style="color:#64748b;"><i class="fas fa-ellipsis-h fa-fade"></i> Se procesează...</div>`;
        chatLogs.scrollTop = chatLogs.scrollHeight;

        try {
            // 4. Trimitem catre Vercel (api/chat.js)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messageHistory })
            });
            const data = await response.json();
            
            // Stergem loader-ul
            document.getElementById(loadingId).remove();
            
            if (data.reply) {
                // Afisam raspunsul AI-ului (interpretam line breaks)
                chatLogs.innerHTML += `<div class="msg bot">${data.reply.replace(/\n/g, '<br>')}</div>`;
                messageHistory.push({ role: "assistant", content: data.reply });
            } else {
                chatLogs.innerHTML += `<div class="msg bot" style="color:red;">Eroare de la asistent. Încearcă din nou.</div>`;
            }
            chatLogs.scrollTop = chatLogs.scrollHeight;
        } catch (err) {
            document.getElementById(loadingId).remove();
            chatLogs.innerHTML += `<div class="msg bot" style="color:red;">Eroare de conexiune server.</div>`;
            chatLogs.scrollTop = chatLogs.scrollHeight;
        }
    }
    
    if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
    if (chatInput) chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });
    // ==========================================


    // Coș Lateral Toggle
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnOpenCart = document.getElementById('cart-icon-btn');
    const btnCloseCart = document.getElementById('close-cart');
    
    if (btnOpenCart) btnOpenCart.addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
    if (btnCloseCart) btnCloseCart.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });
    if (cartOverlay) cartOverlay.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });

    // Functie Universala de Schimbare Cantitate (+ / -)
    window.changeQtyDB = function(id, change) {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const index = cart.findIndex(i => i.id === id);
        if (index !== -1) {
            cart[index].quantity += change;
            if (cart[index].quantity <= 0) cart.splice(index, 1);
            localStorage.setItem('divino_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated')); 
        }
    };

    // Adaugare Produs cu Animatie rotativa
    window.addToCartDB = function(id, name, price, is1plus1, btnElement) {
        if (typeof storeIsOpen !== 'undefined' && !storeIsOpen) return alert("Magazinul este momentan închis!");
        
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        cart.push({ id: id, name: name, price: parseFloat(price), quantity: 1, is1plus1: is1plus1 === 'true' });
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        
        // Animatia Verde
        if (btnElement) {
            btnElement.classList.add('spin-green');
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                window.dispatchEvent(new Event('cartUpdated')); // Dupa 600ms, il transformam in [-] 1 [+]
            }, 600);
        } else {
             window.dispatchEvent(new Event('cartUpdated'));
        }

        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

    // Injectarea [-] [+] in interiorul cardului (Fara a reincarca imaginea)
    window.syncMenuButtons = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        if (window.dbProductsList) {
            window.dbProductsList.forEach(p => {
                const btnContainer = document.getElementById(`action-btn-${p.id}`);
                if (btnContainer) {
                    const itemInCart = cart.find(i => i.id === p.id);
                    if (itemInCart) {
                        btnContainer.innerHTML = `
                            <div class="cart-controls-inline">
                                <button onclick="changeQtyDB('${p.id}', -1)" class="btn-qty">-</button>
                                <span class="inline-qty">${itemInCart.quantity}</span>
                                <button onclick="changeQtyDB('${p.id}', 1)" class="btn-qty">+</button>
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

    // Randare Coș Lateral
    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const container = document.getElementById('cart-items');
        let totalItems = 0, totalPrice = 0;
        
        if (container) {
            container.innerHTML = '';
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:50px 20px;"><i class="fas fa-shopping-basket" style="font-size:3.5rem; color:#cbd5e1; margin-bottom:20px;"></i><p style="color:#64748b; font-weight:600; font-family:\'Plus Jakarta Sans\', sans-serif;">Coșul este gol.</p></div>';
            } else {
                cart.forEach((item) => {
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
                                <button onclick="changeQtyDB('${item.id}', -1)">-</button>
                                <span style="font-weight:800; width:22px; text-align:center; font-family:\'Plus Jakarta Sans\', sans-serif;">${item.quantity}</span>
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

    // Asculta modificarile globale din site si refoloseste logica de update UI
    window.addEventListener('cartUpdated', () => { 
        if (typeof updateCartUI === 'function') updateCartUI(); 
        if (typeof syncMenuButtons === 'function') syncMenuButtons();
    });
    
    updateCartUI();

    // Pop-up Manual Newsletter
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
