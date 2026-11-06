document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Navbar Glassmorphism
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // 2. Animații Scroll
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

    // 3. Efect Parallax
    const parallaxBg = document.querySelector('.hero-bg');
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        if(parallaxBg) parallaxBg.style.transform = `translateY(${scrollY * 0.4}px)`;
    });

    // 4. Efect PREMIUM 3D TILT
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

    // 5. NOU: LOGICA PENTRU TAB-URI (Meniu)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Scoatem clasa active de pe toate butoanele si tab-urile
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adaugam clasa active doar pe ce a apasat clientul
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // 6. ASISTENT AI SMART-CART
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatIcon = document.getElementById('chat-icon');
    
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        chatIcon.className = chatWindow.classList.contains('hidden') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    });

    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatLogs = document.getElementById('chat-msgs');

    const menuDB = [
        { id: 'falafel', keys: ['falafel'], price: 36, name: 'Falafel la lipie' },
        { id: 'vita', keys: ['vita', 'orez'], price: 57, name: 'Vită cu Orez' },
        { id: 'shaorma', keys: ['shaorma', 'șaorma'], price: 50, name: 'Shaorma la Farfurie' },
        { id: 'doner', keys: ['doner', 'kebab'], price: 39, name: 'Doner Kebab' },
        { id: 'margherita', keys: ['margherita'], price: 36, name: 'Pizza Margherita' },
        { id: 'diavola', keys: ['diavola', 'picanta'], price: 43, name: 'Pizza Diavola' }
    ];

    let cart = [];
    let botState = 'IDLE'; 
    const WHATSAPP_NUMBER = "40700000000"; 

    function analyzeMessage(text) {
        const msg = text.toLowerCase();
        if (botState === 'AWAITING_ADDRESS') {
            botState = 'IDLE'; 
            let waText = "Salut! Vreau să comand de la Di'vino:\n\n";
            let total = 0;
            cart.forEach(item => {
                waText += `▪ ${item.name} ${item.mod ? '(' + item.mod + ')' : ''} - ${item.price} Lei\n`;
                total += item.price;
            });
            waText += `\n💰 Total: ${total} Lei\n📍 Adresa: ${text}\n\nTrimite acest mesaj pentru confirmare!`;
            const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
            cart = []; 
            return `Super! Totul e gata. <br><br>👉 <a href="${waLink}" target="_blank" style="display:inline-block; background:#10b981; color:white; padding:8px 15px; border-radius:15px; text-decoration:none; font-weight:bold;">Apasă aici pentru a trimite comanda pe WhatsApp!</a>`;
        }

        if (msg.includes("comand") || msg.includes("gata") || msg.includes("trimite")) {
            if (cart.length === 0) return "Coșul tău este gol. Ce ai vrea să mănânci bun astăzi?";
            botState = 'AWAITING_ADDRESS';
            let total = cart.reduce((sum, item) => sum + item.price, 0);
            return `Ai în coș produse de **${total} Lei**. Te rog să îmi scrii adresa completă de livrare pentru a finaliza!`;
        }

        let currentModifier = "";
        const modMatch = msg.match(/(fără|fara|cu extra)\s+([a-zăâîșț]+)/i);
        if (modMatch) { currentModifier = modMatch[0]; }

        let addedItems = [];
        menuDB.forEach(product => {
            if (product.keys.some(k => msg.includes(k))) {
                cart.push({ name: product.name, price: product.price, mod: currentModifier });
                addedItems.push(product.name);
            }
        });

        if (addedItems.length > 0) {
            let total = cart.reduce((sum, item) => sum + item.price, 0);
            return `Am adăugat: **${addedItems.join(', ')}** ${currentModifier ? '(' + currentModifier + ')' : ''}. <br><br>Total coș: **${total} Lei**.<br>Mai vrei ceva? Când ești gata, scrie "**comandă**".`;
        }

        if (msg.includes("salut") || msg.includes("buna")) return "Salut! Sunt asistentul Di'vino. Spune-mi ce vrei să comanzi (ex: 'vreau o diavola fără ceapă')!";
        if (msg.includes("livrare") || msg.includes("program")) return "Livrăm zilnic între 11:00 și 23:00. Poți comanda direct aici în chat sau pe Glovo/Wolt/Bolt!";
        return "Nu am recunoscut produsul. Poți alege din meniu: Margherita, Diavola, Falafel, Shaorma, Vită cu orez etc. Scrie ce dorești!";
    }

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.textContent = text;
        chatLogs.appendChild(userMsg);
        chatInput.value = '';
        chatLogs.scrollTop = chatLogs.scrollHeight;
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'msg bot';
            botMsg.innerHTML = analyzeMessage(text);
            chatLogs.appendChild(botMsg);
            chatLogs.scrollTop = chatLogs.scrollHeight;
        }, 600);
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
