import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const base = 'https://everyday-engine-tylerkapp13-5747.vercel.app';
const out = 'dist';
let js = fs.readFileSync('dist/assets/app.js','utf8');
js = js.replace('cheaper=au<bu?"Option A":"Option B",diff=Math.abs(au-bu)/Math.max(au,bu)*100;', 'cheaper=au<bu?"Option A":"Option B",diff=Math.max(au,bu)?Math.abs(au-bu)/Math.max(au,bu)*100:0;if(au===bu){output("Same unit price",`Both options cost ${money(au)} per unit.`,"Choose based on quality, storage, and how much you will use.");enhanceResult(id);return;}');
js = js.replace('h=`About ${months} months to payoff`;', 'if(b>0.01){output("Payoff exceeds 100 years","This payment does not produce a practical payoff within the calculator limit.","Try a larger payment.");return;}h=`About ${months} months to payoff`;');
js = js.replace('boxes=Math.ceil(need/box)', 'boxes=Math.ceil(need/box-Number.EPSILON*Math.abs(need/box)*2)');
fs.writeFileSync('dist/assets/app.js',js);
execFileSync(process.execPath,['--check','dist/assets/app.js']);
const delivery = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>Your Plus download | Everyday Engine</title><link rel="stylesheet" href="../assets/styles.css"></head><body><div class="shell"><header><a class="brand" href="../">Everyday Engine</a></header><main class="panel prose"><h1>Your Plus download</h1><p>We verify your payment before making the download available.</p><form id="purchaseForm"><label for="purchaseReference">Purchase reference</label><input id="purchaseReference" name="purchaseReference" autocomplete="off" spellcheck="false" maxlength="250" required placeholder="The cs_ reference from your checkout return"><button class="primary" type="submit">Verify purchase</button></form><p id="deliveryStatus" role="status" aria-live="polite">Return here from your successful checkout, or enter your purchase reference.</p><button id="downloadPlus" class="primary" hidden>Download Everyday Engine Plus</button><p>Keep your checkout return link private. Download access expires after ten minutes; verify again to renew it. If payment is still processing, wait a moment and retry. Do not purchase again.</p><h2>Open your toolkit</h2><p>Save the ZIP, extract it, and open index.html in your browser. On Android, use your file manager to extract the ZIP and choose a browser to open the HTML file. Device support for local HTML files varies. Keep an extra copy of the download.</p><p><a href="../contact.html">Need help?</a> Never post a payment reference or receipt in a public issue.</p></main></div><script type="module" src="../assets/commerce.js"></script></body></html>`;
fs.mkdirSync('dist/fulfillment',{recursive:true}); fs.writeFileSync('dist/fulfillment/index.html',delivery);
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
for (const file of walk(out).filter(f=>f.endsWith('.html'))) {
  let html=fs.readFileSync(file,'utf8'); const route='/' + path.relative(out,file).replace(/index\.html$/,'');
  const isPrivate=route.startsWith('/fulfillment/')||route.startsWith('/plus/');
  html=html.replace(/<link rel="canonical"[^>]*>/g,'');
  if(!isPrivate)html=html.replace('</head>',`<link rel="canonical" href="${base}${route}"></head>`);
  if (process.env.EE_PREVIEW === '1') html=html.replace(/<meta name="robots"[^>]*>/g,'<meta name="robots" content="noindex,nofollow">');
  if(route==='/plus/') {
    html=html.replaceAll('id="plusCheckout"','data-plus-checkout');
    html=html.replace('</body>','<p class="shell" id="commerceStatus" role="status">Purchases are temporarily unavailable while secure delivery is verified.</p><script type="module" src="../assets/commerce.js"></script></body>');
  }
  fs.writeFileSync(file,html);
}
const css='\n[hidden]{display:none!important}input{max-width:100%;box-sizing:border-box}button,a{touch-action:manipulation}:focus-visible{outline:3px solid #2563eb;outline-offset:3px}#purchaseReference{width:100%;margin:12px 0}#deliveryStatus{overflow-wrap:anywhere}\n';
fs.appendFileSync('dist/assets/styles.css',css);
fs.writeFileSync('dist/robots.txt',process.env.EE_PREVIEW==='1'?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /fulfillment/\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
const publicPages=walk(out).filter(f=>f.endsWith('.html')&&!/\/(fulfillment|plus)\//.test(f)&&!f.endsWith('404.html'));
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(f=>`<url><loc>${base}/${path.relative(out,f).replace(/index\.html$/,'')}</loc></url>`).join('')}</urlset>`);
if(process.env.EE_PREVIEW==='1')fs.writeFileSync('dist/qa-mobile.html','<!doctype html><html lang="en"><head><meta name="robots" content="noindex,nofollow"><title>Mobile QA</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><h1>Mobile viewport verification</h1><iframe id="mobile" title="Everyday Engine at 375 pixels" src="./" width="375" height="667" style="border:1px solid #ddd"></iframe></body></html>');
// Paid artifacts and secret-bearing server files must never enter static output.
if(walk(out).some(f=>/\.(zip|env|map)$/.test(f)||f.includes('/backend/')))throw Error('Unsafe public build output');
console.log('Launch guardrails applied; paid checkout remains disabled.');
