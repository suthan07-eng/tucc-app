// Browser PDF text extraction for play-cricket scorecards.
// pdfjs gives glyph items with x/y positions; we group by row (y) and insert a
// space where the x-gap between glyphs is large, reconstructing the tabular
// column layout so scorecardParser can read it.

import * as pdfjsNs from 'pdfjs-dist/legacy/build/pdf.js'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.js?url'

// UMD build may expose the API on the namespace or on `.default` depending on
// the bundler's interop — normalise to a single object.
const pdfjs = pdfjsNs.getDocument ? pdfjsNs : (pdfjsNs.default || pdfjsNs)
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractScorecardText(arrayBuffer) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  const lines = []
  for (let pn = 1; pn <= doc.numPages; pn++) {
    const page = await doc.getPage(pn)
    const tc = await page.getTextContent()
    const rows = {}
    for (const it of tc.items) {
      if (typeof it.str !== 'string') continue
      const y = Math.round(it.transform[5])
      const x = it.transform[4]
      ;(rows[y] = rows[y] || []).push({ x, s: it.str, w: it.width || it.str.length * 3 })
    }
    for (const y of Object.keys(rows).map(Number).sort((a, b) => b - a)) {
      const items = rows[y].sort((a, b) => a.x - b.x)
      let line = '', lastEnd = null
      for (const it of items) {
        if (lastEnd !== null && it.x - lastEnd > 2.0) line += ' '
        line += it.s
        lastEnd = it.x + it.w
      }
      lines.push(line)
    }
  }
  return lines.join('\n').replace(/ /g, ' ').replace(/ /g, ' ').replace(/ /g, ' ')
}
