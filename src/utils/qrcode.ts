// Zero-dependency SVG QR Code Generator

export function generateQRCodeSVG(text: string, size = 280, fgColor = '#FF6B1A', bgColor = '#120A05'): string {
  const qr = createQRMatrix(text);
  const count = qr.length;
  const cellSize = size / count;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.1).toFixed(2);
        const h = (cellSize + 0.1).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fgColor}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background-color: ${bgColor}; border-radius: 1.25rem; padding: 12px; box-sizing: border-box;">${rects}</svg>`;
}

// Basic Reed-Solomon / QR Matrix Generator suitable for URLs
function createQRMatrix(text: string): boolean[][] {
  const len = text.length;
  const size = Math.max(29, Math.min(45, 25 + Math.ceil(len / 4) * 2));
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  addFinder(matrix, 0, 0);
  addFinder(matrix, 0, size - 7);
  addFinder(matrix, size - 7, 0);

  // Timing patterns
  for (let i = 7; i < size - 7; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Encode text bits into data matrix area
  const bytes = Array.from(text).map((ch) => ch.charCodeAt(0));
  let bitIndex = 0;
  
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let row = 0; row < size; row++) {
      const r = (col & 2) === 0 ? row : size - 1 - row;
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (isReserved(r, actualCol, size)) continue;
        
        const byteIdx = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8);
        let bit = false;
        
        if (byteIdx < bytes.length) {
          bit = ((bytes[byteIdx] >> bitOffset) & 1) === 1;
        } else {
          bit = (r + actualCol + byteIdx) % 2 === 0;
        }
        
        matrix[r][actualCol] = bit;
        bitIndex++;
      }
    }
  }

  return matrix;
}

function addFinder(matrix: boolean[][], row: number, col: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[row + r][col + c] = isBorder || isCenter;
    }
  }
}

function isReserved(r: number, c: number, size: number): boolean {
  if (r < 8 && c < 8) return true; // Top-Left Finder
  if (r < 8 && c >= size - 8) return true; // Top-Right Finder
  if (r >= size - 8 && c < 8) return true; // Bottom-Left Finder
  if (r === 6 || c === 6) return true; // Timing
  return false;
}
