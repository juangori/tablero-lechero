// Genera el favicon y los íconos PNG de la PWA a partir de scripts/cow-source.svg.
// Vaca blanca centrada sobre fondo verde de marca, con zona segura para que
// funcione como ícono "maskable" en Android/iOS.
//
//   npm run icons   (requiere la devDependency `sharp`)
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

const BG = '#3e6f2e' // campo-600 (verde de marca)
const FG = '#ffffff'
const CONTENT = 0.7 // fracción del lienzo que ocupa la vaca (deja zona segura)

// Path de la vaca desde el SVG fuente (única fuente de la silueta).
const source = readFileSync(new URL('./cow-source.svg', import.meta.url), 'utf8')
const cowPath = source.match(/<path[^>]*\sd="([^"]+)"/)[1]

const cowSvg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path fill="${fill}" d="${cowPath}"/></svg>`

// Render de la vaca y recorte para obtener su bounding box real en el espacio 512.
const rendered = await sharp(Buffer.from(cowSvg(FG))).png().toBuffer()
const trimmed = await sharp(rendered)
  .trim({ threshold: 1 })
  .toBuffer({ resolveWithObject: true })
const { info } = trimmed
const bbox = {
  x: -info.trimOffsetLeft,
  y: -info.trimOffsetTop,
  w: info.width,
  h: info.height,
}

// PNGs: cuadrado verde a sangre + vaca blanca centrada.
async function makePng(size, file) {
  const scale = (size * CONTENT) / Math.max(bbox.w, bbox.h)
  const cowW = Math.round(bbox.w * scale)
  const cowH = Math.round(bbox.h * scale)
  const cow = await sharp(trimmed.data).resize(cowW, cowH).png().toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: cow, left: Math.round((size - cowW) / 2), top: Math.round((size - cowH) / 2) }])
    .png()
    .toFile(file)
  console.log(`✓ ${file} (${size}×${size})`)
}

// favicon vectorial: cuadrado verde redondeado + vaca centrada en zona segura.
function makeFavicon(file) {
  const s = (512 * CONTENT) / Math.max(bbox.w, bbox.h)
  const tx = 256 - s * (bbox.x + bbox.w / 2)
  const ty = 256 - s * (bbox.y + bbox.h / 2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${BG}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">
    <path fill="${FG}" d="${cowPath}"/>
  </g>
</svg>
`
  writeFileSync(file, svg)
  console.log(`✓ ${file}`)
}

makeFavicon('public/favicon.svg')
await makePng(192, 'public/icon-192.png')
await makePng(512, 'public/icon-512.png')

// bbox para usar como viewBox del componente CowIcon.tsx
console.log(`\nbbox (viewBox del CowIcon): ${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}`)
