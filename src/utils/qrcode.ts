// Standard-Compliant SVG QR Code Generator (Zero Dependencies)
// Generates camera-scannable QR code SVGs with Reed-Solomon Error Correction.

const GF_EXP: number[] = new Array(512);
const GF_LOG: number[] = new Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 285; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (285)
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsPolyMul(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return result;
}

function getRsGeneratorPoly(deg: number): number[] {
  let g = [1];
  for (let i = 0; i < deg; i++) {
    g = rsPolyMul(g, [1, GF_EXP[i]]);
  }
  return g;
}

function calcReedSolomon(data: number[], ecCount: number): number[] {
  const gen = getRsGeneratorPoly(ecCount);
  const res = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    res[i] = data[i];
  }
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

interface QRVersionConfig {
  version: number;
  size: number;
  dataBytes: number;
  ecBytes: number;
  alignPos: number[];
}

const QR_CONFIGS: QRVersionConfig[] = [
  { version: 1, size: 21, dataBytes: 14, ecBytes: 10, alignPos: [] },
  { version: 2, size: 25, dataBytes: 26, ecBytes: 16, alignPos: [6, 18] },
  { version: 3, size: 29, dataBytes: 42, ecBytes: 26, alignPos: [6, 22] },
  { version: 4, size: 33, dataBytes: 62, ecBytes: 36, alignPos: [6, 26] },
  { version: 5, size: 37, dataBytes: 84, ecBytes: 48, alignPos: [6, 30] },
  { version: 6, size: 41, dataBytes: 106, ecBytes: 64, alignPos: [6, 34] },
  { version: 7, size: 45, dataBytes: 122, ecBytes: 72, alignPos: [6, 22, 38] },
  { version: 8, size: 49, dataBytes: 152, ecBytes: 88, alignPos: [6, 24, 42] },
  { version: 9, size: 53, dataBytes: 180, ecBytes: 110, alignPos: [6, 26, 46] },
  { version: 10, size: 57, dataBytes: 213, ecBytes: 130, alignPos: [6, 28, 50] },
];

export function generateQRCodeSVG(
  text: string,
  size = 280,
  fgColor = '#000000',
  bgColor = '#FFFFFF'
): string {
  const bytes = Array.from(new TextEncoder().encode(text));
  
  // Find fitting version
  let config = QR_CONFIGS.find((c) => bytes.length + 3 <= c.dataBytes);
  if (!config) {
    config = QR_CONFIGS[QR_CONFIGS.length - 1];
  }

  const { size: qrSize, dataBytes, ecBytes, alignPos } = config;
  
  // 1. Build Data Stream (Byte Mode: 0100 + 8-bit length + data + padding)
  const bitBuf: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitBuf.push((val >> i) & 1);
    }
  };

  pushBits(4, 4); // Mode: Byte
  pushBits(Math.min(bytes.length, 255), 8); // Count (8 bits for V1-V9)
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (4 zero bits)
  pushBits(0, Math.min(4, dataBytes * 8 - bitBuf.length));

  // Byte alignment
  while (bitBuf.length % 8 !== 0) {
    bitBuf.push(0);
  }

  // Pad bytes
  const data: number[] = [];
  for (let i = 0; i < bitBuf.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitBuf[i + j];
    }
    data.push(byteVal);
  }

  let pad = 0xec;
  while (data.length < dataBytes) {
    data.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  // 2. Error Correction Codewords
  const ecData = calcReedSolomon(data, ecBytes);
  const fullCodewords = [...data, ...ecData];

  // 3. Matrix Allocation & Reservation
  const grid: (boolean | null)[][] = Array.from({ length: qrSize }, () =>
    Array(qrSize).fill(null)
  );

  // Reserve Finders
  const addFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < qrSize && nc >= 0 && nc < qrSize) {
          const isDark =
            r >= 0 &&
            r <= 6 &&
            c >= 0 &&
            c <= 6 &&
            (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          grid[nr][nc] = isDark;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, qrSize - 7);
  addFinder(qrSize - 7, 0);

  // Reserve Alignments
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i];
      const c = alignPos[j];
      if (grid[r][c] !== null) continue; // Skip overlaps with finders
      for (let ar = -2; ar <= 2; ar++) {
        for (let ac = -2; ac <= 2; ac++) {
          const isDark =
            Math.abs(ar) === 2 || Math.abs(ac) === 2 || (ar === 0 && ac === 0);
          grid[r + ar][c + ac] = isDark;
        }
      }
    }
  }

  // Reserve Timing Patterns
  for (let i = 8; i < qrSize - 8; i++) {
    if (grid[6][i] === null) grid[6][i] = i % 2 === 0;
    if (grid[i][6] === null) grid[i][6] = i % 2 === 0;
  }

  // Dark Module
  grid[qrSize - 8][8] = true;

  // Reserve Format Info Area
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
    if (i < 8) {
      if (grid[8][qrSize - 1 - i] === null) grid[8][qrSize - 1 - i] = false;
      if (grid[qrSize - 1 - i][8] === null) grid[qrSize - 1 - i][8] = false;
    }
  }

  // 4. Place Data Bits with Mask 0: (row + col) % 2 === 0
  let bitIdx = 0;
  const totalBits = fullCodewords.length * 8;

  for (let col = qrSize - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip timing column
    for (let row = 0; row < qrSize; row++) {
      const r = (col & 2) === 0 ? row : qrSize - 1 - row;
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (grid[r][actualCol] !== null) continue;

        let bit = false;
        if (bitIdx < totalBits) {
          const bytePos = Math.floor(bitIdx / 8);
          const bitPos = 7 - (bitIdx % 8);
          bit = ((fullCodewords[bytePos] >> bitPos) & 1) === 1;
          bitIdx++;
        }

        // Apply Mask 0: (r + actualCol) % 2 === 0
        const mask = (r + actualCol) % 2 === 0;
        grid[r][actualCol] = bit !== mask;
      }
    }
  }

  // 5. Draw Format Information (Level M, Mask 0 -> 0x5370)
  const formatBits = 0x5370; // Pre-calculated BCH(15,5) format info for M / Mask 0
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    if (i < 6) grid[8][i] = bit;
    else if (i < 8) grid[8][i + 1] = bit;
    else if (i === 8) grid[7][8] = bit;
    else grid[14 - i][8] = bit;

    if (i < 8) grid[qrSize - 1 - i][8] = bit;
    else grid[8][qrSize - 15 + i] = bit;
  }

  // 6. Generate SVG string
  const margin = 2;
  const totalModules = qrSize + margin * 2;
  const cellSize = (size / totalModules).toFixed(3);

  let rects = '';
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (grid[r][c]) {
        const x = ((c + margin) * parseFloat(cellSize)).toFixed(2);
        const y = ((r + margin) * parseFloat(cellSize)).toFixed(2);
        const w = (parseFloat(cellSize) + 0.15).toFixed(2);
        const h = (parseFloat(cellSize) + 0.15).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fgColor}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background-color: ${bgColor}; border-radius: 1rem;"><rect width="100%" height="100%" fill="${bgColor}"/>${rects}</svg>`;
}
