const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Function to generate an uncompressed RGBA PNG buffer from pixel function
function createPng(width, height, pixelFn) {
  const rowSize = width * 4 + 1; // 1 filter byte (0) + 4 bytes RGBA per pixel
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idat = compressed;
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Icon generator (Terracotta rounded rectangle with white "Q" tile)
function iconPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background rounded rectangle check
  const pad = 0.06;
  const rx = 0.22;
  const cx = Math.max(pad + rx, Math.min(1 - pad - rx, nx));
  const cy = Math.max(pad + rx, Math.min(1 - pad - rx, ny));
  const dist = Math.hypot(nx - cx, ny - cy);

  if (nx < pad || nx > 1 - pad || ny < pad || ny > 1 - pad || dist > rx) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Base terracotta gradient
  const r = Math.round(224 + (200 - 224) * ny);
  const g = Math.round(90 + (74 - 90) * ny);
  const b = Math.round(56 + (41 - 56) * ny);

  // Stylized Q letter mark: outer circle radius 0.22, inner circle radius 0.14
  const qCx = 0.5;
  const qCy = 0.46;
  const qDist = Math.hypot(nx - qCx, ny - qCy);

  const isQCircle = qDist <= 0.22 && qDist >= 0.14;

  // Q diagonal tail: from (0.55, 0.52) to (0.74, 0.71)
  const tx = nx - 0.55;
  const ty = ny - 0.52;
  const proj = (tx + ty) / 2;
  const perp = Math.abs(tx - ty) / Math.SQRT2;
  const isQTail = proj >= 0 && proj <= 0.22 && perp <= 0.04;

  if (isQCircle || isQTail) {
    return [255, 255, 255, 255]; // Pure White Lettermark
  }

  return [r, g, b, 255];
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, iconPixel));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, iconPixel));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, iconPixel));

console.log('✓ Generated icon-192.png, icon-512.png, and apple-touch-icon.png');
