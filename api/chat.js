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

        const currentMenu = body.currentMenu || "Meniul este momentan indisponibil.";
        const storeRules = body.storeRules || "Regulile logistice nu sunt configurate.";

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) return res.status(500).json({ error: "Cheia OPENROUTER_API_KEY lipsește din Vercel." });

        const PHONE_NUMBER = "40700000000"; // Înlocuiește cu numărul tău real

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual inteligent pentru comenzi al restaurantului Di'vino din Brașov. Răspunzi politicos, prietenos și concis în limba română.

INTERDICȚII STRICTE DE FORMATARE:
- NU folosi sub nicio formă caractere Markdown: fără steluțe (** sau *), fără diez (#), fără liniuțe de listă sau paranteze ciudate.
- Scrie doar text simplu, cursiv și curat, ușor de citit.

DATE MENIU REALE ȘI ACTUALE:
${currentMenu}

REGULI CRITICE PRIVIND PREȚURILE ȘI OFERTELE:
1. Prețurile din lista de mai sus sunt PREȚURILE FINALE DE PLATĂ. Nu face niciun fel de scădere sau calcul matematic. Spune exact prețul specificat în listă.
2. Dacă un preparat are mențiunea [PROMO: 1+1 GRATIS], explică-i clientului că la fiecare produs comandat primește încă unul gratuit din partea casei.
3. Oferă clienților doar preparatele existente în lista de mai sus. Dacă cer ceva inexistent, anunță-i politicos că nu se află în meniu.

REGULI LOGISTICE:
${storeRules}

FLUXUL CONVERSAȚIEI:
1. Răspunde direct la întrebările clientului despre meniu, ingrediente sau oferte. Nu cere adresa sau metoda de plată la începutul discuției.
2. Doar atunci când clientul este hotărât și finalizează comanda, solicită detaliile necesare: livrare la adresă sau ridicare personală, mențiuni pentru bucătărie și metoda de plată.

COMANDA RAPIDĂ ÎN COȘ:
Când clientul solicită să îi pui în coș sau să comande un produs existent, adaugă la sfârșitul mesajului tău comanda specială: [ADAUGA: Nume_Produs].
Exemplu: [ADAUGA: Shaorma pui]
În mesajul tău informează-l: "Am adăugat produsul în coșul tău de pe site. Poți verifica coșul oricând pentru a plasa comanda."

BUTONUL WHATSAPP:
După ce comanda este stabilită complet, include butonul dedicat:
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
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [systemPrompt, ...userMessages],
                temperature: 0.3
            })
        });

        const data = await response.json();
        if (!response.ok || data.error) {
            return res.status(500).json({ error: data.error?.message || "Eroare OpenRouter" });
        }

        let rawReply = data.choices?.[0]?.message?.content || "Nu am putut procesa răspunsul.";

        // Eliminăm automat orice steluță sau formatare markdown nedorită
        const cleanReply = rawReply
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s?/g, '');

        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        return res.status(500).json({ error: `Eroare internă: ${error.message}` });
    }
}
