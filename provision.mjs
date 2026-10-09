import {DatabaseSync} from 'node:sqlite';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
const rl=createInterface({input:stdin,output:stdout});
const email=await rl.question('Email Admin: ');const name=await rl.question('Tên Admin: ');
const password=process.env.HR_ADMIN_PASSWORD;if(!password||password.length<12)throw new Error('Cấu hình HR_ADMIN_PASSWORD ít nhất 12 ký tự trong môi trường chạy.');
const salt=crypto.randomUUID();const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const hash=Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)).toString('hex');
const db=new DatabaseSync('data/hr.sqlite');const id=crypto.randomUUID();db.prepare('INSERT INTO users(id,email,name,role,employee_id,salt,hash) VALUES(?,?,?,?,?,?,?)').run(id,email.toLowerCase(),name,'admin','bootstrap',salt,hash);console.log('Đã tạo Admin. Thêm hồ sơ và các tài khoản trong giao diện Tài khoản.');rl.close();
