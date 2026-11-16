// tsc only emits JS; the node icon and any .json descriptions must be copied too.
const fs = require('fs');
const path = require('path');
const pairs = [
  ['nodes/Evolution/evolution.svg', 'dist/nodes/Evolution/evolution.svg'],
];
for (const [from, to] of pairs) {
  const dest = path.join(__dirname, '..', to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', from), dest);
  console.log('copied', to);
}
