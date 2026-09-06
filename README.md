# Everyday Engine

Everyday Engine is a mobile-first collection of practical calculators that return both a numerical result and a plain-language recommendation.

## Current release: v4.0

- 20 separate calculator landing pages across Shopping, Work, Auto, Money, Home, and Side Hustle
- Search/category homepage and internal related-tool links
- Client-side calculations with no account required
- SEO titles, descriptions, canonical URLs, sitemap, robots.txt, and structured data
- PWA manifest
- About, privacy, terms, contact, and affiliate disclosure pages
- Share-result support using the device share sheet with clipboard fallback
- One central monetization configuration for future affiliate, Plus, support, and analytics links
- Commercial CTAs stay hidden while their URLs are blank
- No database or paid API required

## Production

Public production site:

https://everyday-engine-tylerkapp13-5747.vercel.app

The v4 deployment has been independently smoke-tested from GitHub Actions. The homepage, representative calculator routes, disclosure page, application JavaScript, monetization configuration, robots.txt, and sitemap all return HTTP 200 with their expected content.

## Build

```bash
npm run build
```

Output directory: `dist`

The base build generates the calculator site and the post-build step applies the v2.1 launch layer used by v4, including sharing, disclosure, and monetization configuration.

## Vercel routing

v4 intentionally uses only `buildCommand` and `outputDirectory` in `vercel.json`. The former `cleanUrls` plus `trailingSlash` combination was removed after it caused nested calculator routes to return 404 despite being present in the build output.

## Monetization

The generated site contains `assets/monetization.json`. Empty URLs intentionally render nothing. Only real approved affiliate/payment URLs should be added.

Everyday Engine Plus has a live $9 one-time Stripe price prepared, but the public Plus CTA remains hidden until the Stripe account onboarding is completed and a working Payment Link is available.

Vercel Web Analytics is prepared in the client code but remains disabled until Web Analytics is enabled for the production Vercel project.
