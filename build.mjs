import {build} from 'esbuild';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
await build({entryPoints:['client.js'],bundle:true,outfile:'dist/client.js',minify:true});
const html=readFileSync('index.html','utf8').replace('/*STYLE*/',()=>readFileSync('style.css','utf8')).replace('/*CLIENT*/',()=>readFileSync('dist/client.js','utf8').replace(/<\/script/gi,'<\\/script'));
mkdirSync('dist/server',{recursive:true});
mkdirSync('public',{recursive:true});
writeFileSync('public/index.html',html);
writeFileSync('generated-html.js','export default '+JSON.stringify(html));
await build({entryPoints:['worker/app.js'],bundle:true,format:'esm',platform:'neutral',outfile:'dist/server/index.js',minify:true});
