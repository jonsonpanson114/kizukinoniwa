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

export const subscribeToPushNotifications = async (character: string = 'sora', settings?: NotificationSettings) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Browser does not support Push Notifications');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('EXPO_PUBLIC_VAPID_PUBLIC_KEY is not defined');
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    await sendSubscriptionToServer(subscription, character, settings);
    return subscription;
  } catch (error) {
    console.error('Subscription failed:', error);
    return null;
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
