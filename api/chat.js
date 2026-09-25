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
        
        // Memastikan mengambil GROQ_API_KEY dari Vercel
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'GROQ_API_KEY belum terpasang/di-redeploy di Vercel.' }), { status: 500 });
        }

        // Penentuan Model Resmi Groq
        let model = "llama-3.1-8b-instant"; // Flash Mode (Sangat Cepat)

        if (image && mimeType) {
            model = "llama-3.2-11b-vision-preview"; // Vision Mode
        } else if (deepThink) {
            model = "llama-3.3-70b-versatile"; // Pro Mode / Deep Think
        }

        // System Instruction
        let systemInstruction = "Identitas: Kamu adalah ZennNyx AI. Peran: Membantu menyelesaikan tugas, mengobrol, dan menganalisis data dengan tepat. Selalu gunakan format rapi, struktur yang jelas, dan gaya bahasa teknis/minimalis.";
        
        if (deepThink) {
            systemInstruction += " [MODE EXTENDED DIAKTIFKAN]: Lakukan penalaran (Deep Think). Berikan penjelasan yang komprehensif, analisis mendalam langkah demi langkah, dan jangan memotong informasi. Kamu bebas memberikan jawaban panjang.";
        } else {
            systemInstruction += " [MODE STANDAR DIAKTIFKAN]: Jawablah dengan SANGAT singkat, padat, dan langsung ke inti jawaban. Hindari basa-basi. Jika ditanya kodingan, langsung berikan kodenya.";
        }

        const messages = [
            { role: "system", content: systemInstruction }
        ];

        if (image && mimeType) {
            messages.push({ 
                role: "user", 
                content: [
                    { type: "text", text: text || "Jelaskan gambar ini." },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${image}` } }
                ]
            });
        } else {
            messages.push({ role: "user", content: text || "" });
        }

        // Memanggil API Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.6
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        let reply = data.choices[0]?.message?.content || "Tidak ada respon dari AI.";
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

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
