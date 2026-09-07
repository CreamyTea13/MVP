import { router, json, secrets } from '@appdeploy/sdk';
import { CATALOG, FulfillmentError, sessionMode, verifyPurchase, issueReceipt, readReceipt } from './fulfillment.mjs';
import { archiveBase64, archiveSha256 } from './product.mjs';

// Promotion changes these flags only after recorded end-to-end verification.
const ENABLE_LIVE_CHECKOUT = false;
const ENABLE_TEST_CHECKOUT = false;
const ALLOW_TEST_FULFILLMENT = true;
const secretName = (mode: string) => mode === 'live' ? 'STRIPE_LIVE_READ_KEY' : 'STRIPE_TEST_READ_KEY';
const guarded = (fn: (body: any) => Promise<unknown>) => async ({ body }: { body: unknown }) => {
  try { const response = json(await fn(body)); response.headers['Cache-Control'] = 'private, no-store'; response.headers['Referrer-Policy'] = 'no-referrer'; response.headers['X-Content-Type-Options'] = 'nosniff'; return response; }
  catch (e) { const known = e instanceof FulfillmentError; const response = json({ error: known ? e.message : 'delivery_unavailable' }, known ? e.status : 503); response.headers['Cache-Control'] = 'private, no-store'; return response; }
};
export const handler = router({
  'GET /api/_healthcheck': [guarded(async () => ({ ok: true }))],
  'GET /api/commerce/status': [guarded(async () => {
    const names = await secrets.listSecretNames();
    const mode = ENABLE_LIVE_CHECKOUT ? 'live' : 'test';
    const enabled = (ENABLE_LIVE_CHECKOUT || ENABLE_TEST_CHECKOUT) && names.includes(secretName(mode));
    return { checkoutEnabled: enabled, checkoutUrl: enabled ? CATALOG[mode].url : null, testMode: !ENABLE_LIVE_CHECKOUT };
  })],
  'POST /api/fulfillment/redeem': [guarded(async body => {
    const id = body?.sessionId;
    const mode = sessionMode(id);
    if (mode === 'test' && !ALLOW_TEST_FULFILLMENT) throw new FulfillmentError('payment_not_verified');
    const key = await secrets.readSecret(secretName(mode));
    const purchase = await verifyPurchase(id, mode, key);
    return { receipt: issueReceipt(purchase, key), expiresIn: 600, testMode: mode === 'test' };
  })],
  'POST /api/fulfillment/download': [guarded(async body => {
    if (!['test', 'live'].includes(body?.mode)) throw new FulfillmentError('invalid_download_reference');
    if (body.mode === 'test' && !ALLOW_TEST_FULFILLMENT) throw new FulfillmentError('payment_not_verified');
    const key = await secrets.readSecret(secretName(body.mode));
    const purchase = readReceipt(body?.receipt, key);
    if (purchase.mode !== body.mode) throw new FulfillmentError('payment_not_verified');
    await verifyPurchase(purchase.sessionId, purchase.mode, key);
    return { filename: 'everyday-engine-plus-v1.zip', archiveBase64, sha256: archiveSha256 };
  })]
});
