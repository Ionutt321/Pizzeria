self.addEventListener('install', (e) => {
    console.log('[Service Worker] Aplicația a fost instalată.');
});

self.addEventListener('fetch', (e) => {
    // Lasă Vercel și OpenRouter să funcționeze normal
});
