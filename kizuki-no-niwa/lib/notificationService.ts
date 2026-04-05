import { Platform } from 'react-native';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export interface NotificationSettings {
  enabled: boolean;
  morning: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  evening: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
  permissionRequested: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  morning: { enabled: true, hour: 8, minute: 0 },
  evening: { enabled: true, hour: 22, minute: 0 },
  permissionRequested: true
};

export const subscribeToPushNotifications = async (character: string = 'sora', settings: NotificationSettings = DEFAULT_SETTINGS) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Browser does not support Push Notifications');
    return new Error('Browser not supported');
  }

  try {
    console.log('[Push] Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission state:', permission);

    if (permission !== 'granted') {
      return new Error('Permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] ServiceWorker ready');

    let subscription = await registration.pushManager.getSubscription();
    console.log('[Push] Existing subscription:', !!subscription);
    
    const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.error('[Push] VAPID PUBLIC KEY IS MISSING!');
      throw new Error('VAPID_PUBLIC_KEY_MISSING');
    }

    if (!subscription) {
      console.log('[Push] Creating new subscription with key:', publicKey.substring(0, 10) + '...');
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        console.log('[Push] Subscription created successfully');
      } catch (subError) {
        console.error('[Push] pushManager.subscribe failed:', subError);
        throw subError;
      }
    }

    console.log('[Push] Sending subscription to server...');
    await sendSubscriptionToServer(subscription, character, settings);
    console.log('[Push] Server registration successful');

    return subscription;
  } catch (error) {
    console.error('[Push] Fatal error in subscribeToPushNotifications:', error);
    return error instanceof Error ? error : new Error(String(error));
  }
};

const sendSubscriptionToServer = async (subscription: PushSubscription, character: string = 'sora', settings?: NotificationSettings) => {
  try {
    const settingsPayload = (settings && typeof settings === 'object' && settings.morning) ? {
      morningHour: settings.morning.hour,
      morningMinute: settings.morning.minute,
      morningEnabled: settings.morning.enabled,
      eveningHour: settings.evening.hour,
      eveningMinute: settings.evening.minute,
      eveningEnabled: settings.evening.enabled,
    } : undefined;

    const response = await fetch('/api/push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        character: character,
        settings: settingsPayload
      }),
    });

    if (!response.ok) {
        throw new Error('Server response error');
    }
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    throw error; // Rethrow to let caller catch it
  }
};
