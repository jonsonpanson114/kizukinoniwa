import webpush from 'web-push';

const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const gasUrl = process.env.EXPO_PUBLIC_GAS_URL || '';
const gasAuthToken = process.env.GAS_AUTH_TOKEN || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Change this to a real email in production
    publicKey,
    privateKey
  );
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, icon, url, data } = req.body;

  if (!gasUrl) {
    console.error('GAS_URL is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. Fetch all subscriptions from GAS
    const fetchResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: gasAuthToken,
        app_name: 'kizuki-no-niwa',
        action: 'get_subscriptions'
      }),
    });

    if (!fetchResponse.ok) {
        throw new Error(`GAS returned status ${fetchResponse.status}`);
    }

    const { success, subscriptions } = await fetchResponse.json();

    if (!success || !subscriptions) {
        throw new Error('Failed to retrieve subscriptions from GAS');
    }

    const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icon-512x512.png',
        url: url || '/',
        data: data || {}
    });

    // 2. Send push notifications concurrently
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        // You could use `sub.character` here to send custom messages if the user has a specific partner active
        return webpush.sendNotification(
          sub.subscription,
          payload
        );
      })
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      ok: true,
      message: `Sent ${successes} notifications, ${failures} failures`
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return res.status(500).json({ error: 'Failed to send push notifications' });
  }
}
