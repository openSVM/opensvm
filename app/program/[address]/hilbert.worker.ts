// Pre-compute Hilbert curve mappings
const rot = (x: number): number => {
  switch(x) {
    case 1: return 2;
    case 2: return 1;
    default: return x;
  }
};

const graycode = (x: number): number => {
  switch(x) {
    case 3: return 2;
    case 2: return 3;
    default: return x;
  }
};

const hilbert_index = (curve: number, x: number, y: number): number => {
  let h = 0;
  let e = 0;
  let d = 0;
  for (let i = 0; i < curve; i++) {
    const off = curve - i - 1;
    const a = (y >> off) & 1;
    const b = (x >> off) & 1;
    let l = a | b << 1;
    l = l ^ e;
    if (d === 0) l = rot(l);
    const w = graycode(l);
    if (w == 3) e = 3-e;
    h = (h << 2) | w;
    if (w === 0 || w == 3) d ^= 1;
  }
  return h;
};

// Color lookup table
const byteRanges = [
  { start: 0x00, end: 0x00, label: 'NULL', color: '#1a1a1a' },
  { start: 0x01, end: 0x08, label: 'Control 1', color: '#00ff00' },
  { start: 0x09, end: 0x0D, label: 'Whitespace', color: '#00cc00' },
  { start: 0x0E, end: 0x1F, label: 'Control 2', color: '#009900' },
  { start: 0x20, end: 0x2F, label: 'Punctuation 1', color: '#66ffff' },
  { start: 0x30, end: 0x39, label: 'Digits', color: '#00ffff' },
  { start: 0x3A, end: 0x40, label: 'Punctuation 2', color: '#00cccc' },
  { start: 0x41, end: 0x5A, label: 'Uppercase', color: '#3399ff' },
  { start: 0x5B, end: 0x60, label: 'Punctuation 3', color: '#0066cc' },
  { start: 0x61, end: 0x7A, label: 'Lowercase', color: '#0033cc' },
  { start: 0x7B, end: 0x7E, label: 'Punctuation 4', color: '#000099' },
  { start: 0x7F, end: 0x7F, label: 'DEL', color: '#ff0000' },
  { start: 0x80, end: 0x9F, label: 'Extended Control', color: '#ff66ff' },
  { start: 0xA0, end: 0xBF, label: 'Extended ASCII 1', color: '#ff00ff' },
  { start: 0xC0, end: 0xDF, label: 'Extended ASCII 2', color: '#cc00cc' },
  { start: 0xE0, end: 0xEF, label: 'Extended ASCII 3', color: '#990099' },
  { start: 0xF0, end: 0xF7, label: 'High Control 1', color: '#ffff00' },
  { start: 0xF8, end: 0xFE, label: 'High Control 2', color: '#cccc00' },
  { start: 0xFF, end: 0xFF, label: '0xFF', color: '#ffffff' }
];

const colorTable = new Array(256).fill('#000000').map((_, i) => {
  for (const range of byteRanges) {
    if (i >= range.start && i <= range.end) {
      return range.color;
    }
  }
  return '#000000';
});

// Pre-compute RGB values for color table
const rgbTable = new Uint8Array(256 * 3);
colorTable.forEach((color, i) => {
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);
  rgbTable[i * 3] = r;
  rgbTable[i * 3 + 1] = g;
  rgbTable[i * 3 + 2] = b;
});

// Process image data in chunks
interface WorkerMessage {
  data: ArrayBuffer;
  baseSize: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { data, baseSize } = e.data;
  const uint8Data = new Uint8Array(data);
  
  // Calculate the Hilbert curve order based on baseSize
  const order = Math.ceil(Math.log2(baseSize));
  const gridSize = 1 << order; // Power of 2 that's >= baseSize
  
  // Create lookup table for this specific size
  const hilbertLookup = new Uint32Array(gridSize * gridSize);
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      hilbertLookup[y * gridSize + x] = hilbert_index(order, x, y);
    }
  }

  const totalPixels = baseSize * baseSize;
  const CHUNK_SIZE = 200000;
  const maxHilbertIndex = gridSize * gridSize - 1;
  const dataScale = uint8Data.length / maxHilbertIndex;

  // Process in chunks
  const processChunk = (start: number) => {
    const end = Math.min(start + CHUNK_SIZE, totalPixels);
    const imageData = new Uint8ClampedArray((end - start) * 4);

    for (let i = 0; i < imageData.length; i += 4) {
      const pixelIndex = start + (i / 4);
      const x = pixelIndex % baseSize;
      const y = Math.floor(pixelIndex / baseSize);
      
      // Skip if we're outside the valid grid area
      if (x >= gridSize || y >= gridSize) {
        imageData[i] = 0;
        imageData[i+1] = 0;
        imageData[i+2] = 0;
        imageData[i+3] = 255;
        continue;
      }
      
      const hilbertIndex = hilbertLookup[y * gridSize + x];
      const dataOffset = Math.min(Math.floor(hilbertIndex * dataScale), uint8Data.length - 1);
      
      const byte = uint8Data[dataOffset];
      const rgbOffset = byte * 3;
      imageData[i] = rgbTable[rgbOffset];
      imageData[i+1] = rgbTable[rgbOffset + 1];
      imageData[i+2] = rgbTable[rgbOffset + 2];
      imageData[i+3] = 255;
    }

    const transfer: Transferable[] = [imageData.buffer];
    self.postMessage({ imageData, chunkStart: start, chunkEnd: end }, { transfer });

    // Process next chunk if needed
    if (end < totalPixels) {
      setTimeout(() => processChunk(end), 0);
    }
  };

  // Start processing first chunk
  processChunk(0);
};
