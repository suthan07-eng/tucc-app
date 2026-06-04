// Emails are sent via the /api/send-email Edge Function (api/send-email.js).
// The API key and sender address are kept server-side — never exposed to the browser.

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'suthan07@gmail.com'

async function sendEmail({ to, subject, html }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Email API error ${res.status}`)
  }
  return data
}

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const wrap = (body) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f2f7f4;padding:20px">
  <div style="background:linear-gradient(135deg,#0f3825,#1a5c38);padding:22px 28px;border-radius:12px 12px 0 0">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:28px">🏏</span>
      <div>
        <div style="color:#f5a623;font-weight:800;font-size:16px;letter-spacing:.5px">TAMIL UNITED CC</div>
        <div style="color:rgba(255,255,255,.6);font-size:12px">formerly known as DTU CC</div>
      </div>
    </div>
  </div>
  <div style="background:#ffffff;padding:28px;border-radius:0 0 12px 12px">
    ${body}
  </div>
  <div style="text-align:center;padding:14px;color:#9ca3af;font-size:12px">
    Tamil United Cricket Club · formerly known as DTU CC · Plymouth
  </div>
</div>`

function matchBox(match) {
  if (!match) return ''
  return `
  <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin-top:16px">
    <div style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Match Details</div>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:3px 0;color:#9ca3af;font-size:13px;width:80px">Date</td><td style="color:#111827;font-size:13px;font-weight:600">${fmtDate(match.date)}</td></tr>
      <tr><td style="padding:3px 0;color:#9ca3af;font-size:13px">Time</td><td style="color:#111827;font-size:13px;font-weight:600">${match.time || 'TBC'}</td></tr>
      <tr><td style="padding:3px 0;color:#9ca3af;font-size:13px">Venue</td><td style="color:#111827;font-size:13px;font-weight:600">${match.venue || 'TBC'}</td></tr>
      ${match.address ? `<tr><td style="padding:3px 0;color:#9ca3af;font-size:13px">Address</td><td style="color:#111827;font-size:13px">${match.address}</td></tr>` : ''}
      <tr><td style="padding:3px 0;color:#9ca3af;font-size:13px">Opponent</td><td style="color:#111827;font-size:13px;font-weight:600">${match.opponent || 'TBC'}</td></tr>
    </table>
  </div>`
}

// FIX 2 — sendAvailabilityConfirmation now also sends admin notification internally.
// playerMessage is the optional note left by available players.
export async function sendAvailabilityConfirmation(player, match, available, reason, playerMessage) {
  const statusBlock = available
    ? `<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0">
        <div style="color:#16a34a;font-size:15px;font-weight:700">✅ You're marked as AVAILABLE</div>
        <div style="color:#374151;margin-top:6px;font-size:14px">Great! We'll see you on the pitch Sunday. 🏏</div>
       </div>`
    : `<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0">
        <div style="color:#dc2626;font-size:15px;font-weight:700">❌ Marked as UNAVAILABLE</div>
        ${reason ? `<div style="color:#374151;margin-top:8px;font-size:14px"><strong>Reason:</strong> ${reason}</div>` : ''}
       </div>`

  // 1. Player confirmation email
  await sendEmail({
    to: player.email,
    subject: `Tamil United CC — Availability confirmed for Sunday vs ${match?.opponent || 'upcoming match'}`,
    html: wrap(`
      <p style="color:#374151;font-size:15px;margin-bottom:4px">Hi <strong>${player.name}</strong>,</p>
      <p style="color:#6b7280;font-size:14px">Your availability has been recorded for Sunday's match vs <strong>${match?.opponent || 'upcoming match'}</strong>.</p>
      ${statusBlock}
      ${matchBox(match)}
      <p style="color:#9ca3af;font-size:13px;margin-top:20px">Need to change your response? Visit the availability page anytime before the deadline.</p>
    `),
  })

  // 2. Admin notification email (separate call)
  const adminStatusBlock = available
    ? `<div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:16px 0">
        <div style="color:#16a34a;font-weight:700;font-size:16px">✅ Available</div>
       </div>
       ${playerMessage ? `<div style="background:#e8f5ee;border-left:4px solid #1a5c38;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;color:#0f3825;font-size:14px"><strong>Player note:</strong> ${playerMessage}</div>` : ''}`
    : `<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:14px 18px;margin:16px 0">
        <div style="color:#dc2626;font-weight:700;font-size:16px">❌ Unavailable</div>
       </div>
       ${reason ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;color:#374151;font-size:14px"><strong>Reason:</strong> ${reason}</div>` : ''}`

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `${player.name} — ${available ? 'Available ✅' : 'Unavailable ❌'} for Sunday vs ${match?.opponent || 'upcoming match'}`,
    html: wrap(`
      <p style="color:#374151;font-size:15px;margin-bottom:4px">A player has submitted their availability:</p>
      <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
        <div style="font-weight:700;font-size:16px;color:#111827;margin-bottom:6px">${player.name}</div>
        ${player.role ? `<div style="color:#6b7280;font-size:13px;margin-bottom:4px">🏏 ${player.role}</div>` : ''}
        ${player.phone ? `<div style="color:#374151;font-size:13px;margin-bottom:4px">📱 ${player.phone}</div>` : ''}
        <div style="color:#374151;font-size:13px">📧 ${player.email}</div>
      </div>
      ${adminStatusBlock}
      ${matchBox(match)}
    `),
  })
}

export async function sendAdminAlert(match, player, available, reason) {
  const adminPanelUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '/admin'
  const statusColor = available ? '#16a34a' : '#dc2626'
  const statusText = available ? '✅ Available' : '❌ Unavailable'

  const html = wrap(`
    <p style="color:#374151;font-size:15px"><strong>${player.name}</strong> just submitted their availability.</p>
    <div style="background:${available ? '#f0fdf4' : '#fef2f2'};border-radius:10px;padding:12px 18px;margin:16px 0;display:inline-block">
      <span style="color:${statusColor};font-weight:700;font-size:16px">${statusText}</span>
    </div>
    ${reason ? `<div style="background:#f3f4f6;border-radius:8px;padding:12px 14px;margin-bottom:16px;color:#374151;font-size:14px"><strong>Reason:</strong> ${reason}</div>` : ''}
    <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px">
      <div style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Player Contact</div>
      <div style="color:#374151;font-size:14px">📧 ${player.email}</div>
      ${player.phone ? `<div style="color:#374151;font-size:14px;margin-top:4px">📱 ${player.phone}</div>` : ''}
      <div style="color:#9ca3af;font-size:13px;margin-top:4px">${player.role || ''}</div>
    </div>
    <div style="margin-top:20px">
      <a href="${adminPanelUrl}" style="background:#1a5c38;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">View Admin Panel →</a>
    </div>
  `)

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `${player.name} — ${available ? 'Available ✅' : 'Unavailable ❌'} for Sunday vs ${match?.opponent || 'upcoming match'}`,
    html,
  })
}

// FIX 3 — sendMessageToPlayer also sends an admin copy.
export async function sendMessageToPlayer(player, messageText, match, senderName) {
  const from = senderName || 'Tamil United CC'
  const subject = `Message from ${from} — Tamil United CC`

  const playerBody = `
    <p style="color:#374151;font-size:15px">Hi <strong>${player.name}</strong>,</p>
    <p style="color:#374151;font-size:15px;margin:12px 0 16px">You have a message from <strong>${from}</strong>:</p>
    <blockquote style="border-left:4px solid #1a5c38;margin:0 0 20px;padding:14px 18px;background:#e8f5ee;border-radius:0 8px 8px 0;color:#0f3825;font-size:15px;font-style:italic">
      ${messageText}
    </blockquote>
    ${match ? matchBox(match) : ''}
  `

  // 1. Player email
  await sendEmail({
    to: player.email,
    subject,
    html: wrap(playerBody),
  })

  // 2. Admin copy (separate call)
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `SENT COPY: ${subject}`,
    html: wrap(`
      <div style="background:#f3f4f6;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#374151;font-size:13px">
        📋 This is a copy of a message sent to <strong>${player.name}</strong>
      </div>
      ${playerBody}
    `),
  })
}

export async function sendBulkMessage(players, messageText, match, senderName) {
  await Promise.all(players.map((p) => sendMessageToPlayer(p, messageText, match, senderName)))
}
