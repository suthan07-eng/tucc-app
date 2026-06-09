export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { to, subject, html, cc, reply_to, attachments } = body;

    const resendKey = process.env.VITE_RESEND_API_KEY;
    const fromEmail = process.env.VITE_ADMIN_FROM_EMAIL || 'onboarding@resend.dev';

    const payload = { from: fromEmail, to, subject, html }
    if (cc && cc.length) payload.cc = cc
    if (reply_to) payload.reply_to = reply_to
    // attachments: [{ filename, content (base64) }]
    if (attachments && attachments.length) payload.attachments = attachments

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Resend error' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
