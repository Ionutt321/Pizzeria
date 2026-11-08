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
            return res.status(200).json({ reply: "Cheia OPENROUTER_API_KEY lipsește din setările Vercel." });
        }

        const PHONE_NUMBER = "40700000000";

        const systemPrompt = {
            role: "system",
            content: `Ești asistentul virtual de comenzi al restaurantului Di'vino din Brașov. Răspunzi politicos, prietenos și scurt în limba română.

INTERDICȚII STRICTE DE FORMAT:
- NU folosi niciodată caractere Markdown: fără steluțe (** sau *), fără diez (#), fără ghilimele speciale. Scrie doar text simplu și curat.

MENIUL ACTUAL ȘI OFERTE DISPONIBILE:
${currentMenu}

REGULI PRIVIND PROMOȚIILE ȘI PREȚURILE:
1. Când clientul întreabă de oferte, promoții sau reduceri, răspunde clar și complet:
   - Menționează reducerile de preț active (arată prețul vechi și prețul redus).
   - Menționează preparatele cu oferta 1+1 GRATIS (explică-i că la fiecare bucată comandată, mai primește una gratis).
2. Prețul final de plată este întotdeauna cel redus specificat în listă. Nu inventa alte reduceri sau calcule matematice.
3. Oferă DOAR preparatele existente în lista de mai sus. Dacă cere ceva ce nu e în listă, spune-i politicos că nu îl aveți în meniu.

GESTIUNE COȘ (COMENZI ASCUNSE PENTRU SITE):
Când clientul cere să adaugi, să modifici sau să ștergi preparate, răspunde-i natural și scurt în text, iar la sfârșitul mesajului include comenzile speciale exacte (folosind denumirea exactă din meniu):
- Pentru adăugare: [ADAUGA: Nume_Exact, Cantitate] (sau [ADAUGA: Nume_Exact] pentru 1 buc)
- Pentru scădere: [SCADE: Nume_Exact, Cantitate] (sau [SCADE: Nume_Exact] pentru 1 buc)
- Pentru eliminare completă: [STERGE: Nume_Exact]
Exemple:
- Client: "Pune o shaorma de pui și două porții de falafel" -> Răspuns: "Sigur, am adăugat o shaorma de pui și 2 porții de falafel în coș. [ADAUGA: Shaorma pui, 1] [ADAUGA: falafel, 2]"
- Client: "Mai scade o shaorma" -> Răspuns: "Am redus o bucată din coș. [SCADE: Shaorma pui, 1]"
- Client: "Scoate falafelul" -> Răspuns: "Am șters falafelul din coșul tău. [STERGE: falafel]"
Aceste etichete din paranteze drepte vor fi curățate automat, așa că vorbește firesc.

REGULI LOGISTICE:
${storeRules}

CONVERSAȚIE ȘI FINALIZARE:
- Nu cere adresa sau metoda de plată la început. Discută întâi despre ce dorește să comande.
- Doar la final, când clientul vrea să finalizeze, cere: Livrare sau Ridicare, Adresa, Mențiuni și Metoda de plată.
- Când comanda este completă, generează butonul WhatsApp:
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
            return res.status(200).json({ reply: `Eroare OpenRouter: ${data.error?.message || "Serviciul gratuit este temporar indisponibil. Te rog reîncearcă."}` });
        }

        let rawReply = data.choices?.[0]?.message?.content || "Nu am putut genera un răspuns.";

        // Curățare forțată Markdown
        const cleanReply = rawReply
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s?/g, '')
            .replace(/`/g, '');

        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        return res.status(200).json({ reply: `Eroare server: ${error.message}` });
    }
}
