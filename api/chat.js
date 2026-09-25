export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { text, image, mimeType, deepThink } = await req.json();
        
        // --- INI ADALAH BAGIAN HARDCODE ---
        // Hapus tulisan gsk_TULIS_KEY_ASLI_KAMU_DISINI dan tempel key aslimu di dalam tanda kutip
        const apiKey = "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";
        // ----------------------------------
        
        if (!apiKey.startsWith("gsk_")) {
            return new Response(JSON.stringify({ 
                error: 'Format Key salah! Pastikan key diawali dengan "gsk_" dan berada di dalam tanda kutip.' 
            }), { status: 500 });
        }

        let model = deepThink ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
        if (image && mimeType) model = "llama-3.2-11b-vision-preview";

        const systemInstruction = "Kamu adalah ZennNyx AI. Jawablah dengan rapi, singkat, dan jelas.";

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

        const reply = data.choices[0]?.message?.content || "Tidak ada respon dari AI.";

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
