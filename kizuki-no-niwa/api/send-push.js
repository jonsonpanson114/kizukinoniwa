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

  const { title, body, subscriptions } = req.body;

  if (!subscriptions || !Array.isArray(subscriptions)) {
    return res.status(400).json({ error: 'Subscriptions required' });
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (subStr) => {
      let sub;
      try {
        sub = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
        return webpush.sendNotification(sub, JSON.stringify({ title, body }));
      } catch (e) {
        throw new Error(`Invalid sub: ${e.message}`);
      }
    })
  );

  const successes = results.filter(r => r.status === 'fulfilled').length;
  res.status(200).json({
    ok: true,
    message: `Sent ${successes} notifications`
  });
};
