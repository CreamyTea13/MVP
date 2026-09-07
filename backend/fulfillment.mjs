import { createHmac, timingSafeEqual } from 'node:crypto';

export const CATALOG = Object.freeze({
  test: { account: 'acct_1UCUDqATGWlp7q2X', price: 'price_1UChcPATGWlp7q2XejrhLFs8', product: 'prod_VD7sAlDgtYa9Dt', link: 'plink_1UChcZATGWlp7q2Xo9c2QaBS', url: 'https://buy.stripe.com/test_eVq3cu1GlfBWaFf1vZ5Ne00' },
  live: { account: 'acct_1UCUDfA3puPpy1Pg', price: 'price_1UCUQbA3puPpy1PgP9CQj3l7', product: 'prod_VCuFaGD6fYcVcP', link: 'plink_1UChjEA3puPpy1PgWPD37nCc', url: 'https://buy.stripe.com/cNi7sK3E0dC7bYnalX9sk00' }
});
export class FulfillmentError extends Error {
  constructor(code, status = 403) { super(code); this.status = status; }
}
const deny = (code = 'payment_not_verified', status = 403) => { throw new FulfillmentError(code, status); };
const idOf = value => typeof value === 'string' ? value : value?.id;
export function sessionMode(id) {
  if (typeof id !== 'string' || !/^cs_(test|live)_[A-Za-z0-9]{12,240}$/.test(id)) deny('invalid_purchase_reference', 400);
  return id.startsWith('cs_live_') ? 'live' : 'test';
}
export function validatePayment(session, items, mode, id) {
  const expected = CATALOG[mode];
  if (!expected || session.id !== id || session.livemode !== (mode === 'live') || session.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid' || idOf(session.payment_link) !== expected.link || session.currency !== 'usd' || session.amount_subtotal !== 900 || !Number.isSafeInteger(session.amount_total) || session.amount_total < 900 || (session.total_details?.amount_discount ?? 0) !== 0) deny();
  if (items.has_more !== false || items.data?.length !== 1) deny();
  const item = items.data[0];
  if (item.quantity !== 1 || item.price?.id !== expected.price || idOf(item.price?.product) !== expected.product || item.price?.unit_amount !== 900 || item.price?.currency !== 'usd' || item.price?.livemode !== (mode === 'live') || item.amount_subtotal !== 900 || item.amount_discount !== 0) deny();
  const pi = session.payment_intent;
  const charge = pi?.latest_charge;
  if (!pi || pi.status !== 'succeeded' || pi.currency !== 'usd' || pi.livemode !== (mode === 'live') || pi.amount_received < session.amount_total || !charge || charge.paid !== true || charge.status !== 'succeeded' || charge.refunded !== false || charge.amount_refunded !== 0 || charge.disputed !== false) deny();
  return { sessionId: id, mode };
}
export async function verifyPurchase(id, mode, key, request = fetch) {
  if (sessionMode(id) !== mode || !CATALOG[mode]) deny();
  if (typeof key !== 'string' || !new RegExp('^[rs]k_' + mode + '_[A-Za-z0-9]+$').test(key)) deny('delivery_unavailable', 503);
  const get = async suffix => {
    let response;
    try { response = await request('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id) + suffix, { headers: { Authorization: 'Bearer ' + key, 'Stripe-Version': '2026-07-29.dahlia' }, signal: AbortSignal.timeout(10000) }); }
    catch { deny('verification_unavailable', 503); }
    if (!response.ok) deny(response.status === 404 ? 'payment_not_verified' : 'verification_unavailable', response.status === 404 ? 403 : 503);
    try { return await response.json(); } catch { deny('verification_unavailable', 503); }
  };
  const session = await get('?expand[]=payment_intent.latest_charge');
  const items = await get('/line_items?limit=2');
  return validatePayment(session, items, mode, id);
}
const sign = (payload, key) => createHmac('sha256', key).update('everyday-engine-download-v1.' + payload).digest('base64url');
export function issueReceipt(purchase, key, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ v: 1, ...purchase, exp: Math.floor(now / 1000) + 600 })).toString('base64url');
  return payload + '.' + sign(payload, key);
}
export function readReceipt(token, key, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 1200) deny('invalid_download_reference');
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) deny('invalid_download_reference');
  const signature = Buffer.from(sign(parts[0], key));
  const supplied = Buffer.from(parts[1]);
  if (signature.length !== supplied.length || !timingSafeEqual(signature, supplied)) deny('invalid_download_reference');
  let data;
  try { data = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); } catch { deny('invalid_download_reference'); }
  if (data.v !== 1 || !Number.isInteger(data.exp) || data.exp <= Math.floor(now / 1000) || data.exp > Math.floor(now / 1000) + 600 || sessionMode(data.sessionId) !== data.mode) deny('download_reference_expired');
  return data;
}
