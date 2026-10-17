// 把 images/ 下的原图（1.png、2.png…）压缩成网页用的 webp：
//   public/images/N-sm.webp  宽 840，用于跑马灯和小图
//   public/images/N-lg.webp  宽 1920，用于项目大图
// 原图是白底黑线的简笔画时，会转成和首页头像同款的「深色卡片 + 浅色线条」，
// 放在深色网页上和头像风格一致。手绘视频用的仍是 images/ 里的原图。
// 用法：npm run images          （加 --keep-colors 则保持原图配色）
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'images'
const OUT = 'public/images'
const SIZES = [
  { suffix: 'sm', width: 840, quality: 78 },
  { suffix: 'lg', width: 1920, quality: 82 },
]
const CARD = [0x15, 0x16, 0x1a] // 卡片底色，比页面 #0C0C0C 略亮一点，看得出图的边界
const LINE = [0xd7, 0xe2, 0xea] // 线条颜色，和头像、正文同色
const keepColors = process.argv.includes('--keep-colors')

/** 白底黑线 → 深底浅线：越黑的地方越接近线条色 */
async function toDarkLineArt(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 3)
  for (let i = 0; i < data.length; i++) {
    const a = Math.min(1, Math.max(0, (235 - data[i]) / 195))
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(CARD[c] + a * (LINE[c] - CARD[c]))
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
}

await mkdir(OUT, { recursive: true })
const files = (await readdir(SRC)).filter((f) => /^\d+\.(png|jpe?g|webp)$/i.test(f))
if (files.length === 0) {
  console.log(`${SRC}/ 里没有形如 1.png 的图片`)
  process.exit(0)
}

for (const file of files.sort((a, b) => parseInt(a) - parseInt(b))) {
  const name = path.parse(file).name
  const src = path.join(SRC, file)
  for (const { suffix, width, quality } of SIZES) {
    const out = path.join(OUT, `${name}-${suffix}.webp`)
    const base = keepColors ? sharp(src) : await toDarkLineArt(src)
    const info = await base.resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out)
    console.log(`${file} → ${out} (${Math.round(info.size / 1024)} KB)`)
  }
}
