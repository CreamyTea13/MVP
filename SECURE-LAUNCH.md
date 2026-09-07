# Everyday Engine secure launch candidate

Status: NOT ready to accept payments. Do not merge or enable checkout until the gates below pass.

## Preserved production

- GitHub main: 8f182c04ee1fc4804fbab8528b1cbe107f27af30.
- Canonical: https://everyday-engine-tylerkapp13-5747.vercel.app/
- Existing AppDeploy: everyday-engine-rqlvuu, version 1788707573339.
- Isolated candidate: https://everyday-engine-secure-candidate-twoedz.v2.appdeploy.ai/
- Live Stripe payment link plink_1UChjEA3puPpy1PgWPD37nCc was already inactive and remains inactive.

## Implementation

The AppDeploy backend reads restricted Stripe keys from its secrets vault. The browser sends the checkout session reference through the AppDeploy client transport. Server-side Stripe retrieval checks the exact payment link, product, price, quantity, currency, subtotal, completed paid status, captured payment, refunds, disputes, and test/live mode. The session reference is removed from the browser address bar and retained only in optional session storage.

Successful verification creates an HMAC-signed receipt valid for ten minutes. Signing is domain-separated from other key uses. A download request verifies the receipt and retrieves current payment status again before returning the archive. Changing/rotating the Stripe read key invalidates outstanding receipts; re-verifying a purchase renews access. Neither the ZIP nor its base64 payload is included in static output or this public repository. The browser checks the archive SHA-256 before saving it.

Fulfillment is on-demand and idempotent: repeated requests re-check Stripe and do not create orders or send mail. This candidate does not claim webhook-based delivery or email recovery. A customer must retain their checkout return reference or downloaded file. Private customer support/recovery must be configured before commercial release; the public GitHub issue tracker is not suitable for receipt details.

The private product module is preserved in the AppDeploy candidate snapshot as backend/product.mjs and is intentionally gitignored. Its rebuilt ZIP contains 30 calculators, local favorites/history, CSV export, and README instructions. The previous archive failed ZIP validation. The new archive passes extraction and JavaScript parsing. Android local-HTML handling varies; verify on a real device before advertising universal phone support.

## Build and tests

The GitHub source build uses the existing static generator. Run:

    node build.mjs
    node run-postbuild.mjs
    node seo-v42.mjs
    node plus-v43.mjs
    node launch-layer.mjs
    node --test tests/*.test.mjs

AppDeploy additionally runs Vite in library mode to bundle src/commerce.ts into assets/commerce.js. AppDeploy injects @appdeploy/client and @appdeploy/sdk. Its package build command appends vite build; the public GitHub base package remains unchanged. Do not deploy this backend as a Vercel function without a separate adapter and private product provisioning. The launch candidate is intentionally isolated from GitHub main and canonical production.

Local verification: 39 automated tests pass (20 free-tool examples, two numerical guardrail tests, 17 fulfillment tests). Ten additional premium calculator examples pass separately. The paid fixture test uses mocked Stripe responses; it is NOT a completed Stripe sandbox checkout.

## Access and configuration blockers

1. Vercel connector lists no teams and get_project(everyday-engine, tylerkapp13-5747) returns 403. No Vercel deployment was promoted, replaced, paused, or removed.
2. AppDeploy candidate requires STRIPE_TEST_READ_KEY from the Everyday Engine sandbox account acct_1UCUDqATGWlp7q2X. Use a restricted key with read-only access to Checkout Sessions, Prices/Products, PaymentIntents, and Charges as needed for the expansions. No write permissions are needed. Submit only through AppDeploy's secure entry page; never chat or source files.
3. After successful sandbox testing, bind equivalent STRIPE_LIVE_READ_KEY from acct_1UCUDfA3puPpy1Pg. Never use a sandbox key for production.
4. The connected Stripe API does not expose restricted-key creation. AppDeploy only binds values submitted via its secure secret-entry workflow.

## Required release gates

1. Configure sandbox read key, verify actual API permissions, and keep ENABLE_LIVE_CHECKOUT=false.
2. Update the existing sandbox Payment Link's redirect to the verified candidate /fulfillment/?session_id={CHECKOUT_SESSION_ID}. Complete a $9 test-card Checkout. Confirm verification, archive download, SHA-256, extraction, 30 calculators, favorites/history and CSV. Exercise decline, cancelled checkout, unpaid/processing payment, wrong product, refund, forged receipt and expiry cases. Test purchases only; no live charge is authorized.
3. Validate the live read key against the correct Stripe account and configured live product/price without charging. Confirm Managed Payments account readiness and merchant/support settings. Preserve the existing Managed Payments tax configuration; do not silently switch merchant-of-record or enable paid features.
4. Configure private customer support and recovery. Do not request customer payment data through public GitHub issues.
5. Compare verified candidate against working production. Promote only after desktop/mobile end-to-end QA passes and the Vercel connection is restored. Retain a rollback deployment.
6. Disable ALLOW_TEST_FULFILLMENT on the production backend. Point the live Payment Link to the final verified fulfillment origin. Enable live checkout only after the paid-delivery and production gates pass, then re-check live link active status and the customer-visible checkout without charging.
7. Canonical search: confirm every sitemap URL and ownership-key file on the promoted Vercel alias, then run scripts/indexnow.mjs. Accept HTTP 200 and 202; neither guarantees indexing. Add Google/Bing webmaster ownership when account access allows. Keep all candidate, fulfillment and API URLs out of indexing.

No purchases, ads, domains, paid subscriptions, or live test charges were made.

## Final checkpoint, 2026-09-07

GitHub PR #1 is a draft; independent GitHub CI passed. Desktop unit-price comparison and mobile 375px-frame category/navigation/paint calculation passed. Mobile document width equals scroll width (no horizontal overflow). Invalid purchase references are visibly rejected without offering a download. AppDeploy reports ready with no frontend/network/backend errors, but does not return a completed E2E test-suite record; do not call the entire paid flow verified.

The existing sandbox Payment Link now redirects to the candidate /fulfillment/ route with CHECKOUT_SESSION_ID. Live checkout remains inactive. The canonical IndexNow ownership key was checked and returns 404; no submission was sent. Secure-entry forms were prepared for the sandbox and live restricted read keys. No keys have been submitted or bound yet.
