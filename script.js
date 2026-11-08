document.addEventListener("DOMContentLoaded", () => {
    
    const navbar = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }
    });

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

    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatLogs = document.getElementById('chat-logs');
    let messageHistory = []; 

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        chatLogs.innerHTML += `<div class="msg user">${text}</div>`;
        chatInput.value = '';
        chatLogs.scrollTop = chatLogs.scrollHeight; 

        messageHistory.push({ role: "user", content: text });

        const loadingId = 'load-' + Date.now();
        chatLogs.innerHTML += `<div id="${loadingId}" class="msg bot" style="color:#64748b;"><i class="fas fa-ellipsis-h fa-fade"></i> Se procesează...</div>`;
        chatLogs.scrollTop = chatLogs.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messageHistory })
            });
            const data = await response.json();
            
            document.getElementById(loadingId).remove();
            
            if (data.reply) {
                let botReply = data.reply.replace(/\n/g, '<br>');
                chatLogs.innerHTML += `<div class="msg bot">${botReply}</div>`;
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

    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnOpenCart = document.getElementById('cart-icon-btn');
    const btnCloseCart = document.getElementById('close-cart');
    
    if (btnOpenCart) btnOpenCart.addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
    if (btnCloseCart) btnCloseCart.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });
    if (cartOverlay) cartOverlay.addEventListener('click', () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); });

    // Funcția care scoate produsele fantezie din coș dacă nu mai sunt în DB
    window.validateCart = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        let validCart = [];
        let changed = false;
        
        if (window.dbProductsList && window.dbProductsList.length > 0) {
            cart.forEach(item => {
                const exists = window.dbProductsList.find(p => p.id === item.id);
                if (exists) validCart.push(item);
                else changed = true;
            });
            if (changed) localStorage.setItem('divino_cart', JSON.stringify(validCart));
        }
    };

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

    window.addToCartDB = function(id, name, price, is1plus1, btnElement) {
        if (typeof storeIsOpen !== 'undefined' && !storeIsOpen) return alert("Magazinul este momentan închis!");
        
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        cart.push({ id: id, quantity: 1 }); // Salvăm strict ID-ul și cantitatea
        localStorage.setItem('divino_cart', JSON.stringify(cart));
        
        if (btnElement) {
            btnElement.classList.add('spin-green');
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { window.dispatchEvent(new Event('cartUpdated')); }, 600);
        } else {
             window.dispatchEvent(new Event('cartUpdated'));
        }

        const cartIcon = document.getElementById('cart-icon-btn');
        if (cartIcon) {
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }
    };

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

    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
        const container = document.getElementById('cart-items');
        
        let totalItems = 0;
        let subtotalOriginal = 0; // Preț întreg (fără reducerea pe produs)
        let subtotalDiscounted = 0; // Preț redus (de vânzare actual)
        
        if (container) {
            container.innerHTML = '';
            if (cart.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:50px 20px;"><i class="fas fa-shopping-basket" style="font-size:3.5rem; color:#cbd5e1; margin-bottom:20px;"></i><p style="color:#64748b; font-weight:600; font-family:\'Plus Jakarta Sans\', sans-serif;">Coșul este gol.</p></div>';
            } else {
                cart.forEach((item) => {
                    const dbItem = window.dbProductsList ? window.dbProductsList.find(p => p.id === item.id) : null;
                    
                    if (dbItem) {
                        totalItems += item.quantity;
                        const itemPrice = dbItem.price;
                        const itemOriginalPrice = dbItem.originalPrice || dbItem.price;
                        
                        subtotalOriginal += (itemOriginalPrice * item.quantity);
                        subtotalDiscounted += (itemPrice * item.quantity);
                        
                        const hasDiscount = itemOriginalPrice > itemPrice;
                        const priceHTML = hasDiscount 
                            ? `<s style="color:#94a3b8; font-size:0.9rem; margin-right:5px;">${(itemOriginalPrice * item.quantity).toFixed(2)}</s> <span style="color:var(--danger); font-weight:800;">${(itemPrice * item.quantity).toFixed(2)} lei</span>`
                            : `<span style="color:var(--primary); font-weight:800;">${(itemPrice * item.quantity).toFixed(2)} lei</span>`;

                        const is1Plus1 = (dbItem.onePlusOne === true || String(dbItem.onePlusOne).toLowerCase() === 'true');
                        const giftHTML = is1Plus1
                            ? `<div style="color:var(--success); font-size:0.85rem; font-weight:800; margin-top:5px; font-family:\'Plus Jakarta Sans\', sans-serif;"><i class="fas fa-gift"></i> +${item.quantity} produs(e) GRATIS</div>` 
                            : '';

                        container.innerHTML += `
                            <div class="cart-item">
                                <div style="flex:1;">
                                    <h4>${dbItem.name}</h4>
                                    <div style="font-family:'Cinzel', serif; font-size:1.1rem; margin-top:3px;">
                                        ${priceHTML}
                                    </div>
                                    ${giftHTML}
                                </div>
                                <div class="cart-controls">
                                    <button onclick="changeQtyDB('${item.id}', -1)">-</button>
                                    <span style="font-weight:800; width:22px; text-align:center; font-family:\'Plus Jakarta Sans\', sans-serif;">${item.quantity}</span>
                                    <button onclick="changeQtyDB('${item.id}', 1)">+</button>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        }
        
        // Calcul Costuri Livrare și Total
        const deliveryCost = window.DELIVERY_COST !== undefined ? parseFloat(window.DELIVERY_COST) : 15;
        const threshold = window.FREE_DELIVERY_THRESHOLD !== undefined ? parseFloat(window.FREE_DELIVERY_THRESHOLD) : 100;
        
        let finalDelivery = deliveryCost;
        let deliverySavings = 0;
        
        if (subtotalDiscounted >= threshold && subtotalDiscounted > 0) {
            finalDelivery = 0;
            deliverySavings = deliveryCost;
        } else if (subtotalDiscounted === 0) {
            finalDelivery = 0; // Coș gol
        }
        
        const totalToPay = subtotalDiscounted + finalDelivery;
        const productSavings = subtotalOriginal - subtotalDiscounted;
        const totalSavings = productSavings + deliverySavings;
        
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = totalItems;
        
        const msgArea = document.getElementById('free-delivery-msg');
        if (msgArea) {
            const diff = threshold - subtotalDiscounted;
            if (subtotalDiscounted === 0) { 
                msgArea.style.display = 'none'; 
            } else if (diff > 0) { 
                msgArea.style.display = 'block';
                msgArea.innerHTML = `Mai adaugă <strong>${diff.toFixed(2)} lei</strong> pt. livrare gratuită!`; 
                msgArea.style.background = '#e0f2fe'; msgArea.style.color = '#0369a1'; 
            } else { 
                msgArea.style.display = 'block';
                msgArea.innerHTML = `🎉 <strong>Livrare gratuită</strong>! Ai economisit ${deliveryCost.toFixed(2)} lei.`; 
                msgArea.style.background = '#dcfce7'; msgArea.style.color = '#166534'; 
            }
        }

        // Randează tot bonul detaliat în footer-ul coșului
        const totalsContainer = document.getElementById('cart-totals-area');
        if (totalsContainer) {
            totalsContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem; color:#64748b;">
                    <span>Subtotal produse:</span>
                    <span>${subtotalOriginal.toFixed(2)} lei</span>
                </div>
                ${productSavings > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem; color:var(--danger); font-weight:bold;">
                    <span>Reduceri produse:</span>
                    <span>-${productSavings.toFixed(2)} lei</span>
                </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.95rem; color:#64748b;">
                    <span>Cost livrare:</span>
                    <span style="${finalDelivery === 0 && subtotalDiscounted > 0 ? 'text-decoration:line-through; color:var(--success); font-weight:bold;' : ''}">${deliveryCost.toFixed(2)} lei</span>
                </div>
                ${totalSavings > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:0.95rem; color:var(--success); font-weight:800; border-bottom:1px solid var(--border); padding-bottom:10px;">
                    <span>Total economisit:</span>
                    <span>${totalSavings.toFixed(2)} lei</span>
                </div>
                ` : '<div style="border-bottom:1px solid var(--border); margin-bottom:15px;"></div>'}
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; font-size:1.1rem; color:var(--dark);">Total de plată:</span>
                    <span style="font-size:1.8rem; font-weight:800; font-family:'Cinzel', serif; color:var(--dark);">${totalToPay.toFixed(2)} lei</span>
                </div>
            `;
        }
    };

    window.addEventListener('cartUpdated', () => { 
        if (typeof updateCartUI === 'function') updateCartUI(); 
        if (typeof syncMenuButtons === 'function') syncMenuButtons();
    });
    
    updateCartUI();

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
