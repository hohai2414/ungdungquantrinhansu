import {build} from 'esbuild';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
await build({entryPoints:['client.js'],bundle:true,outfile:'dist/client.js',minify:true});
const html=readFileSync('index.html','utf8').replace('/*STYLE*/',()=>readFileSync('style.css','utf8')).replace('/*CLIENT*/',()=>readFileSync('dist/client.js','utf8').replace(/<\/script/gi,'<\\/script'));
mkdirSync('dist/server',{recursive:true});
mkdirSync('public',{recursive:true});
writeFileSync('public/index.html',html);
writeFileSync('generated-html.js','export default '+JSON.stringify(html));
await build({entryPoints:['worker/app.js'],bundle:true,format:'esm',platform:'neutral',outfile:'dist/server/index.js',minify:true});
// Vercel's connected Turso credentials are server-side build/runtime variables.
// Apply the versioned schema before the deployment starts serving requests.
if(process.env.VERCEL==='1'&&process.env.TURSO_DATABASE_URL&&process.env.TURSO_AUTH_TOKEN){
  const {createClient}=await import('@libsql/client');
  const {migrate}=await import('./scripts/migrate-vercel.mjs');
  const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
  try{await migrate(client);console.log('Vercel database schema ready.')}catch{throw new Error('Không thể áp dụng schema Turso. Kiểm tra kết nối và quyền database trong Vercel.')}finally{client.close()}
}
