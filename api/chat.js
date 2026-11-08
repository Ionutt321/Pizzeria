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
        if (!apiKey) {
            return res.status(200).json({ reply: "⚠️ Cheia OPENROUTER_API_KEY lipsește din Vercel (Settings -> Environment Variables)." });
        }

        const PHONE_NUMBER = "40700000000";

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino din Brașov. Răspunzi politicos, prietenos și scurt în limba română.

REGULI STRICTE DE FORMATARE:
- NU folosi sub nicio formă caractere Markdown: fără steluțe (** sau *), fără diez (#), fără ghilimele speciale. Scrie doar text simplu, curat și cursiv.

MENIU REAL ȘI ACTUAL:
${currentMenu}

REGULI PRIVIND PREȚURILE:
- Prețurile din lista de mai sus sunt PREȚURILE FINALE. NU face calcule și NU aplica reduceri suplimentare! Dacă clientul întreabă cât costă, spune-i exact prețul specificat în listă.
- Dacă un produs are mențiunea [PROMO: 1+1 GRATIS], explică-i că la fiecare produs comandat primește încă unul gratuit din partea casei.
- Oferă doar preparate din meniul de mai sus. Dacă se solicită ceva inexistent, anunță politicos că nu este disponibil în meniu.

REGULI LOGISTICE:
${storeRules}

CONVERSAȚIE:
- Răspunde direct și scurt la ce te întreabă clientul. NU cere adresa sau metoda de plată la începutul discuției!
- Doar la final, când clientul confirmă comanda, cere-i: Livrare sau Ridicare, Adresa, Mențiuni și Metoda de plată.

ADĂUGARE ÎN COȘ:
Când clientul cere să adaugi un preparat existent în coș (ex: "pune un falafel", "vreau o shaorma"), scrie OBLIGATORIU la sfârșitul mesajului comanda: [ADAUGA: Nume_Produs].
Exemplu: "Am adăugat produsul în coșul tău de pe site. [ADAUGA: Shaorma pui]"

BUTON WHATSAPP:
Când comanda este stabilită complet cu toate detaliile, generează butonul:
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
                model: "openrouter/free",
                messages: [systemPrompt, ...userMessages],
                temperature: 0.2
            })
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
            return res.status(200).json({ reply: `⚠️ Eroare OpenRouter: ${data.error?.message || "Serviciul gratuit este temporar ocupat. Te rog reîncearcă."}` });
        }

        let rawReply = data.choices?.[0]?.message?.content || "Nu am putut genera un răspuns.";

        // Eliminăm automat orice steluță sau formatare markdown
        const cleanReply = rawReply
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s?/g, '')
            .replace(/`/g, '');

        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        return res.status(200).json({ reply: `⚠️ Eroare server: ${error.message}` });
    }
}
