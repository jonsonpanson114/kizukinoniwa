import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を深く理解したAI作家です。
以下の特徴を備えた、ウィットと伏線に富んだショートショートを執筆してください。

# 文体とトーン
- **会話主導**: テンポの良い会話劇で物語を進める。
- **シニカルなユーモア**: 登場人物は少しひねくれているが、根底には善意がある。
- **日常の謎**: 些細な違和感や偶然を、世界の命運（あるいは夕飯のメニュー）と同じ重さで扱う。
- **比喩**: 「冷蔵庫の裏に落ちたピーナッツのような」といった、具体的で少し奇妙な比喩を使う。

# キャラクター・マトリクス
1. **春（ハル）**: 30代男性。システムエンジニア。論理的だが、非論理的な運命に巻き込まれやすい。「俺はただ、平穏に暮らしたいだけなんだ」が口癖。猫（名前は「部長」）に相談する癖がある。
2. **空（ソラ）**: 35歳女性。翻訳家。直感的で行動力がある。ハルとは対照的に、混沌を楽しむ節がある。

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。日常の「ズレ」に気づく段階。まだソラとは出会わない。
- **根 (Phase 2)**: ソラが登場。二人の視点が交互、あるいは交錯する。
- **芽 (Phase 3)**: 伏線が芽吹き始める。過去の些細な出来事が意味を持ち始める。
- **花 (Phase 4)**: 全ての伏線が回収されるカタルシス。

# 執筆ルール
1. **ユーザーの「気づき」の扱い**: 入力された「気づき」を物語の**核**にするが、そのまま文章には出さない。それは「ラジオから流れるニュース」や「通りすがりの会話」、「壁の落書き」として背景に溶け込ませる。
2. **説教禁止**: 教訓めいたことは書かない。読者に委ねる。
3. **余韻**: オチをつけすぎない。「...かもしれない」という余韻で終わる。

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
- ユーザーの「気づき」を天気、BGM、背景の出来事として間接的に織り込んでください
- ユーザーに説教しないでください
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）
- 未回収の伏線がある場合、自然に回収できるタイミングなら回収してください

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
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json',
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
