import fs from 'node:fs';
import path from 'node:path';

const distIndex = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndex, 'utf8');

html = html.replace(
  /<script\s+src="([^"]+\.js)"\s+defer><\/script>/,
  '<script type="module" src="$1"></script>'
);

fs.writeFileSync(distIndex, html, 'utf8');
console.log('Updated dist/index.html to use type="module".');
