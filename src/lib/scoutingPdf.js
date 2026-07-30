// Generates a clean, printable opposition scouting report PDF from the Analyse
// page data — designed to be shared (e.g. WhatsApp), NOT a screenshot of the UI.
// jsPDF + autotable are lazy-imported so they only load when a download runs.

const NAVY = [13, 27, 62]
const GOLD = [233, 160, 32]
const RED = [198, 40, 40]
const GREEN = [22, 128, 61]
const AMBER = [180, 120, 20]
const GREY = [90, 100, 115]

const tagColor = (t) => (t === 'AVOID' ? RED : t === 'TARGET' ? GREEN : AMBER)
const nameOf = (a) => a?.opponent_players?.player_name || '—'
const round = (v) => Math.round(Number(v) || 0)

export async function generateScoutingPDF({ opp, batAnalysis = [], bowlAnalysis = [], arAnalysis = [], batStats = [], bowlStats = [] }) {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable') // side-effect: registers doc.autoTable

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 40
  const oppName = opp?.name || 'Opponent'
  const dateStr = opp?.match_date ? new Date(opp.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  // ── Header band ──
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 84, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 84, W, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17)
  doc.text('TAMIL UNITED CC', M, 38)
  doc.setTextColor(...GOLD); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('OPPOSITION SCOUTING REPORT', M, 55)
  doc.setTextColor(220, 226, 240); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - M, 38, { align: 'right' })

  // ── Opponent title ──
  let y = 118
  doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.text(oppName, M, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...GREY)
  doc.text([opp?.season, dateStr].filter(Boolean).join('  ·  '), M, y + 16)
  y += 34

  // ── Summary ──
  if (opp?.notes) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 46, 60)
    const lines = doc.splitTextToSize(opp.notes, W - M * 2)
    doc.text(lines, M, y)
    y += lines.length * 13 + 8
  }

  // shared section header
  const section = (title, color = NAVY) => {
    if (y > doc.internal.pageSize.getHeight() - 90) { doc.addPage(); y = 50 }
    doc.setFillColor(...color); doc.rect(M, y, 4, 13, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...color)
    doc.text(title, M + 10, y + 11)
    y += 22
  }

  // ── Threat tables (batters / bowlers) ──
  const threatTable = (title, rows, color) => {
    if (!rows.length) return
    section(title, color)
    const sorted = [...rows].sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))
    doc.autoTable({
      startY: y,
      margin: { left: M, right: M },
      head: [['#', 'Player', 'Score', 'Threat', 'How to play']],
      body: sorted.map((a, i) => [i + 1, nameOf(a), round(a.composite_score), a.tag || '', a.how_to_play || '']),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, valign: 'top', textColor: [35, 40, 52], lineColor: [225, 228, 234], lineWidth: 0.5 },
      headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [246, 248, 251] },
      columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 96, fontStyle: 'bold' }, 2: { cellWidth: 34, halign: 'center', fontStyle: 'bold' }, 3: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }, 4: { cellWidth: 'auto' } },
      didParseCell: (d) => { if (d.section === 'body' && d.column.index === 3) d.cell.styles.textColor = tagColor(d.cell.raw) },
    })
    y = doc.lastAutoTable.finalY + 16
  }

  const arTable = () => {
    if (!arAnalysis.length) return
    section('TOP ALL-ROUNDERS', [124, 58, 237])
    const sorted = [...arAnalysis].sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))
    doc.autoTable({
      startY: y,
      margin: { left: M, right: M },
      head: [['#', 'Player', 'Bat', 'Bowl', 'Overall', 'Threat', 'How to play']],
      body: sorted.map((a, i) => [i + 1, nameOf(a), round(a.batting_score), round(a.bowling_score), round(a.composite_score), a.tag || '', a.how_to_play || '']),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, valign: 'top', textColor: [35, 40, 52], lineColor: [225, 228, 234], lineWidth: 0.5 },
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [248, 246, 252] },
      columnStyles: { 0: { cellWidth: 18, halign: 'center' }, 1: { cellWidth: 92, fontStyle: 'bold' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 32, halign: 'center' }, 4: { cellWidth: 42, halign: 'center', fontStyle: 'bold' }, 5: { cellWidth: 46, halign: 'center', fontStyle: 'bold' }, 6: { cellWidth: 'auto' } },
      didParseCell: (d) => { if (d.section === 'body' && d.column.index === 5) d.cell.styles.textColor = tagColor(d.cell.raw) },
    })
    y = doc.lastAutoTable.finalY + 16
  }

  threatTable('TOP BATTERS TO WATCH', batAnalysis, NAVY)
  threatTable('TOP BOWLERS TO WATCH', bowlAnalysis, [136, 19, 55])
  arTable()

  // ── Full stats appendix ──
  if (batStats.length) {
    section('BATTING STATS (FULL SQUAD)')
    const sorted = [...batStats].sort((a, b) => (b.runs || 0) - (a.runs || 0))
    doc.autoTable({
      startY: y, margin: { left: M, right: M },
      head: [['Player', 'M', 'Inn', 'Runs', 'HS', 'Avg', 'SR', '50', '100']],
      body: sorted.map((b) => [nameOf(b), round(b.matches), round(b.innings), round(b.runs), `${round(b.high_score)}${b.high_score_not_out ? '*' : ''}`, (Number(b.avg) || 0).toFixed(1), (Number(b.strike_rate) || 0).toFixed(1), round(b.fifties), round(b.hundreds)]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: [35, 40, 52], lineColor: [225, 228, 234], lineWidth: 0.5 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 248, 251] },
      columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' } },
    })
    y = doc.lastAutoTable.finalY + 16
  }
  if (bowlStats.length) {
    section('BOWLING STATS (FULL SQUAD)')
    const sorted = [...bowlStats].sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
    doc.autoTable({
      startY: y, margin: { left: M, right: M },
      head: [['Player', 'Overs', 'Wkts', 'Runs', 'Best', 'Econ', 'Avg', '5w']],
      body: sorted.map((b) => [nameOf(b), (Number(b.overs) || 0).toFixed(1), round(b.wickets), round(b.runs), b.best_bowling || '—', (Number(b.economy_rate) || 0).toFixed(2), (Number(b.average) || 0).toFixed(1), round(b.five_wkt_haul)]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: [35, 40, 52], lineColor: [225, 228, 234], lineWidth: 0.5 },
      headStyles: { fillColor: [136, 19, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 246, 248] },
      columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'center', fontStyle: 'bold' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' } },
    })
  }

  // ── Footer on every page ──
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const H = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GREY)
    doc.text('Tamil United CC · tucc.club · Confidential — for team use only', M, H - 18)
    doc.text(`Page ${p} / ${pages}`, W - M, H - 18, { align: 'right' })
  }

  const safe = oppName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  doc.save(`TUCC-Scouting-${safe}.pdf`)
}
