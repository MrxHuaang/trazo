// Renderiza fotogramas sueltos para revisar el diseno sin abrir Studio.
// Uso: node scripts/fotogramas.mjs 120 s4+30 stack+200 cierre+90
// Un numero solo es el fotograma absoluto; sN+k, portada+k, stack+k y cierre+k cuentan desde el inicio de esa escena.
// Los PNG quedan en out/fotogramas/.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

// Copia de TIEMPO (src/tema.ts) en cuadros a 30 fps. No se importa porque tema.ts es TypeScript.
const T = {portada: 195, tarjeta: 78, marcador: 240, stack: 300, transicion: 36};

const pedidos = process.argv.slice(2);
if (pedidos.length === 0) {
  console.error('Indica uno o mas fotogramas.');
  process.exit(1);
}

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id: 'Trazo', inputProps: {}});
const {duraciones} = composition.props;
console.log(`Trazo: ${composition.durationInFrames} cuadros (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);

const inicios = {portada: 0};
let cursor = T.portada - T.transicion;
duraciones.forEach((s, i) => {
  inicios[`s${i + 1}`] = cursor;
  cursor += T.tarjeta + Math.ceil((s ?? T.marcador / 30) * 30) - T.transicion;
});
inicios.stack = cursor;
inicios.cierre = cursor + T.stack - T.transicion;

for (const pedido of pedidos) {
  const m = pedido.match(/^([a-z]+\d*)\+(\d+)$/);
  const frame = m ? inicios[m[1]] + Number(m[2]) : Number(pedido);
  const output = path.resolve('out/fotogramas', `${pedido.replace('+', '_')}.png`);
  await renderStill({serveUrl, composition, frame, output, inputProps: composition.props, imageFormat: 'png'});
  console.log(`${pedido} = ${frame} -> ${output}`);
}
