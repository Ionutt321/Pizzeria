document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
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

    const parallaxBg = document.querySelector('.hero-bg');
    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        if(parallaxBg) {
            parallaxBg.style.transform = `translateY(${scrollY * 0.4}px)`;
        }
    });

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

    function analyzeMessage(text) {
        const msg = text.toLowerCase();
        if (msg.includes("falafel") || msg.includes("kebab") || msg.includes("vita") || msg.includes("shaorma")) {
            return "Preparatele din secțiunea Donner Kebab sunt delicioase! Falafelul (36 lei) vine cu cartofi, iar Shaorma (50 lei) are un gramaj de 800g. Ce dorești să comanzi?";
        }
        if (msg.includes("livrare") || msg.includes("glovo") || msg.includes("wolt")) {
            return "Livrăm rapid prin platformele noastre partenere (Glovo, Wolt, Bolt Food). Ai linkurile chiar mai jos pe site!";
        }
        if (msg.includes("salut") || msg.includes("buna")) {
            return "Salut! Te ajut cu o recomandare din noile noastre preparate Kebab?";
        }
        return "Am înțeles! Dacă vrei să comanzi, folosește butoanele de livrare de mai jos sau sună-ne direct la 0700 000 000.";
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
            botMsg.textContent = analyzeMessage(text);
            chatLogs.appendChild(botMsg);
            chatLogs.scrollTop = chatLogs.scrollHeight;
        }, 600);
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
