export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Only POST allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const accessToken = body.accessToken;

    if (!accessToken) {
      res.status(400).json({ success: false, error: 'accessToken required' });
      return;
    }

    const response = await fetch('https://chatgpt.com/backend-api/payments/checkout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://chatgpt.com',
        'Referer': 'https://chatgpt.com/'
      },
      body: JSON.stringify({
        plan_name: "chatgptplusplan",
        billing_details: { country: "IN", currency: "INR" },
        promo_code: null,
        cancel_url: "https://chatgpt.com/",
        checkout_ui_mode: "redirect"
      })
    });

    const rawText = await response.text();

    let data;
    try { data = JSON.parse(rawText); } 
    catch(e) {
      res.status(502).json({ success: false, error: 'ChatGPT returned non-JSON', raw: rawText.substring(0, 200) });
      return;
    }

    const url = data.url || data.stripe_hosted_url || data.checkout_url || data.redirect_url || '';

    if (url) {
      res.status(200).json({ success: true, url: url });
    } else {
      res.status(400).json({ success: false, error: 'No URL from ChatGPT. Already subscribed?', data: data });
    }

  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
