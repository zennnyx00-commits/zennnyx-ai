export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { text, image, mimeType, deepThink } = await req.json();
        
        // --- OPSI API KEY ---
        // Kamu bisa pakai Vercel ENV (OPENROUTER_API_KEY) atau langsung ganti string di bawah ini
        const apiKey = process.env.OPENROUTER_API_KEY || "sk-or-v1-TEMPEL_KEY_OPENROUTER_DISINI";

        if (!apiKey || apiKey.includes("TEMPEL_KEY")) {
            return new Response(JSON.stringify({ 
                error: 'API Key OpenRouter belum dipasang di Vercel atau belum di-hardcode!' 
            }), { status: 500 });
        }

                // Penentuan Model OpenRouter Gratisan (Anti-Berbayar)
        let model = "meta-llama/llama-3.1-8b-instruct:free"; // Flash Mode (Sangat ringan, stabil, & gratis permanen)

        if (image && mimeType) {
            model = "meta-llama/llama-3.2-11b-vision-instruct:free"; // Vision Mode (Untuk baca gambar)
        } else if (deepThink) {
            model = "qwen/qwen-2.5-72b-instruct:free"; // Pro Mode (Sangat cerdas, setara Llama 70B, & selalu gratis)
        }


        let systemInstruction = "Identitas: Kamu adalah ZennNyx AI. Peran: Membantu menyelesaikan tugas, mengobrol, dan menganalisis data dengan tepat. Selalu gunakan format rapi, struktur yang jelas, dan gaya bahasa teknis/minimalis.";
        
        if (deepThink) {
            systemInstruction += " [MODE EXTENDED DIAKTIFKAN]: Lakukan penalaran (Deep Think). Berikan penjelasan yang komprehensif, analisis mendalam langkah demi langkah, dan jangan memotong informasi.";
        } else {
            systemInstruction += " [MODE STANDAR DIAKTIFKAN]: Jawablah dengan SANGAT singkat, padat, dan langsung ke inti jawaban. Hindari basa-basi.";
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
            messages.push({ role: "user", content: text || "Halo" });
        }

        // Panggilan API ke OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`,
                'HTTP-Referer': 'https://vercel.com',
                'X-Title': 'ZennNyx AI'
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
        
        // Hapus pemikiran internal <think>...</think> dari DeepSeek R1 agar tampilan chat tetap bersih
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
