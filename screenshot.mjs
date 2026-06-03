import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto('http://localhost:3000/');
await page.screenshot({ path: '/tmp/meal-home.png', fullPage: true });
console.log('Home page screenshotted');

await page.goto('http://localhost:3000/parent');
await page.screenshot({ path: '/tmp/meal-parent.png', fullPage: true });
console.log('Parent page screenshotted');

await page.goto('http://localhost:3000/admin');
await page.screenshot({ path: '/tmp/meal-admin.png', fullPage: true });
console.log('Admin page screenshotted');

const menuRes = await page.request.get('http://localhost:3000/api/menu');
console.log('GET /api/menu:', menuRes.status(), JSON.stringify(await menuRes.json()));

const ordersRes = await page.request.get('http://localhost:3000/api/orders');
console.log('GET /api/orders:', ordersRes.status(), JSON.stringify(await ordersRes.json()));

await browser.close();
