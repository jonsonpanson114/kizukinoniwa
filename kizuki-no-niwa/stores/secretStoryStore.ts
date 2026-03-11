// 秘密の物語管理ストア

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SecretStory, SecretContext } from '../types/secretStory';

export const SECRET_STORIES: SecretStory[] = [
  {
    id: 'secret_morning_rain',
    title: '雨の朝の秘密',
    content: '俺は部長を見た。雨粒が窓を叩く朝、部長はまるで何かを聞いているかのように窓辺で耳を澄ませていた。「何を聞いてるんだよ」と俺は聞いた。部長は振り返り、一言も発さずにまた窓へ向き直った。あの時、俺は気づかなかった。部長が聞いていたのは、雨音じゃなかったのだ。\n\nそれは、もっと遠くの、過去の誰かの言葉だったのかもしれない。',
    character: 'haru',
    condition: {
      type: 'combination',
      requiredMotifs: ['雨', '朝'],
    },
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'secret_twilight_cat',
    title: '黄昏時の部長',
    content: '夕暮れ時の庭で、私は部長を見つけた。夕日が沈むのを見つめるその背中は、ふだんの猫とは違って見えた。「何を見てるの」と問いかけると、部長はゆっくりとこちらを振り返った。その目には、まるで何千年もの物語が詰まっているような、不思議な光が宿っていた。\n\n「君が見ていないものを、見ているんだ」と部長は言った気さえした。',
    character: 'sora',
    condition: {
      type: 'time_trigger',
      timeRange: { start: '17:00', end: '19:00' },
    },
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'secret_first_smile',
    title: '初めての微笑み',
    content: '部長が笑った。あんな顔をしたことは一度もないのに、その時だけ、どう見ても部長は笑っていた。雨上がりの虹を見上げながら、部長の口元が少しだけ緩むのを私は見たのだ。\n\n「何かいいことでも？」と聞いても、部長はただ目を細めて、その答えは虹の中に消えてしまった。\n\nあれ以来、私は虹を見るたびに、部長のあの笑顔を思い出す。',
    character: 'sora',
    condition: {
      type: 'story_count',
      threshold: 10,
    },
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'secret_moonlit_garden',
    title: '月夜の庭',
    content: '月が明るい夜、俺は庭にいた。眠れなくて、ただ月を見上げていた。\n\n「不眠か」と声がした。振り返ると、誰もいない。でも、庭の隅に、部長が座っている。\n\n「月が綺麗なんだよ」と俺は言った。「だから、見てるだけだ」\n\n部長は何も言わずに、月を見つめ続けていた。そして、ふと、口を開いた。「お前の、見えないものが見えているんだよ」\n\n部長の言葉は、風に溶けて消えた。',
    character: 'haru',
    condition: {
      type: 'time_trigger',
      timeRange: { start: '21:00', end: '23:00' },
    },
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'secret_coffee_conversation',
    title: '珈琲と猫の会話',
    content: '俺は珈琲を淹れた。深煎りで、少し苦い。\n\n部長が近づいてきた。匂いを嗅ぎ、そして、少しだけ顔をしかめた。\n\n「苦いのが好きなんだよ」と俺は言った。「人のことだ」\n\n部長は、それを聞いて、少しだけ驚いたような顔をした。そして、また、いつもの無表情に戻った。\n\nけれど、その日の夜、部長が夢を見たのを、俺は知っている。夢の中で、部長は、苦い珈琲を飲んでいた。そして、泣いていた。',
    character: 'haru',
    condition: {
      type: 'specific_motif',
      motif: '珈琲',
    },
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'secret_sakura_petal',
    title: '一枚の桜',
    content: '春の終わり、最後の桜の花びらが落ちた。\n\n俺はそれを拾い上げた。白くて、薄くて、儚い。\n\n「終わりなんだ」と俺は呟いた。\n\n部長が、その花びらをじっと見つめていた。そして、ふと、言った。「始まりなんだよ」\n\n「どういうこと？」\n\n「終わりは、いつだって始まりの反対側にある」\n\n部長の言葉を、俺は理解できなかった。でも、何かが、胸の中で、少しだけ動いた気がした。',
    character: 'haru',
    condition: {
      type: 'combination',
      requiredMotifs: ['桜', '春'],
    },
    rarity: 'epic',
    unlocked: false,
  },
  {
    id: 'secret_sora_first_meeting',
    title: '初めてのソラ',
    content: '彼女が現れたのは、雨の日だった。\n\n透明な雨傘をさして、微笑んでいた。\n\n「こんにちは」\n\nその一言で、俺の世界は、少し変わった気がした。\n\n部長は、彼女を見て、尻尾を振った。あんなこと、一度もないのに。\n\n「彼女は、特別なんだよ」と部長は言った気がした。',
    character: 'sora',
    condition: {
      type: 'story_count',
      threshold: 5,
    },
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'secret_phantom_book',
    title: '幻の本',
    content: 'ソラが、ある本を持ってきた。\n\n「これ、読んでみて」\n\n俺はその本を開いた。ページが、真っ白だった。\n\n「何も書いてないよ」\n\n「見てごらん」\n\n俺はよく見た。そうしたら、白いページに、少しだけ文字が浮かび上がってきた。それは、俺が書いたはずのない言葉だった。\n\n『君が探しているものは、もう見つかっている』\n\n俺は、本を閉じた。でも、その言葉が、頭の中で、消えなかった。',
    character: 'sora',
    condition: {
      type: 'combination',
      requiredMotifs: ['本', '言葉'],
    },
    rarity: 'epic',
    unlocked: false,
  },
];

function evaluateCondition(
  condition: SecretStory['condition'],
  context: SecretContext
): boolean {
  switch (condition.type) {
    case 'story_count':
      return context.storyCount >= (condition.threshold || 0);
    case 'specific_motif':
      return context.currentMotifs.includes(condition.motif || '');
    case 'time_trigger':
      if (!condition.timeRange) return false;
      const currentHour = context.currentTime.getHours();
      const currentMinute = context.currentTime.getMinutes();
      const [startH, startM] = condition.timeRange.start.split(':').map(Number);
      const [endH, endM] = condition.timeRange.end.split(':').map(Number);
      const currentMinutes = currentHour * 60 + currentMinute;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    case 'combination':
      if (!condition.requiredMotifs) return false;
      return condition.requiredMotifs.every((m) => context.currentMotifs.includes(m));
    default:
      return false;
  }
}

interface SecretStoryState {
  unlockedStories: string[];
  availableSecrets: SecretStory[];
  lastCheckTime: string | null;

  checkConditions: (context: SecretContext) => string[];
  unlockStory: (storyId: string) => void;
  getUnlockedStories: () => SecretStory[];
  isNewlyUnlocked: (storyId: string) => boolean;
}

export const useSecretStoryStore = create<SecretStoryState>()(
  persist(
    (set, get) => ({
      unlockedStories: [],
      availableSecrets: SECRET_STORIES,
      lastCheckTime: null,

      checkConditions: (context) => {
        const state = get();
        const newlyUnlocked: string[] = [];

        for (const secret of state.availableSecrets) {
          if (state.unlockedStories.includes(secret.id)) continue;

          if (evaluateCondition(secret.condition, context)) {
            newlyUnlocked.push(secret.id);
          }
        }

        if (newlyUnlocked.length > 0) {
          set((s) => ({
            unlockedStories: [...s.unlockedStories, ...newlyUnlocked],
            lastCheckTime: new Date().toISOString(),
          }));
        }

        return newlyUnlocked;
      },

      unlockStory: (storyId) =>
        set((s) => ({
          unlockedStories: [...s.unlockedStories, storyId],
          lastCheckTime: new Date().toISOString(),
        })),

      getUnlockedStories: () => {
        const state = get();
        return state.availableSecrets.filter((s) => state.unlockedStories.includes(s.id));
      },

      isNewlyUnlocked: (storyId) => {
        const state = get();
        if (!state.lastCheckTime) return false;
        const checkTime = new Date(state.lastCheckTime);
        const now = new Date();
        // 5分以内にアンロックされたもの
        return (now.getTime() - checkTime.getTime()) < 5 * 60 * 1000 &&
               state.unlockedStories.includes(storyId);
      },
    }),
    {
      name: 'secret-story-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
