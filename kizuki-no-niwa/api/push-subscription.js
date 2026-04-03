const webpush = require('web-push');

const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const gasUrl = process.env.EXPO_PUBLIC_GAS_URL || '';
const gasAuthToken = process.env.GAS_AUTH_TOKEN || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicKey,
    privateKey
  );
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscription, settings, character } = req.body;

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
        subscription: JSON.stringify(subscription),
        settings: settings,
        character: character || 'sora',
      }),
    });

    if (!response.ok) {
        throw new Error(`GAS returned status ${response.status}`);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error forwarding to GAS:', error);
    res.status(500).json({ error: error.message });
  }
};
