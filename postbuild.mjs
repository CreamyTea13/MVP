import fs from "node:fs";
import path from "node:path";

const out = path.resolve("dist");
const appPath = path.join(out, "assets", "app.js");
const cssPath = path.join(out, "assets", "styles.css");
const configPath = path.join(out, "assets", "monetization.json");

const config = {
  version: 1,
  analytics: { enabled: false, provider: "vercel" },
  plusUrl: "",
  supportUrl: "",
  offers: {
    "unit-price-compare": { label: "Compare shopping options", url: "" },
    "bulk-buy-checker": { label: "Compare bulk-buy options", url: "" },
    "price-per-use": { label: "Compare product options", url: "" },
    "paint-calculator": { label: "Shop paint-project supplies", url: "" },
    "flooring-calculator": { label: "Shop flooring-project supplies", url: "" },
    "resale-profit": { label: "Explore seller tools", url: "" },
    "trip-fuel-cost": { label: "Explore road-trip tools", url: "" }
  },
  _notes: "Blank URLs keep revenue CTAs hidden. Add only real approved affiliate/payment URLs."
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

let app = fs.readFileSync(appPath, "utf8");
if (!app.includes("async function loadEEConfig()")) {
  const additions = `
let EE_CONFIG = { analytics: { enabled: false }, plusUrl: "", supportUrl: "", offers: {} };

async function loadEEConfig(){
  try{
    EE_CONFIG = ${JSON.stringify(config)};
  }catch(_e){}
  if(EE_CONFIG.analytics?.enabled && EE_CONFIG.analytics?.provider === "vercel"){
    window.va = window.va || function(){ (window.vaq = window.vaq || []).push(arguments); };
    if(!document.querySelector('script[data-ee-analytics]')){
      const script = document.createElement("script");
      script.defer = true;
      script.src = "/_vercel/insights/script.js";
      script.dataset.eeAnalytics = "vercel";
      document.head.appendChild(script);
    }
  }
}

function resultText(){
  const headline = document.getElementById("headline")?.textContent?.trim() || "";
  const details = document.getElementById("details")?.textContent?.trim() || "";
  const recommend = document.getElementById("recommend")?.textContent?.trim() || "";
  return [headline, details, recommend].filter(Boolean).join(" ");
}

function enhanceResult(toolId){
  const result = document.getElementById("result");
  if(!result) return;
  result.querySelector(".result-actions")?.remove();
  result.querySelector(".result-disclosure")?.remove();

  const actions = document.createElement("div");
  actions.className = "result-actions";

  const share = document.createElement("button");
  share.type = "button";
  share.className = "secondary";
  share.textContent = "Share result";
  share.addEventListener("click", async () => {
    const payload = {
      title: document.querySelector("h1")?.textContent || "Everyday Engine",
      text: resultText(),
      url: location.href
    };
    try{
      if(navigator.share){
        await navigator.share(payload);
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(payload.text + "\\n" + payload.url);
        share.textContent = "Copied";
        setTimeout(() => share.textContent = "Share result", 1500);
      }
    }catch(_e){}
  });
  actions.appendChild(share);

  const offer = EE_CONFIG.offers?.[toolId];
  if(offer?.url){
    const link = document.createElement("a");
    link.className = "offer-link";
    link.href = offer.url;
    link.target = "_blank";
    link.rel = "sponsored noopener";
    link.textContent = offer.label || "See relevant options";
    actions.appendChild(link);
  }

  if(EE_CONFIG.plusUrl){
    const plus = document.createElement("a");
    plus.className = "offer-link";
    plus.href = EE_CONFIG.plusUrl;
    plus.textContent = "Everyday Engine Plus";
    actions.appendChild(plus);
  }

  result.appendChild(actions);

  if(offer?.url){
    const disclosure = document.createElement("div");
    disclosure.className = "result-disclosure";
    disclosure.innerHTML = 'Some links may be affiliate links. <a href="/affiliate-disclosure.html">Disclosure</a>.';
    result.appendChild(disclosure);
  }
}
`;
  app = additions.trim() + "\n\n" + app;
  app = app.replace(" output(h,d,r);\n}", " output(h,d,r);\n enhanceResult(id);\n}");
  app = app.replace('document.addEventListener("DOMContentLoaded",()=>{\n', 'document.addEventListener("DOMContentLoaded",()=>{\n loadEEConfig();\n');
  fs.writeFileSync(appPath, app, "utf8");
}

let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".result-actions{")) {
  css += `
.result-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.secondary,.offer-link{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-radius:10px;padding:10px 13px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
.secondary{border:1px solid var(--line);background:#fff;color:var(--ink)}
.offer-link{border:1px solid #111827;background:#111827;color:#fff}
.result-disclosure{margin-top:8px;color:var(--muted);font-size:.76rem;line-height:1.4}
`;
  fs.writeFileSync(cssPath, css, "utf8");
}

const disclosurePath = path.join(out, "affiliate-disclosure.html");
if (!fs.existsSync(disclosurePath)) {
  fs.writeFileSync(disclosurePath, `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Affiliate Disclosure | Everyday Engine</title>
<meta name="description" content="Everyday Engine affiliate disclosure and explanation of how recommendations and compensated links are handled.">
<link rel="stylesheet" href="assets/styles.css"><link rel="icon" href="assets/icon.svg" type="image/svg+xml"><link rel="manifest" href="manifest.webmanifest">
</head><body><div class="shell">
<header><a class="brand" href="./"><span class="mark">EE</span><span><strong>Everyday Engine</strong><br><span class="tagline">Tools that answer everyday questions.</span></span></a></header>
<main class="panel prose"><h1>Affiliate Disclosure</h1>
<p>Everyday Engine may use affiliate links on some calculator pages. If you follow an eligible link and make a purchase, Everyday Engine may receive a commission at no additional cost to you.</p>
<p>Affiliate relationships do not change calculator formulas or determine the numerical results shown by a tool. Relevant commercial links are kept separate from the calculation itself and are only displayed when a real offer has been configured.</p>
<p>At launch, affiliate links may not be active on every page. This disclosure is provided so the site is ready to identify compensated links clearly as monetization is added.</p>
</main>
<footer><div class="footer-links"><a href="about.html">About</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="affiliate-disclosure.html">Affiliate Disclosure</a><a href="contact.html">Contact</a></div>
<div>Everyday Engine. Calculations are estimates. Verify important financial decisions independently.</div></footer>
</div></body></html>`, "utf8");
}

for (const file of walk(out).filter(x => x.endsWith(".html"))) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("Affiliate Disclosure") && html.includes(">Terms</a>")) {
    const prefix = file.includes(`${path.sep}tools${path.sep}`) ? "../../" : "";
    html = html.replace(/(<a href="[^"]*terms\.html">Terms<\/a>)/, `$1\n        <a href="${prefix}affiliate-disclosure.html">Affiliate Disclosure</a>`);
    fs.writeFileSync(file, html, "utf8");
  }
}

const rawBase = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
const base = rawBase ? (rawBase.startsWith("http") ? rawBase : `https://${rawBase}`).replace(/\/+$/, "") : "";
const htmlFiles = walk(out).filter(f => f.endsWith(".html") && !f.endsWith("404.html"));
if (base) {
  for (const file of htmlFiles) {
    const rel = path.relative(out, file).split(path.sep).join("/");
    const route = rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "");
    let html = fs.readFileSync(file, "utf8");
    if (!html.includes('rel="canonical"')) {
      html = html.replace("</head>", `<link rel="canonical" href="${base}${route}"></head>`);
      fs.writeFileSync(file, html, "utf8");
    }
  }
  const urls = htmlFiles.map(file => {
    const rel = path.relative(out, file).split(path.sep).join("/");
    const route = rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "");
    return `  <url><loc>${base}${route}</loc></url>`;
  }).join("\n");
  fs.writeFileSync(path.join(out, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8");
  fs.writeFileSync(path.join(out, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
    "utf8");
}

function walk(dir){
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

console.log("Applied Everyday Engine v2.1 launch layer.");
