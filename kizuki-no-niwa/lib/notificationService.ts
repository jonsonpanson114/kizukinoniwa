// 通知サービス
// 注意: expo-notifications をインストールすると完全に機能します

declare const ExpoNotifications: any;

export interface NotificationRule {
  id: string;
  type: 'streak' | 'time' | 'phase' | 'cat' | 'reminder';
  message: string;
  condition: any;
  enabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  scheduledFor: string;
  delivered: boolean;
}

// @ts-ignore - Dynamic import errors are handled at runtime
export class NotificationService {
  private static rules: NotificationRule[] = [
    {
      id: 'morning_greeting',
      type: 'time',
      message: 'おはようございます。今日も庭であなたを待っています。',
      condition: { time: '08:00' },
      enabled: false,
    },
    {
      id: 'streak_3',
      type: 'streak',
      message: '3日連続の記録、素晴らしいです！部長も喜んでいます。',
      condition: { days: 3 },
      enabled: true,
    },
    {
      id: 'streak_7',
      type: 'streak',
      message: '1週間連続で記録しました。庭の花が咲きそうです。',
      condition: { days: 7 },
      enabled: true,
    },
    {
      id: 'cat_message',
      type: 'cat',
      message: '部長からメッセージです。',
      condition: {},
      enabled: true,
    },
  ];

  private static catMessages = [
    '今日も頑張ってね。',
    '庭が寂しくなってきたよ。',
    '部長は昼寝中。',
    'いい匂いがするね。',
    '雨の匂いがする。',
    '夕日がきれいだよ。',
    'また明日。',
  ];

  static async requestPermission(): Promise<boolean> {
    try {
      // @ts-ignore
      const { Notifications } = await (import('expo-notifications') as any);
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.log('Notifications not available (expo-notifications not installed):', e);
      return false;
    }
  }

  static async scheduleNotification(
    title: string,
    body: string,
    date: Date
  ): Promise<void> {
    console.log(`📱 Scheduling notification: ${title} - ${body}`);

    try {
      // @ts-ignore
      const { Notifications } = await (import('expo-notifications') as any);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date,
        },
      });
    } catch (e) {
      console.log('Notification scheduling not available:', e);
    }
  }

  static async sendImmediateNotification(title: string, body: string): Promise<void> {
    console.log(`📱 Sending immediate notification: ${title} - ${body}`);

    try {
      // @ts-ignore
      const { Notifications } = await (import('expo-notifications') as any);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {
      console.log('Immediate notification not available:', e);
    }
  }

  static async sendCatMessage(): Promise<void> {
    const message = this.catMessages[Math.floor(Math.random() * this.catMessages.length)];
    console.log(`🐱 Cat message: ${message}`);

    await this.sendImmediateNotification('部長からのメッセージ', message);
  }

  static async scheduleDailyReminder(hour: number = 21, minute: number = 0): Promise<void> {
    try {
      // @ts-ignore
      const { Notifications } = await (import('expo-notifications') as any);

      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '気づきの庭',
          body: '今日の気づき、綴りましたか？',
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`📅 Daily reminder scheduled for ${hour}:${minute}`);
    } catch (e) {
      console.log('Daily reminder scheduling not available:', e);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      // @ts-ignore
      const { Notifications } = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('📅 All notifications cancelled');
    } catch (e) {
      console.log('Notification cancellation not available:', e);
    }
  }

  static getRules(): NotificationRule[] {
    return [...this.rules];
  }

  static updateRule(id: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  static async checkStreak(streakDays: number): Promise<void> {
    for (const rule of this.rules) {
      if (rule.type === 'streak' && rule.enabled) {
        if (streakDays >= rule.condition.days) {
          await this.sendImmediateNotification(
            '連続記録達成！',
            rule.message
          );
          // 一度だけ送るために無効化
          rule.enabled = false;
        }
      }
    }
  }
}
