export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Doar cereri POST sunt permise' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }

        const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
        const userMessages = rawMessages.filter(m => m && m.role && m.content);

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) {
            return res.status(500).json({ error: "Cheia OPENROUTER_API_KEY lipsește din Vercel." });
        }

        const PHONE_NUMBER = "40799582300"; // <-- Pune numărul tău real (cu 40 în față)

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino.
Răspunzi politicos, scurt și clar în limba română.

MENIU ȘI INGREDIENTE:
1. Falafel la lipie (420g) - 36,00 lei
   Ingrediente: chifteluțe de năut, cartofi prăjiți, salate și sosuri la alegere, lipie.
2. Vită cu Orez (600g) - 57,00 lei [NOU]
   Ingrediente: Carne rotisată Vită+Berbecuț, orez basmati, salată roșii, ceapă roșie, pătrunjel, sos rodie, lipie.
3. Shaorma la Farfurie (800g) - 50,00 lei
   Ingrediente: Carne rotisată pui, cartofi prăjiți, salate și sosuri, lipie.
4. Doner Kebab (570g) - 39,00 lei
   Ingrediente: Carne rotisată pui, cartofi prăjiți, salate, sosuri, chiflă coaptă pe vatră.
5. Pizza Margherita (400g) - 36,00 lei
   Ingrediente: Sos de roșii San Marzano, mozzarella, busuioc, parmezan. (NU are carne).
6. Pizza Diavola (450g) - 43,00 lei
   Ingrediente: Sos de roșii, mozzarella fior di latte, salam picant, ulei măsline.

METODE DE PLATĂ ACCEPTATE:
- Numerar (Cash) la livrare.
- Card bancar (Visa / Mastercard) prin POS mobil la livrare.
- Carduri de masă: DOAR card de masă EDENRED (prin POS mobil).
- IMPORTANT: NU acceptăm alte tichete sau carduri de masă (NU acceptăm Sodexo/Pluxee sau Up Dejun). Dacă clientul întreabă de alt card de masă, anunță-l politicos că acceptăm exclusiv Edenred.

FLUXUL DE PRELUARE COMANDĂ:
1. Când clientul cere produse sau modificări (ex: "fără ceapă", "fără sos", "extra picant"), confirmă modificările.
2. Înainte de finalizare, solicită-i ADRESA completă de livrare și METODA DE PLATĂ dorită (Cash, Card sau Edenred).
3. Imediat ce ai produsele, modificările, adresa și metoda de plată, calculează totalul și încheie mesajul OBLIGATORIU cu următorul format de link (înlocuind textul dintre paranteze cu datele reale codate URL):
<a href="https://wa.me/${PHONE_NUMBER}?text=Comanda%20Di%27vino:%0A-Produse:%20[PRODUSE_SI_MODIFICARI]%0A-Total:%20[TOTAL]%20Lei%0A-Plata:%20[METODA_PLATA]%0A-Adresa:%20[ADRESA]" target="_blank" class="order-btn-wa">Trimite comanda pe WhatsApp</a>`
        };

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://vercel.app",
                "X-Title": "Divino Assistant"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [systemPrompt, ...userMessages]
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            const errDetail = data.error?.message || `Eroare OpenRouter status ${response.status}`;
            return res.status(500).json({ error: errDetail });
        }

        const reply = data.choices?.[0]?.message?.content || "Nu am primit un răspuns text de la AI.";
        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: `Eroare internă server: ${error.message}` });
    }
}
