// Navigare SPA (Single Page Application)
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all
        navLinks.forEach(l => l.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked link and corresponding section
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

// Integrare Gemini API
const API_KEY = 'AQ.Ab8RN6IPBZGqd9qJ7_iUsd_LV1kD7JeO0GbGcnoBFmOrygPlJg'; 
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

async function getGeminiResponse(message) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Ești asistentul Pizzeriei Di'vino. Răspunde concis și politicos. " + message }] }]
            })
        });
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        return "Ne cerem scuze, întâmpinăm o problemă tehnică de conectare.";
    }
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    userInput.value = '';
    
    const response = await getGeminiResponse(text);
    addMessage(response, 'bot');
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});