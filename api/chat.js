// OPTIMASI: Menggunakan Edge Runtime Vercel agar koneksi lebih cepat (low latency)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { text, image, mimeType, deepThink } = await req.json();
        
        // Ambil Key dari Environment Vercel
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API Key tidak ditemukan di server.' }), { status: 500 });
        }

        // Trik Logika Deep Think (Extended)
        let systemInstruction = "Identitas: Kamu adalah ZennNyx AI. Peran: Membantu menyelesaikan tugas, mengobrol, dan menganalisis data dengan tepat. Selalu gunakan format rapi, struktur yang jelas, dan gaya bahasa teknis/minimalis.";
        
        if (deepThink) {
            systemInstruction += " [MODE EXTENDED DIAKTIFKAN]: Lakukan penalaran (Deep Think). Berikan penjelasan yang komprehensif, analisis mendalam langkah demi langkah, dan jangan memotong informasi. Kamu bebas memberikan jawaban panjang.";
        } else {
            systemInstruction += " [MODE STANDAR DIAKTIFKAN]: Jawablah dengan SANGAT singkat, padat, dan langsung ke inti jawaban. Hindari basa-basi. Jika ditanya kodingan, langsung berikan kodenya.";
        }

        const parts = [];
        if (text) parts.push({ text: text });
        if (image && mimeType) {
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: image
                }
            });
        }

        const payload = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: parts }]
        };

        // Memanggil API Gemini 3.6 Flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const reply = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ reply: reply }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
