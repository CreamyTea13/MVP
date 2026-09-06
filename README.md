# Everyday Engine

Everyday Engine is a mobile-first collection of practical calculators that return both a numerical result and a plain-language recommendation.

## Current release: v2.1

- 20 calculator landing pages
- Search/category homepage
- Client-side calculations with no account required
- SEO titles, descriptions, canonical URLs, sitemap, robots.txt, and structured data
- PWA manifest
- About, privacy, terms, contact, and affiliate disclosure pages
- Share-result support using the device share sheet with clipboard fallback
- One central monetization configuration for future affiliate, Plus, support, and analytics links
- Commercial CTAs stay hidden while their URLs are blank
- No database or paid API required

## Build

```bash
npm run build
```

Output directory: `dist`

The base build generates the site and `run-postbuild.mjs` applies the v2.1 launch layer.

## Monetization configuration

The generated site contains `assets/monetization.json`. Empty URLs intentionally render nothing. Only real approved affiliate/payment URLs should be added.

High-intent offer slots are prepared for unit-price comparison, bulk buying, price-per-use, paint, flooring, resale profit, and trip fuel tools.

Vercel Web Analytics is also prepared but disabled until Analytics is enabled for the production Vercel project and the configuration flag is switched on.

## Production status

A Vercel production deployment has been created. External smoke testing confirmed the deployment URL resolves, but Vercel Authentication is currently intercepting public requests. Disable Vercel Authentication for the production project under Settings → Deployment Protection before treating the deployment as publicly launched.
