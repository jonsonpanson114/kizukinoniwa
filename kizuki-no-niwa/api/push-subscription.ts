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

  const { subscription, character } = req.body;

  if (!gasUrl) {
    console.error('GAS_URL is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Send to Google Apps Script
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: gasAuthToken,
        app_name: 'kizuki-no-niwa',
        action: 'subscribe',
        subscription: subscription,
        character: character || 'sora', // Sora or Haru
      }),
    });

    if (!response.ok) {
        throw new Error(`GAS returned status ${response.status}`);
    }

    // Attempt to parse just to ensure it's valid JSON even if we don't strictly need the contents
    await response.json(); 

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error forwarding to GAS:', error);
    return res.status(500).json({ error: 'Failed to process subscription' });
  }
}
