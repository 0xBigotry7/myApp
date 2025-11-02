// Simple icon generator - creates placeholder PNGs
// For production, use a tool like https://realfavicongenerator.net/

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create a simple SVG for each size
sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>
  <g transform="translate(256, 256)">
    <circle cx="0" cy="-60" r="50" fill="white" opacity="0.9"/>
    <path d="M-80,20 L80,20 L0,100 Z" fill="white" opacity="0.8"/>
    <rect x="-60" y="-20" width="120" height="30" rx="15" fill="white" opacity="0.7"/>
  </g>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

// Create apple-touch-icon
const appleSvg = `<svg width="180" height="180" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>
  <g transform="translate(256, 256)">
    <circle cx="0" cy="-60" r="50" fill="white" opacity="0.9"/>
    <path d="M-80,20 L80,20 L0,100 Z" fill="white" opacity="0.8"/>
    <rect x="-60" y="-20" width="120" height="30" rx="15" fill="white" opacity="0.7"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleSvg);
console.log('Created apple-touch-icon.svg');

console.log('\nNote: For production, convert SVGs to PNGs using a tool like:');
console.log('- https://realfavicongenerator.net/');
console.log('- Or use sharp/jimp npm packages');
