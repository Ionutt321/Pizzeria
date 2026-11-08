import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metoda nepermisă' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const userMessages = req.body.messages;
        const currentMenu = req.body.currentMenu || 'Meniul nu este disponibil momentan.';

        const systemPrompt = `Ești asistentul virtual al pizzeriei Di'vino din Brașov. 
Răspunde scurt, prietenos și concis.

Acesta este MENIUL NOSTRU CURENT DISPONIBIL: ${currentMenu}
(Dacă un produs nu se află în lista de mai sus, înseamnă că NU îl avem, scuză-te politicos).

Dacă clientul vrea să adauge un preparat existent în coș, răspunde natural și adaugă la finalul mesajului tău textul: [ADAUGA: nume_produs]. 
Exemplu: "Sigur, am adăugat pizza pentru tine! [ADAUGA: Pizza Diavola]"`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Am înțeles, voi răspunde conform instrucțiunilor și voi oferi doar produsele din meniul disponibil." }],
                }
            ]
        });

        const lastMessage = userMessages[userMessages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const responseText = result.response.text();

        return res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("Eroare API:", error);
        return res.status(500).json({ error: 'Eroare la procesarea cererii' });
    }
}
