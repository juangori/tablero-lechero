// Genera íconos PNG sólidos para la PWA sin dependencias externas.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return (buf) => {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
})()

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(CRC(body), 0)
  return Buffer.concat([len, body, crc])
}

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}

function makePng(size, bg, fg) {
  const [br, bgc, bb] = hex(bg)
  const [fr, fg2, fb] = hex(fg)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.30
  const r2 = size * 0.12
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filtro
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy)
      let r3 = br, g3 = bgc, b3 = bb
      if (d < r) {
        r3 = fr; g3 = fg2; b3 = fb
      }
      if (d < r2) {
        r3 = br; g3 = bgc; b3 = bb
      }
      raw[p++] = r3
      raw[p++] = g3
      raw[p++] = b3
      raw[p++] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/icon-192.png', makePng(192, '#325827', '#ffffff'))
writeFileSync('public/icon-512.png', makePng(512, '#325827', '#ffffff'))
console.log('Íconos generados: public/icon-192.png, public/icon-512.png')
