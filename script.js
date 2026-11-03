// Navigare SPA
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Chatbot UI Toggle
const toggleChat = document.getElementById('toggle-chat');
const chatWindow = document.getElementById('chat-window');

toggleChat.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    toggleChat.innerHTML = chatWindow.classList.contains('hidden') 
        ? '<i class="fas fa-chevron-up"></i>' 
        : '<i class="fas fa-chevron-down"></i>';
});

// Chatbot Simplificat (Fără API)
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    userInput.value = '';
    
    // Răspuns automat instantaneu, fără erori de rețea
    setTimeout(() => {
        addMessage("Salut! Momentan preluăm comenzi și răspundem la întrebări doar telefonic la 0700 000 000. Te așteptăm cu drag!", 'bot');
    }, 800);
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});
