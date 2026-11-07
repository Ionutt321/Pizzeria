document.addEventListener("DOMContentLoaded", () => {
    
    // Animații și UI de bază
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const revealElements = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealElements.forEach(el => revealObserver.observe(el));

    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        const inner = card.querySelector('.card-inner');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;
            inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            inner.style.boxShadow = `${-rotateY}px ${rotateX}px 30px rgba(0,0,0,0.15)`;
        });
        card.addEventListener('mouseleave', () => {
            inner.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
            inner.style.boxShadow = `0 10px 40px rgba(0,0,0,0.06)`;
        });
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // SISTEM DE COȘ (CART)
    let cart = JSON.parse(localStorage.getItem('divino_cart')) || [];
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    function updateCartUI() {
        let totalItems = 0;
        let totalPrice = 0;
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty">Coșul este gol.</p>';
        } else {
            cart.forEach((item, index) => {
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
                
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price.toFixed(2)} lei</p>
                    </div>
                    <div class="cart-controls">
                        <button onclick="changeQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }

        cartCount.textContent = totalItems;
        cartTotalPrice.textContent = `${totalPrice.toFixed(2)} lei`;
        localStorage.setItem('divino_cart', JSON.stringify(cart));
    }

    // Funcție pentru butoanele de + și - din coș
    window.changeQuantity = function(index, change) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        updateCartUI();
    };

    // Adaugă produs în coș (FĂRĂ să mai deschidă meniul lateral)
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            
            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ name, price, quantity: 1 });
            }
            
            updateCartUI();
            
            // Efect vizual pe iconița de coș
            cartIconBtn.style.transform = 'scale(1.2)';
            setTimeout(() => { cartIconBtn.style.transform = 'scale(1)'; }, 200);
        });
    });

    // Deschidere/Închidere Sidebar strict la apăsarea butonului de coș
    cartIconBtn.addEventListener('click', () => {
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

    // Checkout
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return alert("Coșul este gol!");
        alert("Aici se va deschide pagina albă securizată Stripe Checkout.");
    });

    // Inițializare coș la încărcarea paginii
    updateCartUI();

    // Chatbot AI Setup
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatIcon = document.getElementById('chat-icon');
    
    if (chatToggle && chatWindow) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (chatIcon) {
                chatIcon.className = chatWindow.classList.contains('hidden') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            }
        });
    }

    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatLogs = document.getElementById('chat-msgs');
    let conversationHistory = [];

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.textContent = text;
        chatLogs.appendChild(userMsg);
        
        chatInput.value = '';
        chatLogs.scrollTop = chatLogs.scrollHeight;
        conversationHistory.push({ role: "user", content: text });

        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'msg bot';
        loadingMsg.textContent = "Se procesează...";
        chatLogs.appendChild(loadingMsg);
        chatLogs.scrollTop = chatLogs.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory })
            });
            const data = await response.json();
            const replyText = data.reply || data.error || "Nu am primit un răspuns.";
            
            let formattedHtml = replyText
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            loadingMsg.innerHTML = formattedHtml;
            conversationHistory.push({ role: "assistant", content: replyText });
        } catch (err) {
            loadingMsg.textContent = "A apărut o eroare de conexiune cu serverul AI.";
        }
        chatLogs.scrollTop = chatLogs.scrollHeight;
    }

    if (chatSend && chatInput) {
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // --- Logica pentru Pop-up Newsletter ---
    const popup = document.getElementById('newsletter-popup');
    const closePopupBtn = document.getElementById('close-popup');
    const popupForm = document.getElementById('popup-form');

    if (popup && !localStorage.getItem('newsletter_shown')) {
        setTimeout(() => {
            popup.classList.add('show');
        }, 4000); // Apare după 4 secunde
    }

    function hideAndRememberPopup(e) {
        if (e) e.preventDefault();
        popup.classList.remove('show');
        localStorage.setItem('newsletter_shown', 'true');
    }

    if (closePopupBtn) closePopupBtn.addEventListener('click', hideAndRememberPopup);
    if (popupForm) popupForm.addEventListener('submit', hideAndRememberPopup);

});
