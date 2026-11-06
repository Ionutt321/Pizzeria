export default async function handler(req, res) {
    // Permite conexiuni CORS
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
        // 1. Parsare sigură a mesajelor trimise din chat
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }

        const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
        const userMessages = rawMessages.filter(m => m && m.role && m.content);

        // 2. Verificare cheie API în Vercel
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error("Lipsește OPENROUTER_API_KEY în Vercel Environment Variables!");
            return res.status(500).json({ 
                error: "Cheia OPENROUTER_API_KEY lipsește sau nu a fost salvată în Vercel." 
            });
        }

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual inteligent și prietenos al restaurantului Di'vino.
Răspunzi EXCLUSIV la întrebări despre meniul nostru, ingrediente, prețuri și comenzi. Nu inventa preparate sau ingrediente inexistente.

MENIU EXACT ȘI INGREDIENTE:
1. Falafel la lipie (420g) - 36,00 lei
   Ingrediente: Falafel (chifteluțe de năut), cartofi prăjiți, salate și sosuri la alegere, lipie.
2. Vită cu Orez (600g) - 57,00 lei [NOU]
   Ingrediente: Carne rotisată Vită+Berbecuț, orez basmati, salată roșii, ceapă roșie, pătrunjel, sos rodie, lipie.
3. Shaorma la Farfurie (800g) - 50,00 lei
   Ingrediente: Carne rotisată pui, cartofi prăjiți, salate și sosuri la alegere, lipie.
4. Doner Kebab (570g) - 39,00 lei
   Ingrediente: Carne rotisată pui, cartofi prăjiți, salate și sosuri, chiflă pe vatra cuptorului Di'vino.
5. Pizza Margherita (400g) - 36,00 lei
   Ingrediente: Sos de roșii San Marzano, mozzarella, busuioc proaspăt, parmezan. (NU conține carne sau șuncă!).
6. Pizza Diavola (450g) - 43,00 lei
   Ingrediente: Sos de roșii, mozzarella fior di latte, salam picant, ulei de măsline.

REGULI IMPORTANTE:
- Dacă un client cere modificări (ex: "fără cașcaval/mozzarella", "fără ceapă", "extra sos"), confirmă politicos modificarea.
- Când clientul se decide ce vrea să comande, cere-i adresa de livrare și calculează totalul.
- Răspunde concis, cald și la obiect în limba română.`
        };

        // 3. Apel către modelul gratuit OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey.trim()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://vercel.app",
                "X-Title": "Divino Assistant"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [systemPrompt, ...userMessages]
            })
        });

        const data = await response.json();
        console.log("Status OpenRouter:", response.status, data);

        if (!response.ok || data.error) {
            const errDetail = data.error?.message || `Eroare OpenRouter status ${response.status}`;
            console.error("OpenRouter a respins cererea:", errDetail);
            return res.status(500).json({ error: errDetail });
        }

        const reply = data.choices?.[0]?.message?.content || "Nu am primit un răspuns text de la AI.";
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Eroare funcție serverless:", error);
        return res.status(500).json({ error: `Eroare internă server: ${error.message}` });
    }
}
