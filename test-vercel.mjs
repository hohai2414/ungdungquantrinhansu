import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createD1Adapter} from './server/libsql.js';
import {migrate} from './scripts/migrate-vercel.mjs';
import {createHandler} from './api/index.js';
const root=mkdtempSync(join(tmpdir(),'hr-vercel-'));const file=pathToFileURL(join(root,'test.sqlite')).href;
let client=createClient({url:file});await migrate(client);await migrate(client);let db=createD1Adapter(client);
const handler=createHandler({database:()=>db,env:{DEMO_MODE:'true'}});
async function request(path,{method='GET',body,cookie='',handlerOverride=handler}={}){
 let data;const headers={};const res={statusCode:200,setHeader(k,v){headers[k.toLowerCase()]=v},end(v){data=Buffer.from(v).toString()}};
 await handlerOverride({url:'/api/index?__path='+encodeURIComponent(path),query:{__path:path},method,headers:{host:'test.vercel.app',origin:'https://test.vercel.app',cookie,...(body?{'content-type':'application/json'}:{})},...(body?{body}:{})},res);
 return {status:res.statusCode,headers,data:JSON.parse(data)};
}
const config=JSON.parse(readFileSync('vercel.json','utf8'));assert.equal(config.outputDirectory,'public');assert(existsSync('public/index.html'));assert(readFileSync('public/index.html','utf8').includes('Nhân sự'));
assert.equal((await request('state')).status,401);
const login=await request('login',{method:'POST',body:{email:'admin@demo.vn',password:'NhanSu@2026'}});assert.equal(login.status,200);assert(login.headers['set-cookie'].includes('Secure'));const cookie=login.headers['set-cookie'].split(';')[0];
assert.equal((await request('state',{cookie})).data.data.employees.length,168);
assert.equal((await request('save',{method:'POST',cookie,body:{kind:'departments',record:{name:'Kiểm thử Vercel'}}})).status,200);
client.close();client=createClient({url:file});db=createD1Adapter(client);assert((await request('state',{cookie})).data.data.departments.some(d=>d.name==='Kiểm thử Vercel'));
const user=await request('login',{method:'POST',body:{email:'employee@demo.vn',password:'NhanSu@2026'}});assert.equal(user.status,200);const userCookie=user.headers['set-cookie'].split(';')[0];assert.equal((await request('state',{cookie:userCookie})).data.data.employees.length,1);assert.equal((await request('save',{method:'POST',cookie:userCookie,body:{kind:'departments',record:{name:'Cấm sửa'}}})).status,403);assert.equal((await request('ai/reports',{cookie:userCookie})).status,403);
const missing=await request('state',{handlerOverride:createHandler({env:{}})});assert.equal(missing.status,503);assert(missing.data.error.includes('TURSO_DATABASE_URL'));
await assert.rejects(db.batch([db.prepare('INSERT INTO audit(id,actor,action,at) VALUES(?,?,?,?)').bind('rollback-test','test','test','now'),db.prepare('INSERT INTO table_does_not_exist VALUES(?)').bind('x')]));assert.equal(await db.prepare('SELECT id FROM audit WHERE id=?').bind('rollback-test').first(),null);
client.close();console.log('PASS Vercel: public output, rewrites, migration idempotent, login cookie Secure, server permissions, data/session persistence after reconnect, atomic batch rollback, missing DB configuration.');
