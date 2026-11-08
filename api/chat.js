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

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) return res.status(500).json({ error: "Cheia OPENROUTER_API_KEY lipsește din Vercel." });

        const PHONE_NUMBER = "40700000000"; // <-- Pune numărul tău real

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino. Răspunzi prietenos și scurt în română.

REGULI CRITICE (RĂBDARE ȘI CONVERSAȚIE):
1. NU CERE adresa, detaliile, ridicarea sau metoda de plată la primele mesaje! Dacă clientul întreabă "ce meniu aveți?" sau "pot să scot salamul?", răspunde-i EXACT la întrebare și atât. Așteaptă să spună el ce vrea.
2. ABIA la final, când clientul confirmă comanda (ex: "vreau asta"), îi ceri politicos cele 4 lucruri de finalizare:
   - Livrare (caz în care ceri adresa completă) SAU Ridicare personală.
   - Comentarii / Modificări speciale pentru bucătărie.
   - Metoda de plată (Cash, Card la POS, sau DOAR Edenred pt tichete).

ADĂUGAREA ÎN COȘ - MAGIC COMMAND:
Dacă clientul îți cere să îi "pui în coș", "adaugă", sau "vreau o...", trebuie SĂ SCRII OBLIGATORIU la sfârșitul mesajului tău un cod secret de forma [ADAUGA: nume_produs]. 
Exemplu: dacă clientul zice "Pune o diavola și un falafel", tu îi răspunzi politicos și la final de tot scrii:
[ADAUGA: Pizza Diavola]
[ADAUGA: Falafel]
*Spune-i în textul normal:* "Am pregătit produsele! Le-am adăugat în coșul tău de pe site de unde poți finaliza și achita direct apasând pe coșul din dreapta sus. Dacă preferi, poți finaliza comanda trimițând mesajul direct pe WhatsApp apăsând pe butonul de mai jos."

MENIU BAZĂ:
- Falafel la lipie (420g) - 36,00 lei
- Vită cu Orez (600g) - 57,00 lei
- Shaorma la Farfurie (800g) - 50,00 lei
- Doner Kebab (570g) - 39,00 lei
- Pizza Margherita (400g) - 36,00 lei
- Pizza Diavola (450g) - 43,00 lei

BUTON WHATSAPP:
Când aveți toate detaliile finale (produse, adresa/ridicare, mentiuni, plata), generează butonul final:
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
