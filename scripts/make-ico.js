const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'build', 'icon.png');
const icoPath = path.join(__dirname, '..', 'build', 'icon.ico');
const publicIcoPath = path.join(__dirname, '..', 'public', 'icon.ico');

const pngBuffer = fs.readFileSync(pngPath);
const pngSize = pngBuffer.length;

// Header (6 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = ICO
header.writeUInt16LE(1, 4); // count: 1 image

// Directory Entry (16 bytes)
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0); // width: 0 = 256px
entry.writeUInt8(0, 1); // height: 0 = 256px
entry.writeUInt8(0, 2); // color count: 0
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(pngSize, 8); // size of image data
entry.writeUInt32LE(22, 12); // offset: 6 + 16 = 22

const icoBuffer = Buffer.concat([header, entry, pngBuffer]);

fs.writeFileSync(icoPath, icoBuffer);
fs.writeFileSync(publicIcoPath, icoBuffer);

console.log('✅ Compliant 256x256 ICO generated successfully!');
console.log('Size:', icoBuffer.length, 'bytes');
