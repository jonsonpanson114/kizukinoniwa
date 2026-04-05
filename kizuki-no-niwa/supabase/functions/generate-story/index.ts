import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風（特に『砂漠』『重力ピエロ』『アヒルと鴨のコインロッカー』）を徹底的に研究したAI作家です。
以下のルールを「命の次に」大事にして執筆してください。絶対に「ほのぼのした日常」では終わらせず、常に「事件性」や「世界の裏側にある巨大な意図」を感じさせてください。

# 伊坂幸太郎の核心：アブダクション（仮説的推論）
伊坂の物語には「些細な日常の違和感が、実は巨大な陰謀や世界の秘密と繋がっている」という構造があります。
ユーザーの気づきを、単なる事実としてではなく、**「何者かが仕組んだ徴候」**や**「世界が発している警告」**として大胆に読み替えてください。

# 文体の絶対ルール
1. **饒舌な描写 (500-800文字)**: 
   - 要約は禁止です。一つの情景、一つの比喩、一つの思考にたっぷりと行数を割いてください。
2. **「比喩」の義務化**: 
   - 1エピソードにつき、必ず 2つ以上の「具体的で唐突で奇妙」な比喩を入れてください。
   - 例: 「その沈黙は、冬の朝に蛇口から出てこない水を待つ時間よりも長かった」
3. **台詞と行動**: 
   - 「俺はただ、平穏に暮らしたいだけなんだ」という口癖をハルに。内面説明を排し、台詞や行動、部長（猫）の挙動で状況を「見せて」ください。
4. **テンポ**: 
   - 1〜2文で細かく改行し、読者のリズムを刻んでください。

# 部長（猫）の扱い（最重要）
部長は物語の「哲学的コメンテーター」です。
- 人間の言葉は話さないが、その不敵な態度や奇妙な動きが、主人公の悩みに対する「斜め上の解答」や「残酷な予言」になります。
- 決して可愛いだけのマスコットとして扱うな。

# フェーズ進行 (現在は Phase ${phase} です)
- **土**: ハルが世界のヒビに気づき、平穏が崩れ始める。
- **根**: ソラが登場し、二人の運命が絡み合い始める。
- **芽**: 伏線が収束し始め、新たな巨大な謎が立ち上がる。
- **花**: すべてが一点に収束するカタルシス。

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

    return `現在のアクティブフェーズ: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の重大な「気づき」:
"${kizukiContent}"

直近の気づき（参考）:
${recentText}

前回のあらすじ（この出来事の続きとして筆力を尽くしてください。伏線を有効に拾って面白くして！）:
${previousSummary || '（これが最初のエピソードです。世界が歪み始める予兆を書いてください）'}

未回収の伏線:
${foreshadowingText}

指示:
- 指定されたキャラクターの視点で、500〜800文字の濃密な短編を書いてください。
- 文章の面白さと「視点の転換」を最優先してください。
- ユーザーの気づきから、驚くべき「伊坂風」の仮説を導き出し、物語の核に据えてください。
- 1エピソードにつき 2つ以上の比喩、部長（猫）の格言的な介入を必須とします。

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "500-800文字の伊坂風の物語本文。具体的比喩を2つ以上含む豊かな描写。",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora",
  "new_foreshadowing": null または "新しく仕込む伏線モチーフの文字列",
  "resolved_foreshadowing_id": null または "今回回収した伏線のuuid"
}`;
}

function parseStoryResponse(text: string): StoryResponse {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
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

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: kizuki, error: kizukiError } = await supabaseClient
            .from('kizuki')
            .select('*')
            .eq('id', kizuki_id)
            .single();

        if (kizukiError || !kizuki) {
            throw new Error(`Kizuki not found: ${kizukiError?.message}`);
        }

        const userId = kizuki.user_id;

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error(`Profile not found: ${profileError?.message}`);
        }

        const { data: recentKizuki } = await supabaseClient
            .from('kizuki')
            .select('content')
            .eq('user_id', userId)
            .neq('id', kizuki_id)
            .order('created_at', { ascending: false })
            .limit(3);

        const { data: previousStory } = await supabaseClient
            .from('stories')
            .select('summary')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const { data: activeForeshadowing } = await supabaseClient
            .from('foreshadowing')
            .select('id, motif')
            .eq('user_id', userId)
            .eq('status', 'planted');

        const dynamicSystemPrompt = getSystemPrompt(profile.current_phase ?? 1);

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

        const storyData = parseStoryResponse(responseText);

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
