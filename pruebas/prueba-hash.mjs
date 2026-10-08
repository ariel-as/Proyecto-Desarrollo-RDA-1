import fs from 'fs';
import path from 'path';
const raiz = process.cwd();
const htmlPath = path.join(raiz, 'index.html');
const appPath = path.join(raiz, 'js', 'app.js');
function fallo(m){ console.log('FALLA: '+m); process.exit(1); }
function ok(m){ console.log('OK: '+m); }
if(!fs.existsSync(htmlPath)) fallo('no index');
const html = fs.readFileSync(htmlPath,'utf8');
if(html.includes('pf-posicion-pendiente')) fallo('html tiene pf');
const idx = html.indexOf('<script>');
if(idx>=0){ const i2 = html.indexOf('</script>',idx); if(i2>idx){ const b=html.slice(idx,i2+9); if(b.includes('pf-posicion-pendiente')||b.includes('location.hash')) fallo('inline'); }}
ok('html ok');
if(!fs.existsSync(appPath)) fallo('no app');
const js = fs.readFileSync(appPath,'utf8');
if(!js.includes('location.hash')) fallo('no hash');
if(!js.includes('pf-posicion-pendiente')) fallo('no pf');
if(!js.includes('setTimeout')) fallo('no st');
if(!js.includes("addEventListener('load'")) fallo('no load');
const ss = js.indexOf('if (location.hash)');
if(ss<0) fallo('no if');
let d=0,e=ss;
for(let i=ss;i<js.length;i++){ if(js[i]==='{'){d++;} if(js[i]==='}'){d--; if(d===0){e=i;break;}} }
const blockJs = js.slice(ss,e+1);
if(!blockJs.includes('pf-posicion-pendiente')) fallo('no pf in block');
ok('js ok');
console.log('TODAS LAS PRUEBAS PASARON');
