import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import app from './dist/server/index.js';
const sqlite=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
const wrap=(sql,args=[])=>({bind(...a){return wrap(sql,a)},async all(){return {results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}});
const DB={prepare:wrap,async batch(stmts){sqlite.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
async function call(path,body,cookie='',extra={}){const r=await app.fetch(new Request('http://test/api/'+path,{method:body?'POST':'GET',headers:{cookie,origin:'http://test',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),{DB,...extra});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const admin=(await call('login',{email:'admin@demo.vn',password:'NhanSu@2026'})).cookie;
const emp=(await call('login',{email:'employee@demo.vn',password:'NhanSu@2026'})).cookie;
assert.equal((await call('ai/reports',null,emp)).status,403);assert.equal((await call('ai/generate',{month:'2026-10'},emp)).status,403);
assert.equal((await call('ai/generate',{month:'2026-10'},admin)).status,503);
const env={OPENAI_API_KEY:'mock-only',AI_FETCH:async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.model,'gpt-4.1-mini');const data=JSON.parse(body.input);assert.equal(data.nhan_su.tong_ho_so,168);assert(!body.input.includes('@'));assert(!body.input.includes('Nguyễn'));assert(!body.input.includes('salary'));return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Báo cáo kiểm thử với 168 hồ sơ. <script>alert(1)</script>'}]}],usage:{input_tokens:250,output_tokens:20}}),{headers:{'content-type':'application/json'}})}};
assert.equal((await call('ai/generate',{month:'2026-99'},admin,env)).status,400);
const result=await call('ai/generate',{month:'2026-10'},admin,env);assert.equal(result.status,200);assert.equal(result.data.report.snapshot.nhan_su.tong_ho_so,168);
const history=await call('ai/reports',null,admin,env);assert.equal(history.data.reports.length,1);assert(!JSON.stringify(history.data).includes('mock-only'));
assert.equal((await call('ai/generate',{month:'2026-10'},admin,env)).status,429);
sqlite.prepare("DELETE FROM attempts WHERE key LIKE 'ai-%'").run();
const bad=await call('ai/generate',{month:'2026-10'},admin,{OPENAI_API_KEY:'mock-only',AI_FETCH:async()=>new Response('{}',{status:401})});assert.equal(bad.status,502);assert(!bad.data.error.includes('mock-only'));
console.log('PASS AI: quyền truy cập, thiếu cấu hình, tháng hợp lệ, dữ liệu tổng hợp không định danh, store=false, lưu báo cáo, giới hạn tạo, lỗi key không lộ secret.');
if(process.argv.includes('--live')){sqlite.prepare("DELETE FROM attempts WHERE key LIKE 'ai-%'").run();process.stderr.write('Provide key on hidden stdin:\n');if(process.stdin.isTTY)process.stdin.setRawMode(true);let input='';const key=await new Promise((resolve,reject)=>{process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{input+=c;if(input.includes('\u0003'))reject(new Error('Cancelled'));if(/[\r\n]/.test(input)){if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim())}})});const live=await call('ai/generate',{month:'2026-10'},admin,{OPENAI_API_KEY:key});console.log(JSON.stringify({liveStatus:live.status,success:live.status===200,...(live.status===200?{model:live.data.report.model,characters:live.data.report.text.length,usage:live.data.report.usage}:{error:live.data.error})}));if(live.status!==200)process.exitCode=2}
