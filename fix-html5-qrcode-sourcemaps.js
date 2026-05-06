const fs = require('fs');
const path = require('path');
const baseDir = path.join(process.cwd(), 'node_modules', 'html5-qrcode');
const dirs = ['esm', 'es2015'];
function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) walk(itemPath);
    if (item.isFile() && item.name.endsWith('.map')) {
      const data = fs.readFileSync(itemPath, 'utf8');
      let map;
      try {
        map = JSON.parse(data);
      } catch (e) {
        return;
      }
      if (!Array.isArray(map.sources)) return;
      const dirName = path.dirname(itemPath);
      let changed = false;
      const fixedSources = map.sources.map(source => {
        if (typeof source !== 'string') return source;
        let candidate = source;
        if (fs.existsSync(path.resolve(dirName, candidate))) return candidate;
        while (candidate.startsWith('../')) {
          const reduced = candidate.replace(/^\.\.\//, '');
          if (fs.existsSync(path.resolve(dirName, reduced))) {
            candidate = reduced;
            changed = true;
            break;
          }
          candidate = reduced;
        }
        return candidate;
      });
      if (changed) {
        map.sources = fixedSources;
        fs.writeFileSync(itemPath, JSON.stringify(map));
        console.log('Fixed map', itemPath);
      }
    }
  });
}
for (const dir of dirs) {
  const fullDir = path.join(baseDir, dir);
  if (fs.existsSync(fullDir)) walk(fullDir);
}
