// 秘密の物語型定義

export interface SecretStoryCondition {
  type: 'story_count' | 'specific_motif' | 'time_trigger' | 'combination';
  threshold?: number;
  motif?: string;
  timeRange?: { start: string; end: string }; // HH:mm
  requiredMotifs?: string[];
}

export interface SecretStory {
  id: string;
  title: string;
  content: string;
  character: 'haru' | 'sora';
  condition: SecretStoryCondition;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlocked_at?: string;
}

export interface SecretContext {
  storyCount: number;
  currentMotifs: string[];
  currentTime: Date;
  recentMoods: string[];
}

// SecretStoryStore の型
export interface SecretStoryState {
  unlockedStories: string[];
  availableSecrets: SecretStory[];
  checkConditions: (context: SecretContext) => string[];
  unlockStory: (storyId: string) => void;
  getUnlockedStories: () => SecretStory[];
}
