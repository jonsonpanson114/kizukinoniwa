// 音声管理クラス
// 注意: expo-av をインストールすると完全に機能します

declare const ExpoAV: any;

// @ts-ignore - Dynamic import errors are handled at runtime
export class AudioManager {
  private static bgm: any = null;
  private static currentPhase: number = 1;
  private static isPlaying: boolean = false;

  static readonly BGM_URLS: Record<number, string> = {
    1: '/audio/phase1-soil.mp3',
    2: '/audio/phase2-root.mp3',
    3: '/audio/phase3-sprout.mp3',
    4: '/audio/phase4-flower.mp3',
  };

  static readonly AMBIENT_SOUNDS = {
    rain: '/audio/ambient-rain.mp3',
    birds: '/audio/ambient-birds.mp3',
    crickets: '/audio/ambient-crickets.mp3',
    wind: '/audio/ambient-wind.mp3',
    cat_meow: '/audio/cat-meow.mp3',
    cat_purr: '/audio/cat-purr.mp3',
  };

  static async playBGM(phase: number): Promise<void> {
    if (this.currentPhase === phase && this.isPlaying) return;

    this.stopBGM();
    this.currentPhase = phase;

    console.log(`🎵 Playing BGM for Phase ${phase}`);

    try {
      // expo-av がインストールされている場合
      const { Audio } = await (import('expo-av') as any);
      const soundObject = new Audio.Sound();

      await soundObject.loadAsync({ uri: this.BGM_URLS[phase] });
      await soundObject.setIsLoopingAsync(true);
      await soundObject.setVolumeAsync(0.3);
      await soundObject.playAsync();

      this.bgm = soundObject;
      this.isPlaying = true;
    } catch (e) {
      console.log('Audio playback not available (expo-av not installed):', e);
      // expo-av がインストールされていない場合は何もしない
    }
  }

  static stopBGM(): void {
    if (this.bgm) {
      console.log('🔇 Stopping BGM');
      this.bgm.stopAsync().catch(() => {});
      this.bgm.unloadAsync().catch(() => {});
      this.bgm = null;
      this.isPlaying = false;
    }
  }

  static async playSoundEffect(type: 'cat' | 'write' | 'complete' | 'notification'): Promise<void> {
    const soundMap: Record<string, string> = {
      cat: this.AMBIENT_SOUNDS.cat_meow,
      write: '/audio/write.mp3',
      complete: '/audio/complete.mp3',
      notification: '/audio/notification.mp3',
    };

    console.log(`🔊 Playing sound effect: ${type}`);

    try {
      const { Audio } = await (import('expo-av') as any);
      const soundObject = new Audio.Sound();

      await soundObject.loadAsync({ uri: soundMap[type] });
      await soundObject.setVolumeAsync(0.5);
      await soundObject.playAsync();

      soundObject.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          soundObject.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Sound effect not available:', e);
    }
  }

  static async playAmbient(type: keyof typeof AudioManager.AMBIENT_SOUNDS): Promise<any> {
    console.log(`🌿 Playing ambient sound: ${type}`);

    try {
      const { Audio } = await (import('expo-av') as any);
      const soundObject = new Audio.Sound();

      await soundObject.loadAsync({ uri: this.AMBIENT_SOUNDS[type] });
      await soundObject.setIsLoopingAsync(true);
      await soundObject.setVolumeAsync(0.2);
      await soundObject.playAsync();

      return soundObject;
    } catch (e) {
      console.log('Ambient sound not available:', e);
      return null;
    }
  }

  static getCurrentPhase(): number {
    return this.currentPhase;
  }

  static isBGMPlaying(): boolean {
    return this.isPlaying;
  }
}
