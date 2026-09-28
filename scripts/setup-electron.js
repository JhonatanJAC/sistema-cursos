const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Configurando Electron local ---');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron', 'Cache');
console.log('Buscando en cache:', cacheDir);

let zipPath = null;
if (fs.existsSync(cacheDir)) {
  const dirs = fs.readdirSync(cacheDir);
  for (const d of dirs) {
    const full = path.join(cacheDir, d);
    if (fs.statSync(full).isDirectory()) {
      const files = fs.readdirSync(full);
      for (const f of files) {
        if (f.startsWith('electron-') && f.endsWith('.zip')) {
          zipPath = path.join(full, f);
          break;
        }
      }
    }
  }
}

const targetDist = path.join(__dirname, '..', 'node_modules', 'electron', 'dist');
const pathFile = path.join(__dirname, '..', 'node_modules', 'electron', 'path.txt');

if (!fs.existsSync(targetDist)) {
  fs.mkdirSync(targetDist, { recursive: true });
}

if (zipPath && fs.existsSync(zipPath)) {
  console.log('Encontrado zip en cache:', zipPath);
  console.log('Tamaño:', (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2), 'MB');
  
  // Extraer con tar
  try {
    console.log('Extrayendo con tar...');
    execSync(`tar -xf "${zipPath}" -C "${targetDist}"`, { stdio: 'inherit' });
    fs.writeFileSync(pathFile, 'electron.exe');
    console.log('✅ Electron extraído con éxito!');
  } catch (err) {
    console.error('Error al extraer:', err.message);
  }
} else {
  console.log('No se encontró zip en cache, ejecutando npm run postinstall de electron...');
  try {
    execSync('npm rebuild electron', { stdio: 'inherit' });
  } catch (err) {
    console.error('Error en npm rebuild:', err.message);
  }
}

// Verificar
if (fs.existsSync(path.join(targetDist, 'electron.exe'))) {
  console.log('✅ electron.exe existe en', targetDist);
  fs.writeFileSync(pathFile, 'electron.exe');
} else {
  console.error('❌ electron.exe todavía no existe');
}
