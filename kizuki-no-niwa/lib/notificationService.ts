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

export const subscribeToPushNotifications = async (character: string = 'sora') => {
  if (Platform.OS !== 'web') {
    // Currently only supporting Web Push in this implementation
    return null;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Browser does not support Push Notifications');
    return null;
  }

  try {
    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Register/Get Service Worker
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // VAPID keys provided via environment variables (Vite/Expo web)
    const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('EXPO_PUBLIC_VAPID_PUBLIC_KEY is not defined');
    }

    // Create new subscription if needed
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('Created new Push Subscription');
    } else {
      console.log('Found existing Push Subscription');
    }

    // Send the subscription and current active character context to our Vercel API
    await sendSubscriptionToServer(subscription, character);
    return subscription;
  } catch (error) {
    console.error('Subscription failed:', error);
    return null;
  }
};

const sendSubscriptionToServer = async (subscription: PushSubscription, character: string) => {
  try {
    // Calling the Vercel API endpoint we created
    const response = await fetch('/api/push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        character: character
      }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Server error: ${err.error || response.statusText}`);
    }
    
    console.log('Successfully saved push subscription on server');
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
  }
};
