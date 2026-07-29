// Simple Vercel Serverless Function to receive Telegram Orders
export default async function handler(req, res) {
  // Set CORS headers so your GitHub Pages frontend can fetch data
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { text, topic_id } = body;
    console.log("📥 Received Telegram Order:", text, "Topic:", topic_id);

    // Return received order confirmation
    return res.status(200).json({ 
      success: true, 
      message: "Order received successfully",
      order: { text, topic_id, receivedAt: new Date().toISOString() } 
    });
  }

  return res.status(200).json({ status: "API is active. Send POST requests to /api/orders" });
}
