export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metoda nu este permisă. Folosește POST.' });
    }

    try {
        const { subject, image, body, emails } = req.body;

        // Validări de bază
        if (!subject || !body || !emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'Date incomplete. Asigură-te că ai subiect, mesaj și cel puțin un email.' });
        }

        // Cheia API setată în Vercel Environment Variables
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            return res.status(500).json({ error: 'Cheia API Resend lipsește din configurația serverului.' });
        }

        // Formatăm mesajul cu HTML pentru a arăta profi
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                ${image ? `<img src="${image}" alt="Di'vino Oferta" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">` : ''}
                <h2 style="color: #c2410c; margin-bottom: 15px;">${subject}</h2>
                <div style="font-size: 16px; color: #334155; line-height: 1.6; white-space: pre-wrap;">
                    ${body}
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                    <p>Ai primit acest email deoarece te-ai abonat la noutățile Di'vino.</p>
                    <p>&copy; ${new Date().getFullYear()} Di'vino - Experiență Culinară Premium. Toate drepturile rezervate.</p>
                </div>
            </div>
        `;

        // Trimiterea efectivă către API-ul Resend (trimitere de masă tip BCC)
        // NOTĂ: Pentru conturile noi pe Resend, domeniul trebuie validat, 
        // sau poți trimite teste doar pe adresa proprie de email verificată.
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: "Di'vino Newsletter <oferte@resend.dev>", // Domeniul temporar de test de la Resend
                to: emails, // Matrice cu emailuri
                subject: subject,
                html: htmlContent
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, message: 'Email trimis cu succes!', id: data.id });
        } else {
            return res.status(response.status).json({ error: data.message || 'Eroare la trimiterea din Resend.' });
        }

    } catch (error) {
        console.error("Eroare server newsletter:", error);
        return res.status(500).json({ error: 'Eroare internă a serverului.' });
    }
}
