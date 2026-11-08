export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }

        const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
        const currentMenu = body.currentMenu || "Meniu indisponibil.";
        const storeRules = body.storeRules || "Reguli indisponibile.";

        // Preia cheia din Vercel
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            // Trimitem eroarea pe ecran ca să o vezi!
            return res.status(200).json({ reply: "⚠️ EROARE VERCEL: Nu ai setat GEMINI_API_KEY în variabilele de mediu sau ai uitat să dai Redeploy din tab-ul Deployments." });
        }

        const PHONE_NUMBER = "40700000000"; // Pune numărul tău aici

        const systemPrompt = `Ești asistentul virtual de comenzi al restaurantului Di'vino din Brașov. Răspunzi prietenos și scurt în română.
INTERZIS: Nu folosi caractere speciale precum steluțe (**) sau diez (#) sub nicio formă. Scrie doar text simplu.

ACESTA ESTE MENIUL CURENT (oferă doar ce este aici):
${currentMenu}

REGULI DE PREȚ ȘI OFERTE (FOARTE IMPORTANT):
Prețurile pe care le vezi în listă sunt prețuri finale. NU calcula nicio reducere procentuală suplimentară. Dacă un client întreabă de oferte, spune-i strict care produse au [PROMO: 1+1 GRATIS].

REGULI LOGISTICE:
${storeRules}

REGULI DE FINALIZARE:
1. NU CERE detalii de livrare/plată la început. Răspunde doar la întrebări.
2. ABIA la final, când clientul confirmă comanda (ex: "vreau asta"), cere: Livrare/Ridicare, Adresa, Mențiuni, Metoda de plată.

ADĂUGAREA ÎN COȘ - MAGIC COMMAND:
Dacă clientul cere să adaugi în coș, scrie OBLIGATORIU la sfârșitul mesajului tău codul: [ADAUGA: nume_produs]. 
Exemplu: dacă vrea un falafel, tu scrii la final:
[ADAUGA: Falafel]
Spune-i natural în text: "Am adăugat produsul în coșul tău de pe site."

BUTON WHATSAPP:
Când ai toate datele finale, generează butonul:
<a href="https://wa.me/${PHONE_NUMBER}?text=Comanda%20Di%27vino:%0A-Produse:%20[PRODUSE]%0A-Mentiuni:%20[COMENTARII]%0A-Plata:%20[METODA_PLATA]%0A-Livrare/Ridicare:%20[ADRESA]" target="_blank" class="btn-primary" style="display:inline-block; padding:10px 20px; text-decoration:none; margin-top:10px; border-radius:20px;">Trimite comanda pe WhatsApp</a>`;

        const geminiMessages = rawMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: { temperature: 0.2 }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Trimitem eroarea exactă de la Google pe ecran
            return res.status(200).json({ reply: `⚠️ EROARE GOOGLE: ${data.error?.message || 'Eroare necunoscută'}` });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Nu am putut genera un răspuns.";
        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(200).json({ reply: `⚠️ EROARE DE COD FRONTEND/BACKEND: ${error.message}` });
    }
}
