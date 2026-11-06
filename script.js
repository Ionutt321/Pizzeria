document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Navbar Glassmorphism la Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // 2. Animații la Scroll (Intersection Observer)
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

    // 3. Efect Parallax pe Hero
    const parallaxBg = document.querySelector('.hero-bg');
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        if (parallaxBg) parallaxBg.style.transform = `translateY(${scrollY * 0.4}px)`;
    });

    // 4. Efect 3D TILT pe Cardurile Meniului
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

    // 5. Comutare Tab-uri (Meniu)
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

    // 6. Asistent AI Conectat la Serverless API (Vercel + OpenRouter)
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

    // Istoricul conversației pentru memoria AI
    let conversationHistory = [];

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Afișează mesajul trimis de utilizator
        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.textContent = text;
        chatLogs.appendChild(userMsg);
        
        chatInput.value = '';
        chatLogs.scrollTop = chatLogs.scrollHeight;

        // Adaugă mesajul în istoric
        conversationHistory.push({ role: "user", content: text });

        // Indicator de încărcare
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
            const replyText = data.reply || "Nu am primit un răspuns clar de la asistent.";
            
            loadingMsg.textContent = replyText;
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
});
