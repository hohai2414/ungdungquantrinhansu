import {createClient} from '@libsql/client';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
export async function migrate(client,directory=new URL('../drizzle/',import.meta.url)){
  await client.execute('CREATE TABLE IF NOT EXISTS vercel_migrations(name TEXT PRIMARY KEY, hash TEXT NOT NULL)');
  for(const name of readdirSync(directory).filter(f=>f.endsWith('.sql')).sort()){
    const sql=readFileSync(new URL(name,directory),'utf8');const hash=createHash('sha256').update(sql).digest('hex');
    const existing=await client.execute({sql:'SELECT hash FROM vercel_migrations WHERE name=?',args:[name]});
    if(existing.rows.length){if(existing.rows[0].hash!==hash)throw new Error('Migration đã áp dụng bị thay đổi: '+name);continue}
    const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
    await client.batch([...statements,{sql:'INSERT INTO vercel_migrations(name,hash) VALUES(?,?)',args:[name,hash]}],'write');
    console.log('Migration: '+name);
  }
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/migrate-vercel.mjs')){
  if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw new Error('Cần TURSO_DATABASE_URL và TURSO_AUTH_TOKEN.');
  const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});try{await migrate(client);console.log('Cơ sở dữ liệu Vercel đã sẵn sàng.')}finally{client.close()}
}
