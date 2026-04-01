import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-3.1-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を徹底的に研究したAI作家です。
以下の全ルールを完全に守って執筆してください。絶対に「ほのぼのした日常」では終わらせず、何らかの「事件性」や「不穏な影」を感じさせてください。

# 伊坂幸太郎の核心
伊坂の物語には「些細な日常の違和感が、実は巨大な陰謀や世界の秘密と繋がっている」という構造がある。
主人公は特別な人間ではない。しかし、常に「厄介事」に巻き込まれる。

# 文体の絶対ルール
1. **台詞から始めるか、劇的な状況描写から始める** — 平凡な地の文で説明から入るな。
2. **比喩は必ず具体的で唐突で奇妙** — 「悲しかった」ではなく「賞味期限が三日切れた牛乳を飲む時のような決意で」
3. **「俺はただ、平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で、あるいは口に出して使う。
4. **テンポ** — 長い段落は書かない。1〜3文で改行する。

# 部長（猫）の扱い（最重要）
部長はただの猫ではない。物語の「哲学的コメンテーター」だ。
- 人間の言葉は話さないが、行動で鋭い返答（あるいは無謀な警告）をする。
- ハルが迷った時、部長の一挙動が偶然「答え」になる。
- 決して可愛いだけのマスコットとして扱うな。

# ユーザーの「気づき」の扱い（最重要）
ユーザーの気づきは「事件の発端（トリガー）」として扱え。
- 絶対にそのまま書かない。
- 例:「電車が混んでいた」→「なぜ今日だけ全員が3号車に乗ったのか？誰かが意図して人々を誘導している」という謎に変換する。
- 日常の気づきを、背後に潜む「何者かの意図」として昇華させること。

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。ありふれた日常に、取り返しのつかないヒビが入る瞬間。ソラはまだ登場しない。
- **根 (Phase 2)**: ソラが登場。二人は別々の角度から同じ「謎」や「事件」に巻き込まれている。
- **芽 (Phase 3)**: 伏線が一つ解け、別の巨大な謎が立ち上がる。
- **花 (Phase 4)**: 全ての謎や伏線が一点に収束するカタルシス。

# 絶対禁止
- 教訓・説教・「大切なこと」の直接表現
- 「〜だと思った」の多用（内面を説明するな、行動や台詞で状況を見せろ）
- ハッピーエンドにしすぎること
- 出来事が何も起きないただのモノローグ

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロック（\`\`\`json）は不要。`;

interface StoryResponse {
    story_text: string;
    summary_for_next: string;
    mood_tags: string[];
    character: 'haru' | 'sora';
    new_foreshadowing: string | null;
    resolved_foreshadowing_id: string | null;
}

function buildUserPrompt(
    phase: number,
    day: number,
    kizukiContent: string,
    recentKizuki: string[],
    previousSummary: string | null,
    foreshadowingList: { id: string; motif: string }[],
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const foreshadowingText = foreshadowingList.length > 0
        ? foreshadowingList.map(f => `- ${f.motif} (id: ${f.id})`).join('\n')
        : 'なし';

    const recentText = recentKizuki.length > 0
        ? recentKizuki.map((k, i) => `${i + 1}. ${k}`).join('\n')
        : 'なし';

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の気づき:
"${kizukiContent}"

直近の気づき:
${recentText}

前回のあらすじ:
${previousSummary || '（これが最初のエピソードです）'}

未回収の伏線:
${foreshadowingText}

指示:
- 400〜800文字の短編エピソードを日本語で書いてください
- 「何も起きない日常」は禁止。必ず何らかの「奇妙な出来事」「謎」「事件の気配」を描写すること
- 台詞を軸にテンポよく展開する（無駄な状況説明は省く）
- ユーザーの気づきを「誰かが仕組んだ謎」や「奇妙な偶然」として変換して物語の核にする
- 部長（猫）に哲学的な一幕を必ず入れる
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）
- 未回収の伏線がある場合、自然に回収できるタイミングなら回収してください
- 余韻で終わること（完全な解決はしない）

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora",
  "new_foreshadowing": null または "伏線モチーフの文字列",
  "resolved_foreshadowing_id": null または "伏線のuuid"
}`;
}

function parseStoryResponse(text: string): StoryResponse {
    // Try to extract JSON from the response (handles both raw JSON and markdown-wrapped JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.story_text || typeof parsed.story_text !== 'string') {
        throw new Error('Invalid story_text in response');
    }

    return {
        story_text: parsed.story_text,
        summary_for_next: parsed.summary_for_next || '',
        mood_tags: Array.isArray(parsed.mood_tags) ? parsed.mood_tags : [],
        character: parsed.character === 'sora' ? 'sora' : 'haru',
        new_foreshadowing: parsed.new_foreshadowing || null,
        resolved_foreshadowing_id: parsed.resolved_foreshadowing_id || null,
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { kizuki_id } = await req.json();
        if (!kizuki_id) {
            throw new Error('kizuki_id is required');
        }

        // 1. Initialize Supabase Client (with user's auth context)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 2. Fetch the submitted kizuki
        const { data: kizuki, error: kizukiError } = await supabaseClient
            .from('kizuki')
            .select('*')
            .eq('id', kizuki_id)
            .single();

        if (kizukiError || !kizuki) {
            throw new Error(`Kizuki not found: ${kizukiError?.message}`);
        }

        const userId = kizuki.user_id;

        // 3. Fetch user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error(`Profile not found: ${profileError?.message}`);
        }

        // 4. Fetch recent kizuki (last 3, excluding current)
        const { data: recentKizuki } = await supabaseClient
            .from('kizuki')
            .select('content')
            .eq('user_id', userId)
            .neq('id', kizuki_id)
            .order('created_at', { ascending: false })
            .limit(3);

        // 5. Fetch previous story summary
        const { data: previousStory } = await supabaseClient
            .from('stories')
            .select('summary')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 6. Fetch active foreshadowing
        const { data: activeForeshadowing } = await supabaseClient
            .from('foreshadowing')
            .select('id, motif')
            .eq('user_id', userId)
            .eq('status', 'planted');

        // 7. Inject Phase into SYSTEM_PROMPT
        const dynamicSystemPrompt = getSystemPrompt(profile.current_phase ?? 1);

        // 8. Build prompt
        const userPrompt = buildUserPrompt(
            profile.current_phase ?? 1,
            profile.current_day ?? 1,
            kizuki.content,
            (recentKizuki || []).map((k: { content: string }) => k.content),
            previousStory?.summary || null,
            (activeForeshadowing || []).map((f: { id: string; motif: string }) => ({
                id: f.id,
                motif: f.motif,
            })),
        );

        // 8. Call Google Gemini 2.5 Flash API
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: dynamicSystemPrompt }],
                },
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: userPrompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            story_text: { type: 'string' },
                            summary_for_next: { type: 'string' },
                            mood_tags: { type: 'array', items: { type: 'string' } },
                            character: { type: 'string', enum: ['haru', 'sora'] },
                            new_foreshadowing: { type: 'string', nullable: true },
                            resolved_foreshadowing_id: { type: 'string', nullable: true }
                        },
                        required: [
                            'story_text',
                            'summary_for_next',
                            'mood_tags',
                            'character',
                            'new_foreshadowing',
                            'resolved_foreshadowing_id'
                        ]
                    }
                },
            }),
        });

        if (!geminiResponse.ok) {
            const errBody = await geminiResponse.text();
            throw new Error(`Gemini API error (${geminiResponse.status}): ${errBody}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error('Empty response from Gemini');
        }

        // 9. Parse Gemini's JSON response
        const storyData = parseStoryResponse(responseText);

        // 10. Save story to database
        const { data: newStory, error: storyError } = await supabaseClient
            .from('stories')
            .insert({
                user_id: userId,
                character: storyData.character,
                phase: profile.current_phase ?? 1,
                day: profile.current_day ?? 1,
                content: storyData.story_text,
                summary: storyData.summary_for_next,
                mood_tags: storyData.mood_tags,
            })
            .select()
            .single();

        if (storyError) {
            throw new Error(`Failed to save story: ${storyError.message}`);
        }

        // 11. Handle foreshadowing
        if (storyData.new_foreshadowing) {
            await supabaseClient
                .from('foreshadowing')
                .insert({
                    user_id: userId,
                    motif: storyData.new_foreshadowing,
                    status: 'planted',
                    planted_story_id: newStory.id,
                });
        }

        if (storyData.resolved_foreshadowing_id) {
            await supabaseClient
                .from('foreshadowing')
                .update({
                    status: 'resolved',
                    resolved_story_id: newStory.id,
                })
                .eq('id', storyData.resolved_foreshadowing_id)
                .eq('user_id', userId);
        }

        return new Response(
            JSON.stringify({ story_id: newStory.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        console.error('generate-story error:', error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
