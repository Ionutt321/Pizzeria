export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Doar cereri POST sunt permise' });

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }

        const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
        const userMessages = rawMessages.filter(m => m && m.role && m.content);

        // Preia datele de la script.js (ofertele reale și regulile logistice)
        const currentMenu = body.currentMenu || "Eroare la citirea meniului.";
        const storeRules = body.storeRules || "Regulile nu sunt setate.";

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) return res.status(500).json({ error: "Cheia OPENROUTER_API_KEY lipsește din Vercel." });

        const PHONE_NUMBER = "40700000000"; 

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino din Brașov. Răspunzi prietenos și scurt în română.

ACESTA ESTE MENIUL DISPONIBIL ACUM PE SITE (cu tot cu oferte 1+1 sau Reduceri, dacã existã):
${currentMenu}

REGULI LOGISTICE RESTAURANT:
${storeRules}

Dacă clientul întreabă de oferte, promoții sau reduceri, citește meniul de mai sus și spune-i strict produsele care au eticheta [PROMO: 1+1 GRATIS] sau [REDUCERE]. Răspunde-i și la întrebări despre cât costă livrarea folosind regulile logistice. Nu inventa oferte care nu apar în textul de mai sus.

REGULI CRITICE (RĂBDARE ȘI CONVERSAȚIE):
1. NU CERE adresa sau metoda de plată la primele mesaje! Așteaptă să spună el ce vrea.
2. ABIA la final, când clientul confirmă comanda, îi ceri politicos cele 4 lucruri de finalizare.

ADĂUGAREA ÎN COȘ - MAGIC COMMAND:
Dacă clientul îți cere să îi "pui în coș", "adaugă", sau "vreau o...", trebuie SĂ SCRII OBLIGATORIU la sfârșitul mesajului tău codul: [ADAUGA: nume_produs]. 
Exemplu: dacă clientul zice "Pune un falafel", tu scrii la final:
[ADAUGA: Falafel]
*Spune-i în textul normal:* "Am pregătit produsul! L-am adăugat în coșul tău de pe site de unde poți finaliza."

BUTON WHATSAPP:
Când aveți toate detaliile finale, generează butonul:
<a href="https://wa.me/${PHONE_NUMBER}?text=Comanda%20Di%27vino:%0A-Produse:%20[PRODUSE]%0A-Mentiuni:%20[COMENTARII]%0A-Plata:%20[METODA_PLATA]%0A-Livrare/Ridicare:%20[ADRESA]" target="_blank" class="btn-primary" style="display:inline-block; padding:10px 20px; text-decoration:none; margin-top:10px; border-radius:20px;">Trimite comanda pe WhatsApp</a>`
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://vercel.app",
                "X-Title": "Divino Assistant"
            },
            body: JSON.stringify({ model: "openrouter/free", messages: [systemPrompt, ...userMessages] })
        });

        const data = await response.json();
        if (!response.ok || data.error) return res.status(500).json({ error: data.error?.message || "Eroare OpenRouter" });

        const reply = data.choices?.[0]?.message?.content || "Eroare AI.";
        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: `Eroare internă: ${error.message}` });
    }
}
