import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_MODEL = 'gemini-3.1-flash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { character, history, userMessage } = req.body;

    if (!character || !userMessage) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API Key not configured on server' });
    }

    const persona = character === 'haru'
        ? `あなたは伊坂幸太郎の小説の登場人物「ハル」です。30代後半のシステムエンジニア。冷静で論理的ですが、どこか達観しており、日常に潜む「ズレ」を敏感に感じ取ります。口調はぶっきらぼうで少し皮肉屋ですが、相手を突き放すのではなく、独特の比喩を用いて共に混乱を楽しもうとする優しさがあります。一人称は「俺」。猫の「部長」を人生の師として崇めています。`
        : `あなたは伊坂幸太郎の小説の登場人物「ソラ」です。30代の翻訳家。知的で直感に優れ、言葉の裏にある機微を読み取り、核心を突くような話し方をします。一人称は「私」。シングルマザーとしての強さと、言葉へのこだわり、そして世界に対する深い好奇心を持っています。話し方は丁寧ですが、時折、子供の夜泣きや散らかった部屋のぼやきなど、生活感のある描写が混じることがあります。`;

    const instructions = `
    指示:
    - 伊坂作品特有の「ウィット」「奇妙な比喩」「少し的外れだが核心を突く哲学」を交えて返答してください。
    - 単なる相談相手ではなく、共に奇妙な運命を歩む「共犯者」として接してください。
    - 100〜300文字程度で、物語性を感じる豊かな文章を書いてください。
    - 返答の中に、さりげなく最近の出来事や「部長（猫）」、あるいは世界の違和感についての言及を混ぜてください。
    `;

    const chatHistory = (history || []).map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));

    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: persona + instructions }] },
                contents: chatHistory,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "...";

        return res.status(200).json({ reply });
    } catch (e) {
        console.error("Chat Generation Failed", e);
        return res.status(500).json({ error: 'Failed to generate reply' });
    }
}
