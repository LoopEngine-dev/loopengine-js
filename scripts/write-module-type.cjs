const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const esmDir = path.join(dist, 'esm');
const cjsDir = path.join(dist, 'cjs');

if (fs.existsSync(esmDir)) {
  fs.writeFileSync(path.join(esmDir, 'package.json'), JSON.stringify({ type: 'module' }));
}
if (fs.existsSync(cjsDir)) {
  fs.writeFileSync(path.join(cjsDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
}
