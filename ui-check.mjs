import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Dell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1100}});
const testEmail='ui-'+Date.now()+'@minhphat.vn';const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:4173');await page.locator('#login-form').waitFor();await page.locator('#login-form button.primary').click();await page.getByText('Tổng quan nhân sự',{exact:true}).waitFor();await page.screenshot({path:'dashboard.png',fullPage:true});
await page.locator('nav [data-view=employees]').click();await page.locator('#search').fill('Minh Anh');await page.getByRole('button',{name:'Xem',exact:true}).first().click();await page.locator('dialog[open]').waitFor();await page.getByRole('button',{name:'Đóng',exact:true}).click();
await page.locator('[data-action=add]').click();await page.locator('#record-form [name=name]').fill('Nhân viên kiểm thử UI');await page.locator('#record-form [name=email]').fill(testEmail);await page.locator('#record-form button[type=submit]').click();await page.locator('dialog[open]').waitFor({state:'hidden'});
await page.locator('#search').fill(testEmail);await page.getByText('Nhân viên kiểm thử UI',{exact:true}).waitFor();
const download=page.waitForEvent('download');await page.locator('[data-action=export]').click();const f=await download;await f.saveAs('ui-export.xlsx');
await page.locator('[data-action=import]').click();await page.locator('#import-file').setInputFiles('ui-export.xlsx');await page.locator('[data-action=confirm-import]').waitFor();await page.locator('[data-action=confirm-import]').click();await page.locator('dialog[open]').waitFor({state:'hidden'});
for(const k of ['departments','titles','contracts','attendance','leaves','recruitment','reports','audit','settings']){await page.locator(`[data-view=${k}]`).first().click();await page.locator('#content').waitFor()}
await page.setViewportSize({width:390,height:844});await page.locator('[data-action=menu]').click();await page.locator('nav [data-view=dashboard]').click();await page.locator('[data-action=menu]').click();await page.screenshot({path:'mobile.png',fullPage:true});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)errors.push('Mobile page overflow');console.log(JSON.stringify({errors,download:f.suggestedFilename(),result:errors.length?'FAIL':'PASS'}));await browser.close();if(errors.length)process.exit(1);

