'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function build() {
  const root = path.join(__dirname, '..');
  const source = path.join(root, 'src', 'assets', 'vipercue-viper.svg');
  const iconset = path.join(root, 'assets', 'ViperCue.iconset');
  fs.mkdirSync(iconset, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    execFileSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), source, '--out', path.join(iconset, `icon_${size}x${size}.png`)], { stdio: 'ignore' });
    const double = size * 2;
    execFileSync('sips', ['-s', 'format', 'png', '-z', String(double), String(double), source, '--out', path.join(iconset, `icon_${size}x${size}@2x.png`)], { stdio: 'ignore' });
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(root, 'assets', 'ViperCue.icns')]);
}

try { build(); } catch (error) { console.error(error); process.exitCode = 1; }
