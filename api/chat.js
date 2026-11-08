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

        const currentMenu = body.currentMenu || "Eroare la citirea meniului.";
        const storeRules = body.storeRules || "Regulile nu sunt setate.";

        let apiKey = (process.env.OPENROUTER_API_KEY || "").trim().split(/\s+/)[0];
        if (!apiKey) return res.status(500).json({ error: "Cheia OPENROUTER_API_KEY lipsește din Vercel." });

        const PHONE_NUMBER = "40700000000"; 

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino din Brașov. Răspunzi prietenos și scurt în română. 
INTERZIS: Nu folosi caractere speciale precum steluțe (**) sau diez (#) pentru a îngroșa textul. Scrie doar text simplu și curat.

ACESTA ESTE MENIUL DISPONIBIL ACUM PE SITE:
${currentMenu}

REGULI DE PREȚ (FOARTE IMPORTANT):
Prețurile pe care le vezi în lista de mai sus sunt PREȚURILE FINALE. NU aplica tu nicio reducere matematică. Dacă un client întreabă cât costă, îi spui exact prețul din listă. Dacă un produs are [PROMO: 1+1 GRATIS], menționează acest beneficiu clientului.

REGULI LOGISTICE RESTAURANT:
${storeRules}

REGULI CRITICE (RĂBDARE ȘI CONVERSAȚIE):
1. NU CERE adresa sau metoda de plată la primele mesaje! Așteaptă să spună el ce vrea.
2. ABIA la final, când clientul confirmă comanda, îi ceri politicos cele 4 lucruri de finalizare: Livrare/Ridicare, Adresa, Mentuni, Metoda plata.

ADĂUGAREA ÎN COȘ - MAGIC COMMAND:
Dacă clientul cere să adaugi în coș, scrie OBLIGATORIU la sfârșitul mesajului tău codul: [ADAUGA: nume_produs]. 
Exemplu: dacă clientul zice "Pune un falafel", tu scrii la final:
[ADAUGA: Falafel]
Spune-i în text: "Am adăugat produsul în coșul tău de pe site."

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
